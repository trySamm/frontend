import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const { refreshToken, updateTokens, logout } = useAuthStore.getState()
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const { access_token, refresh_token } = response.data
          updateTokens(access_token, refresh_token)
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }
    
    return Promise.reject(error)
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

