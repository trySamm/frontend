// Menu Types

export interface MenuItem {
  id: string
  tenant_id: string
  name: string
  description: string | null
  price_cents: number
  category: string | null
  image_url: string | null
  is_active: boolean
  is_available: boolean
  dietary_tags: string[]
  allergens: string[]
  preparation_time_minutes: number | null
  created_at: string
  updated_at: string
}

export interface MenuItemCreate {
  name: string
  description?: string
  price_cents: number
  category?: string
  image_url?: string
  is_active?: boolean
  is_available?: boolean
  dietary_tags?: string[]
  allergens?: string[]
  preparation_time_minutes?: number
}

export interface MenuItemUpdate {
  name?: string
  description?: string
  price_cents?: number
  category?: string
  image_url?: string
  is_active?: boolean
  is_available?: boolean
  dietary_tags?: string[]
  allergens?: string[]
  preparation_time_minutes?: number
}

export interface MenuQueryParams {
  category?: string
  is_active?: boolean
  is_available?: boolean
  search?: string
}

export interface MenuImportResult {
  items_created: number
  items_updated: number
  errors: string[]
}

export interface MenuCategory {
  name: string
  item_count: number
}
