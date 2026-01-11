// Authentication Types

export type UserRole = 'super_admin' | 'restaurant_admin' | 'staff_viewer'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  tenantId: string | null
  tenantName?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
