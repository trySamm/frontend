// Tenant and Settings Types

export interface Tenant {
  id: string
  name: string
  slug: string
  phone_number: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessHours {
  open: string
  close: string
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type WeeklyHours = Record<DayOfWeek, BusinessHours>

export interface TenantSettings {
  id: string
  tenant_id: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  timezone: string
  escalation_number: string | null
  recording_enabled: boolean
  max_party_size: number
  hours_json: WeeklyHours
  created_at: string
  updated_at: string
}

export interface TenantSettingsUpdate {
  address?: string
  city?: string
  state?: string
  zip_code?: string
  escalation_number?: string
  recording_enabled?: boolean
  max_party_size?: string | number
  hours_json?: WeeklyHours
}

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'azure'

export interface LLMConfig {
  id: string
  tenant_id: string
  provider: LLMProvider
  model: string
  api_key_encrypted: string
  temperature: number
  max_tokens: number
  system_prompt: string | null
  created_at: string
  updated_at: string
}

export interface LLMConfigUpdate {
  provider?: LLMProvider
  model?: string
  api_key?: string
  temperature?: number
  max_tokens?: number
  system_prompt?: string
}
