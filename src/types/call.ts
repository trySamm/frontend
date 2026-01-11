// Call Types

export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer'

export type CallDirection = 'inbound' | 'outbound'

export type CallOutcome =
  | 'order_placed'
  | 'reservation_made'
  | 'inquiry_answered'
  | 'escalated'
  | 'voicemail'
  | 'abandoned'
  | 'no_action'

export interface Call {
  id: string
  tenant_id: string
  from_number: string
  to_number: string
  direction: CallDirection
  status: CallStatus
  outcome: CallOutcome | null
  duration_seconds: number | null
  started_at: string
  ended_at: string | null
  escalated: boolean
  escalated_to: string | null
  recording_url: string | null
  transcript: string | null
  summary: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  created_at: string
  updated_at: string
}

export interface CallStats {
  total_calls: number
  avg_duration_seconds: number
  escalation_rate: number
  outcomes: Record<CallOutcome, number>
  calls_by_hour: Record<string, number>
  calls_by_day: Record<string, number>
}

export interface CallStatsComparison {
  current: CallStats
  previous: CallStats
  changes: {
    total_calls_change: number
    avg_duration_change: number
    escalation_rate_change: number
  }
}

export interface CallsQueryParams {
  page?: number
  page_size?: number
  status?: CallStatus
  outcome?: CallOutcome
  start_date?: string
  end_date?: string
  search?: string
}
