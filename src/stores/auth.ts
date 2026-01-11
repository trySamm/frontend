import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  fullName: string | null
  role: 'super_admin' | 'restaurant_admin' | 'staff_viewer' | string
  tenantId: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  selectedTenantId: string | null  // For super_admin to select a tenant
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  setHasHydrated: (state: boolean) => void
  setSelectedTenant: (tenantId: string | null) => void
  getEffectiveTenantId: () => string | null  // Returns selectedTenantId for super_admin, or user.tenantId
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      selectedTenantId: null,

      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          // Clear selected tenant when logging in - super_admin will need to select one
          selectedTenantId: null,
        })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          selectedTenantId: null,
        })
      },

      updateTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      setSelectedTenant: (tenantId) => {
        set({ selectedTenantId: tenantId })
      },

      getEffectiveTenantId: () => {
        const state = get()
        // For super_admin, use selectedTenantId; for others, use their assigned tenantId
        if (state.user?.role === 'super_admin') {
          return state.selectedTenantId
        }
        return state.user?.tenantId || null
      },
    }),
    {
      name: 'loman-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        selectedTenantId: state.selectedTenantId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
