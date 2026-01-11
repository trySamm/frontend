// API Response Wrappers and Common Types

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ApiError {
  detail: string
  code?: string
  field?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

// Query params
export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface DateRangeParams {
  start_date?: string
  end_date?: string
}
