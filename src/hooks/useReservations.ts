import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { reservationsApi } from '../lib/api'
import {
  Reservation,
  ReservationsQueryParams,
  ReservationUpdate,
} from '../types'
import { reservationUpdateSchema } from '../lib/validations'

// Query keys for cache management
export const reservationsKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: ReservationsQueryParams) =>
    [...reservationsKeys.lists(), tenantId, params] as const,
  details: () => [...reservationsKeys.all, 'detail'] as const,
  detail: (tenantId: string, reservationId: string) =>
    [...reservationsKeys.details(), tenantId, reservationId] as const,
}

// Context type for optimistic updates
interface ReservationMutationContext {
  previousReservations: Reservation[] | undefined
  previousReservation: Reservation | undefined
}

/**
 * Hook to fetch paginated list of reservations
 */
export function useReservations(
  params?: ReservationsQueryParams,
  options?: Omit<UseQueryOptions<Reservation[]>, 'queryKey' | 'queryFn'>
) {
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useQuery({
    queryKey: reservationsKeys.list(tenantId!, params),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return reservationsApi.list(tenantId, params)
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Hook to fetch a single reservation by ID
 */
export function useReservation(
  reservationId: string,
  options?: Omit<UseQueryOptions<Reservation>, 'queryKey' | 'queryFn'>
) {
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useQuery({
    queryKey: reservationsKeys.detail(tenantId!, reservationId),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return reservationsApi.get(tenantId, reservationId)
    },
    enabled: !!tenantId && !!reservationId,
    ...options,
  })
}

/**
 * Mutation hook to update a reservation
 * Includes Zod validation and optimistic updates
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient()
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useMutation<
    Reservation,
    Error,
    { reservationId: string; update: ReservationUpdate },
    ReservationMutationContext
  >({
    mutationFn: async ({
      reservationId,
      update,
    }: {
      reservationId: string
      update: ReservationUpdate
    }) => {
      // Validate input data with Zod
      const validated = reservationUpdateSchema.parse(update)
      if (!tenantId) throw new Error('No tenant ID available')
      return reservationsApi.update(tenantId, reservationId, validated)
    },
    onMutate: async ({
      reservationId,
      update,
    }): Promise<ReservationMutationContext> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: reservationsKeys.lists() })
      await queryClient.cancelQueries({
        queryKey: reservationsKeys.detail(tenantId!, reservationId),
      })

      // Snapshot the previous values
      const previousReservations = queryClient.getQueryData<Reservation[]>(
        reservationsKeys.list(tenantId!, {})
      )
      const previousReservation = queryClient.getQueryData<Reservation>(
        reservationsKeys.detail(tenantId!, reservationId)
      )

      // Optimistically update the reservation in the list
      if (previousReservations) {
        queryClient.setQueryData(
          reservationsKeys.list(tenantId!, {}),
          previousReservations.map((reservation) =>
            reservation.id === reservationId
              ? {
                  ...reservation,
                  ...update,
                  updated_at: new Date().toISOString(),
                }
              : reservation
          )
        )
      }

      // Optimistically update the individual reservation cache
      if (previousReservation) {
        queryClient.setQueryData(
          reservationsKeys.detail(tenantId!, reservationId),
          {
            ...previousReservation,
            ...update,
            updated_at: new Date().toISOString(),
          }
        )
      }

      // Return context with the previous values for rollback
      return { previousReservations, previousReservation }
    },
    onError: (_err, { reservationId }, context) => {
      // Roll back to the previous values on error
      if (context?.previousReservations) {
        queryClient.setQueryData(
          reservationsKeys.list(tenantId!, {}),
          context.previousReservations
        )
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(
          reservationsKeys.detail(tenantId!, reservationId),
          context.previousReservation
        )
      }
    },
    onSettled: (_data, _error, { reservationId }) => {
      // Always invalidate and refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: reservationsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: reservationsKeys.detail(tenantId!, reservationId),
      })
    },
  })
}
