import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { menuApi } from '../lib/api'
import {
  MenuItem,
  MenuQueryParams,
  MenuItemCreate,
  MenuItemUpdate,
  MenuImportResult,
} from '../types'
import {
  menuItemCreateSchema,
  menuItemUpdateSchema,
} from '../lib/validations'

// Query keys for cache management
export const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (tenantId: string, params?: MenuQueryParams) =>
    [...menuKeys.lists(), tenantId, params] as const,
}

// Context types for optimistic updates
interface MenuItemMutationContext {
  previousItems: MenuItem[] | undefined
}

/**
 * Hook to fetch list of menu items
 */
export function useMenuItems(
  params?: MenuQueryParams,
  options?: Omit<UseQueryOptions<MenuItem[]>, 'queryKey' | 'queryFn'>
) {
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: menuKeys.list(tenantId!, params),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return menuApi.list(tenantId, params)
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Mutation hook to create a menu item
 * Includes Zod validation and optimistic updates
 */
export function useCreateMenuItem() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation<MenuItem, Error, MenuItemCreate, MenuItemMutationContext>({
    mutationFn: async (data: MenuItemCreate) => {
      // Validate input data with Zod
      const validated = menuItemCreateSchema.parse(data)
      if (!tenantId) throw new Error('No tenant ID available')
      return menuApi.create(tenantId, validated)
    },
    onMutate: async (newItem): Promise<MenuItemMutationContext> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: menuKeys.lists() })

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<MenuItem[]>(
        menuKeys.list(tenantId!, {})
      )

      // Optimistically add the new item with a temporary ID
      if (previousItems) {
        const optimisticItem: MenuItem = {
          id: `temp-${Date.now()}`,
          tenant_id: tenantId!,
          name: newItem.name,
          description: newItem.description ?? null,
          price_cents: newItem.price_cents,
          category: newItem.category ?? null,
          image_url: newItem.image_url ?? null,
          is_active: newItem.is_active ?? true,
          is_available: newItem.is_available ?? true,
          dietary_tags: newItem.dietary_tags ?? [],
          allergens: newItem.allergens ?? [],
          preparation_time_minutes: newItem.preparation_time_minutes ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData(menuKeys.list(tenantId!, {}), [
          ...previousItems,
          optimisticItem,
        ])
      }

      // Return context with the previous value for rollback
      return { previousItems }
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          menuKeys.list(tenantId!, {}),
          context.previousItems
        )
      }
    },
    onSettled: () => {
      // Always invalidate and refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}

/**
 * Mutation hook to update a menu item
 * Includes Zod validation and optimistic updates
 */
export function useUpdateMenuItem() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation<
    MenuItem,
    Error,
    { itemId: string; update: MenuItemUpdate },
    MenuItemMutationContext
  >({
    mutationFn: async ({
      itemId,
      update,
    }: {
      itemId: string
      update: MenuItemUpdate
    }) => {
      // Validate input data with Zod
      const validated = menuItemUpdateSchema.parse(update)
      if (!tenantId) throw new Error('No tenant ID available')
      return menuApi.update(tenantId, itemId, validated)
    },
    onMutate: async ({ itemId, update }): Promise<MenuItemMutationContext> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: menuKeys.lists() })

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<MenuItem[]>(
        menuKeys.list(tenantId!, {})
      )

      // Optimistically update the item
      if (previousItems) {
        queryClient.setQueryData(
          menuKeys.list(tenantId!, {}),
          previousItems.map((item) =>
            item.id === itemId
              ? { ...item, ...update, updated_at: new Date().toISOString() }
              : item
          )
        )
      }

      // Return context with the previous value for rollback
      return { previousItems }
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          menuKeys.list(tenantId!, {}),
          context.previousItems
        )
      }
    },
    onSettled: () => {
      // Always invalidate and refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}

/**
 * Mutation hook to delete a menu item
 * Includes optimistic updates
 */
export function useDeleteMenuItem() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation<void, Error, string, MenuItemMutationContext>({
    mutationFn: async (itemId: string) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return menuApi.delete(tenantId, itemId)
    },
    onMutate: async (itemId): Promise<MenuItemMutationContext> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: menuKeys.lists() })

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<MenuItem[]>(
        menuKeys.list(tenantId!, {})
      )

      // Optimistically remove the item
      if (previousItems) {
        queryClient.setQueryData(
          menuKeys.list(tenantId!, {}),
          previousItems.filter((item) => item.id !== itemId)
        )
      }

      // Return context with the previous value for rollback
      return { previousItems }
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          menuKeys.list(tenantId!, {}),
          context.previousItems
        )
      }
    },
    onSettled: () => {
      // Always invalidate and refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}

/**
 * Mutation hook to import menu items from CSV
 */
export function useImportMenuCSV() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation<MenuImportResult, Error, File>({
    mutationFn: async (file: File) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return menuApi.importCSV(tenantId, file)
    },
    onSuccess: () => {
      // Invalidate and refetch menu items list
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}
