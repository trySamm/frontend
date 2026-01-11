import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../stores/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// =============================================================================
// Error Types and Classes
// =============================================================================

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

export interface ApiErrorDetails {
  title: string
  message: string
  code: ApiErrorCode
}

export class ApiError extends Error {
  public readonly status: number
  public readonly code: ApiErrorCode
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode = 'UNKNOWN',
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status || 0
    const responseData = error.response?.data as Record<string, unknown> | undefined
    const detail = responseData?.detail as string | undefined

    const { code, message } = getApiErrorDetails(status, detail)

    return new ApiError(message, status, code, responseData)
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
  }
}

export function getApiErrorDetails(
  status: number,
  detail?: string
): { code: ApiErrorCode; title: string; message: string } {
  switch (status) {
    case 0:
      return {
        code: 'NETWORK_ERROR',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
      }
    case 401:
      return {
        code: 'UNAUTHORIZED',
        title: 'Authentication Required',
        message: detail || 'Your session has expired. Please log in again.',
      }
    case 403:
      return {
        code: 'FORBIDDEN',
        title: 'Access Denied',
        message: detail || "You don't have permission to perform this action.",
      }
    case 404:
      return {
        code: 'NOT_FOUND',
        title: 'Not Found',
        message: detail || 'The requested resource could not be found.',
      }
    case 422:
      return {
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        message: detail || 'The provided data is invalid. Please check your input.',
      }
    case 429:
      return {
        code: 'SERVER_ERROR',
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment and try again.',
      }
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: 'SERVER_ERROR',
        title: 'Server Error',
        message: detail || 'Something went wrong on our end. Please try again later.',
      }
    default:
      return {
        code: 'UNKNOWN',
        title: 'Error',
        message: detail || 'An unexpected error occurred. Please try again.',
      }
  }
}

// Helper to check if an error is a network error
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === 'NETWORK_ERROR'
  }
  if (error instanceof AxiosError) {
    return !error.response && error.code === 'ERR_NETWORK'
  }
  return false
}

// Helper to check if an error is an auth error
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN'
  }
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403
  }
  return false
}

// Get user-friendly error message from any error
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof AxiosError) {
    const details = getApiErrorDetails(
      error.response?.status || 0,
      (error.response?.data as Record<string, unknown>)?.detail as string | undefined
    )
    return details.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor for token refresh and error transformation
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      const { refreshToken, updateTokens, logout } = useAuthStore.getState()

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          updateTokens(access_token, refresh_token)

          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            return api(originalRequest)
          }
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }

    // Transform AxiosError to ApiError for consistent error handling
    const apiError = ApiError.fromAxiosError(error)
    return Promise.reject(apiError)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },
  
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  logout: async () => {
    await api.post('/auth/logout')
  },
}

// Tenants API
export const tenantsApi = {
  list: async () => {
    const response = await api.get('/tenants')
    return response.data
  },
  
  get: async (tenantId: string) => {
    const response = await api.get(`/tenants/${tenantId}`)
    return response.data
  },
  
  getSettings: async (tenantId: string) => {
    const response = await api.get(`/tenants/${tenantId}/settings`)
    return response.data
  },
  
  updateSettings: async (tenantId: string, data: any) => {
    const response = await api.put(`/tenants/${tenantId}/settings`, data)
    return response.data
  },
  
  getLLMConfig: async (tenantId: string) => {
    const response = await api.get(`/tenants/${tenantId}/llm_config`)
    return response.data
  },
  
  updateLLMConfig: async (tenantId: string, data: any) => {
    const response = await api.put(`/tenants/${tenantId}/llm_config`, data)
    return response.data
  },
}

// Calls API
export const callsApi = {
  list: async (tenantId: string, params?: any) => {
    const response = await api.get(`/tenants/${tenantId}/calls`, { params })
    return response.data
  },
  
  get: async (tenantId: string, callId: string) => {
    const response = await api.get(`/tenants/${tenantId}/calls/${callId}`)
    return response.data
  },
  
  getStats: async (tenantId: string) => {
    const response = await api.get(`/tenants/${tenantId}/calls/stats/summary`)
    return response.data
  },
}

// Menu API
export const menuApi = {
  list: async (tenantId: string, params?: any) => {
    const response = await api.get(`/tenants/${tenantId}/menu_items`, { params })
    return response.data
  },
  
  create: async (tenantId: string, data: any) => {
    const response = await api.post(`/tenants/${tenantId}/menu_items`, data)
    return response.data
  },
  
  update: async (tenantId: string, itemId: string, data: any) => {
    const response = await api.put(`/tenants/${tenantId}/menu_items/${itemId}`, data)
    return response.data
  },
  
  delete: async (tenantId: string, itemId: string) => {
    await api.delete(`/tenants/${tenantId}/menu_items/${itemId}`)
  },
  
  importCSV: async (tenantId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(
      `/tenants/${tenantId}/menu_items/import_csv`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },
}

// Orders API
export const ordersApi = {
  list: async (tenantId: string, params?: any) => {
    const response = await api.get(`/tenants/${tenantId}/orders`, { params })
    return response.data
  },
  
  get: async (tenantId: string, orderId: string) => {
    const response = await api.get(`/tenants/${tenantId}/orders/${orderId}`)
    return response.data
  },
  
  update: async (tenantId: string, orderId: string, data: any) => {
    const response = await api.put(`/tenants/${tenantId}/orders/${orderId}`, data)
    return response.data
  },
}

// Reservations API
export const reservationsApi = {
  list: async (tenantId: string, params?: any) => {
    const response = await api.get(`/tenants/${tenantId}/reservations`, { params })
    return response.data
  },
  
  get: async (tenantId: string, reservationId: string) => {
    const response = await api.get(`/tenants/${tenantId}/reservations/${reservationId}`)
    return response.data
  },
  
  update: async (tenantId: string, reservationId: string, data: any) => {
    const response = await api.put(`/tenants/${tenantId}/reservations/${reservationId}`, data)
    return response.data
  },
}

