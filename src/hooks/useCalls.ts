import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { callsApi } from '../lib/api'
import { Call, CallStats, CallsQueryParams, PaginatedResponse } from '../types'

// Query keys for cache management
export const callsKeys = {
  all: ['calls'] as const,
  lists: () => [...callsKeys.all, 'list'] as const,
  list: (tenantId: string, params?: CallsQueryParams) =>
    [...callsKeys.lists(), tenantId, params] as const,
  details: () => [...callsKeys.all, 'detail'] as const,
  detail: (tenantId: string, callId: string) =>
    [...callsKeys.details(), tenantId, callId] as const,
  stats: (tenantId: string) => [...callsKeys.all, 'stats', tenantId] as const,
}

/**
 * Hook to fetch paginated list of calls
 */
export function useCalls(
  params?: CallsQueryParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Call>>, 'queryKey' | 'queryFn'>
) {
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useQuery({
    queryKey: callsKeys.list(tenantId!, params),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return callsApi.list(tenantId, params) as Promise<PaginatedResponse<Call>>
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Hook to fetch a single call by ID
 */
export function useCall(
  callId: string,
  options?: Omit<UseQueryOptions<Call>, 'queryKey' | 'queryFn'>
) {
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useQuery({
    queryKey: callsKeys.detail(tenantId!, callId),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return callsApi.get(tenantId, callId)
    },
    enabled: !!tenantId && !!callId,
    ...options,
  })
}

/**
 * Hook to fetch call statistics
 */
export function useCallStats(
  options?: Omit<UseQueryOptions<CallStats>, 'queryKey' | 'queryFn'>
) {
  const getEffectiveTenantId = useAuthStore((state) => state.getEffectiveTenantId)
  const tenantId = getEffectiveTenantId()

  return useQuery({
    queryKey: callsKeys.stats(tenantId!),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return callsApi.getStats(tenantId)
    },
    enabled: !!tenantId,
    ...options,
  })
}
