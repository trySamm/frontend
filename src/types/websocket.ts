// WebSocket Types

import { Call } from './call'
import { Order } from './order'

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: string
  payload: T
  timestamp: string
}

// =============================================================================
// Call Events
// =============================================================================

export type CallEventType = 'call.started' | 'call.updated' | 'call.ended'

export interface CallUpdateEvent {
  type: CallEventType
  call: Call
}

// =============================================================================
// Order Events
// =============================================================================

export type OrderEventType = 'order.created' | 'order.updated' | 'order.cancelled'

export interface OrderUpdateEvent {
  type: OrderEventType
  order: Order
}

// =============================================================================
// Reservation Events
// =============================================================================

export type ReservationEventType =
  | 'reservation.created'
  | 'reservation.updated'
  | 'reservation.cancelled'

export interface ReservationUpdateEvent {
  type: ReservationEventType
  reservation: {
    id: string
    tenant_id: string
    [key: string]: unknown
  }
}

// =============================================================================
// System Events
// =============================================================================

export type SystemEventType = 'system.ping' | 'system.pong' | 'system.error'

export interface SystemEvent {
  type: SystemEventType
  message?: string
  code?: string
}

// =============================================================================
// Combined Event Types
// =============================================================================

export type WebSocketEventType =
  | CallEventType
  | OrderEventType
  | ReservationEventType
  | SystemEventType

export type WebSocketEvent =
  | CallUpdateEvent
  | OrderUpdateEvent
  | ReservationUpdateEvent
  | SystemEvent

/**
 * Event handler callback type
 */
export type WebSocketEventHandler<T = WebSocketEvent> = (event: T) => void

/**
 * Subscription configuration
 */
export interface WebSocketSubscription {
  id: string
  eventType: WebSocketEventType | WebSocketEventType[]
  handler: WebSocketEventHandler
}

/**
 * WebSocket configuration options
 */
export interface WebSocketConfig {
  /** Base URL for WebSocket connection (derived from API URL if not provided) */
  url?: string
  /** Reconnection configuration */
  reconnect?: {
    /** Enable automatic reconnection (default: true) */
    enabled?: boolean
    /** Maximum number of reconnection attempts (default: 5) */
    maxAttempts?: number
    /** Initial delay between reconnections in ms (default: 1000) */
    initialDelay?: number
    /** Maximum delay between reconnections in ms (default: 30000) */
    maxDelay?: number
  }
  /** Heartbeat/ping configuration */
  heartbeat?: {
    /** Enable heartbeat (default: true) */
    enabled?: boolean
    /** Interval between pings in ms (default: 30000) */
    interval?: number
    /** Timeout for pong response in ms (default: 10000) */
    timeout?: number
  }
}

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  status: WebSocketStatus
  lastConnected: Date | null
  lastError: Error | null
  reconnectAttempts: number
}
