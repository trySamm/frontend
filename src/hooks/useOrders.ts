import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { ordersApi } from '../lib/api'
import {
  Order,
  OrdersQueryParams,
  OrderStatusUpdate,
  PaginatedResponse,
} from '../types'
import { orderStatusUpdateSchema } from '../lib/validations'

// Query keys for cache management
export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (tenantId: string, params?: OrdersQueryParams) =>
    [...ordersKeys.lists(), tenantId, params] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (tenantId: string, orderId: string) =>
    [...ordersKeys.details(), tenantId, orderId] as const,
}

// Context type for optimistic updates
interface OrderMutationContext {
  previousOrders: PaginatedResponse<Order> | undefined
  previousOrder: Order | undefined
}

/**
 * Hook to fetch paginated list of orders
 */
export function useOrders(
  params?: OrdersQueryParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Order>>,
    'queryKey' | 'queryFn'
  >
) {
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: ordersKeys.list(tenantId!, params),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return ordersApi.list(tenantId, params) as Promise<PaginatedResponse<Order>>
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(
  orderId: string,
  options?: Omit<UseQueryOptions<Order>, 'queryKey' | 'queryFn'>
) {
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: ordersKeys.detail(tenantId!, orderId),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return ordersApi.get(tenantId, orderId)
    },
    enabled: !!tenantId && !!orderId,
    ...options,
  })
}

/**
 * Mutation hook to update order status
 * Includes Zod validation and optimistic updates
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation<
    Order,
    Error,
    { orderId: string; update: OrderStatusUpdate },
    OrderMutationContext
  >({
    mutationFn: async ({
      orderId,
      update,
    }: {
      orderId: string
      update: OrderStatusUpdate
    }) => {
      // Validate input data with Zod
      const validated = orderStatusUpdateSchema.parse(update)
      if (!tenantId) throw new Error('No tenant ID available')
      return ordersApi.update(tenantId, orderId, validated)
    },
    onMutate: async ({ orderId, update }): Promise<OrderMutationContext> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ordersKeys.lists() })
      await queryClient.cancelQueries({
        queryKey: ordersKeys.detail(tenantId!, orderId),
      })

      // Snapshot the previous values
      const previousOrders = queryClient.getQueryData<PaginatedResponse<Order>>(
        ordersKeys.list(tenantId!, {})
      )
      const previousOrder = queryClient.getQueryData<Order>(
        ordersKeys.detail(tenantId!, orderId)
      )

      // Optimistically update the order in the list
      if (previousOrders) {
        queryClient.setQueryData(ordersKeys.list(tenantId!, {}), {
          ...previousOrders,
          items: previousOrders.items.map((order) =>
            order.id === orderId
              ? { ...order, ...update, updated_at: new Date().toISOString() }
              : order
          ),
        })
      }

      // Optimistically update the individual order cache
      if (previousOrder) {
        queryClient.setQueryData(ordersKeys.detail(tenantId!, orderId), {
          ...previousOrder,
          ...update,
          updated_at: new Date().toISOString(),
        })
      }

      // Return context with the previous values for rollback
      return { previousOrders, previousOrder }
    },
    onError: (_err, { orderId }, context) => {
      // Roll back to the previous values on error
      if (context?.previousOrders) {
        queryClient.setQueryData(
          ordersKeys.list(tenantId!, {}),
          context.previousOrders
        )
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(
          ordersKeys.detail(tenantId!, orderId),
          context.previousOrder
        )
      }
    },
    onSettled: (_data, _error, { orderId }) => {
      // Always invalidate and refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(tenantId!, orderId),
      })
    },
  })
}
