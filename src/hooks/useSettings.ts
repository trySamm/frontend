import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { tenantsApi } from '../lib/api'
import {
  TenantSettings,
  TenantSettingsUpdate,
  LLMConfig,
  LLMConfigUpdate,
} from '../types'

// Query keys for cache management
export const settingsKeys = {
  all: ['settings'] as const,
  tenantSettings: (tenantId: string) =>
    [...settingsKeys.all, 'tenant', tenantId] as const,
  llmConfig: (tenantId: string) =>
    [...settingsKeys.all, 'llm', tenantId] as const,
}

/**
 * Hook to fetch tenant settings
 */
export function useTenantSettings(
  options?: Omit<UseQueryOptions<TenantSettings>, 'queryKey' | 'queryFn'>
) {
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: settingsKeys.tenantSettings(tenantId!),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return tenantsApi.getSettings(tenantId)
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Mutation hook to update tenant settings
 */
export function useUpdateTenantSettings(
  options?: Omit<
    UseMutationOptions<TenantSettings, Error, TenantSettingsUpdate>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation({
    mutationFn: async (update: TenantSettingsUpdate) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return tenantsApi.updateSettings(tenantId, update)
    },
    onSuccess: (data) => {
      // Update the settings in cache
      queryClient.setQueryData(settingsKeys.tenantSettings(tenantId!), data)
    },
    ...options,
  })
}

/**
 * Hook to fetch LLM configuration
 */
export function useLLMConfig(
  options?: Omit<UseQueryOptions<LLMConfig>, 'queryKey' | 'queryFn'>
) {
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: settingsKeys.llmConfig(tenantId!),
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID available')
      return tenantsApi.getLLMConfig(tenantId)
    },
    enabled: !!tenantId,
    ...options,
  })
}

/**
 * Mutation hook to update LLM configuration
 */
export function useUpdateLLMConfig(
  options?: Omit<
    UseMutationOptions<LLMConfig, Error, LLMConfigUpdate>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  return useMutation({
    mutationFn: async (update: LLMConfigUpdate) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return tenantsApi.updateLLMConfig(tenantId, update)
    },
    onSuccess: (data) => {
      // Update the LLM config in cache
      queryClient.setQueryData(settingsKeys.llmConfig(tenantId!), data)
    },
    ...options,
  })
}
