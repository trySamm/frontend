// Reservation Types

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Reservation {
  id: string
  tenant_id: string
  call_id: string | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number
  reservation_date: string
  reservation_time: string
  status: ReservationStatus
  special_requests: string | null
  table_number: string | null
  created_at: string
  updated_at: string
}

export interface ReservationCreate {
  customer_name: string
  customer_phone: string
  customer_email?: string
  party_size: number
  reservation_date: string
  reservation_time: string
  special_requests?: string
}

export interface ReservationUpdate {
  status?: ReservationStatus
  table_number?: string
  party_size?: number
  reservation_date?: string
  reservation_time?: string
  special_requests?: string
}

export interface ReservationsQueryParams {
  page?: number
  page_size?: number
  status?: ReservationStatus
  date?: string
  start_date?: string
  end_date?: string
}

export interface ReservationStats {
  total_reservations: number
  today_reservations: number
  upcoming_reservations: number
  reservations_by_status: Record<ReservationStatus, number>
  average_party_size: number
}
