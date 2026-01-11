/**
 * WebSocket Service
 *
 * Provides connection management, authentication, event subscription,
 * and automatic reconnection with exponential backoff.
 */

import { useAuthStore } from '../stores/auth'
import {
  WebSocketConfig,
  WebSocketState,
  WebSocketEvent,
  WebSocketEventType,
  WebSocketEventHandler,
  WebSocketSubscription,
} from '../types/websocket'

// =============================================================================
// Configuration
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, 'ws')

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: `${WS_URL}/ws`,
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 10000,
  },
}

// =============================================================================
// WebSocket Service Class
// =============================================================================

class WebSocketService {
  private socket: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private state: WebSocketState = {
    status: 'disconnected',
    lastConnected: null,
    lastError: null,
    reconnectAttempts: 0,
  }

  private subscriptions: Map<string, WebSocketSubscription> = new Map()
  private stateListeners: Set<(state: WebSocketState) => void> = new Set()

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private pongTimer: ReturnType<typeof setTimeout> | null = null

  private subscriptionIdCounter = 0

  constructor(config?: WebSocketConfig) {
    this.config = this.mergeConfig(config)
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  private mergeConfig(config?: WebSocketConfig): Required<WebSocketConfig> {
    return {
      url: config?.url ?? DEFAULT_CONFIG.url,
      reconnect: {
        ...DEFAULT_CONFIG.reconnect,
        ...config?.reconnect,
      },
      heartbeat: {
        ...DEFAULT_CONFIG.heartbeat,
        ...config?.heartbeat,
      },
    }
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  /**
   * Establish WebSocket connection with authentication
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn('[WebSocket] Already connected')
      return
    }

    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.warn('[WebSocket] Connection in progress')
      return
    }

    const { accessToken } = useAuthStore.getState()

    if (!accessToken) {
      console.error('[WebSocket] No access token available')
      this.updateState({ status: 'error', lastError: new Error('No access token') })
      return
    }

    this.updateState({ status: 'connecting' })

    try {
      // Pass token as query parameter for authentication
      const url = new URL(this.config.url)
      url.searchParams.set('token', accessToken)

      this.socket = new WebSocket(url.toString())

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      this.updateState({
        status: 'error',
        lastError: error instanceof Error ? error : new Error('Connection failed'),
      })
    }
  }

  /**
   * Disconnect WebSocket and cleanup
   */
  disconnect(): void {
    this.clearTimers()

    if (this.socket) {
      // Prevent reconnection attempts on intentional disconnect
      this.socket.onclose = null
      this.socket.onerror = null
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }

    this.updateState({
      status: 'disconnected',
      reconnectAttempts: 0,
    })
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect()
    this.connect()
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  private handleOpen(): void {
    console.log('[WebSocket] Connected')

    this.updateState({
      status: 'connected',
      lastConnected: new Date(),
      lastError: null,
      reconnectAttempts: 0,
    })

    this.startHeartbeat()
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Closed:', event.code, event.reason)

    this.clearTimers()

    // Don't reconnect if closed intentionally (code 1000) or auth failure (4001, 4003)
    const maxAttempts = this.config.reconnect.maxAttempts ?? 5
    const shouldReconnect =
      this.config.reconnect.enabled &&
      event.code !== 1000 &&
      event.code !== 4001 &&
      event.code !== 4003 &&
      this.state.reconnectAttempts < maxAttempts

    this.updateState({ status: 'disconnected' })

    if (shouldReconnect) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event)

    this.updateState({
      status: 'error',
      lastError: new Error('WebSocket error'),
    })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as {
        type: string
        payload?: unknown
        timestamp?: string
      }

      // Handle system messages
      if (message.type === 'system.pong') {
        this.handlePong()
        return
      }

      // Dispatch to subscribers
      const wsEvent: WebSocketEvent = {
        type: message.type as WebSocketEventType,
        ...(message.payload as object),
      } as WebSocketEvent

      this.dispatchEvent(wsEvent)
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error)
    }
  }

  // ---------------------------------------------------------------------------
  // Heartbeat / Keep-Alive
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    if (!this.config.heartbeat.enabled) return

    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.sendPing()
    }, this.config.heartbeat.interval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  private sendPing(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return

    this.send({ type: 'system.ping' })

    // Set timeout for pong response
    this.pongTimer = setTimeout(() => {
      console.warn('[WebSocket] Pong timeout - connection may be stale')
      this.reconnect()
    }, this.config.heartbeat.timeout)
  }

  private handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------

  private scheduleReconnect(): void {
    const attempts = this.state.reconnectAttempts
    const initialDelay = this.config.reconnect.initialDelay ?? 1000
    const maxDelay = this.config.reconnect.maxDelay ?? 30000

    // Exponential backoff with jitter
    const delay = Math.min(initialDelay * Math.pow(2, attempts), maxDelay)
    const jitter = delay * 0.2 * Math.random()
    const totalDelay = delay + jitter

    console.log(`[WebSocket] Reconnecting in ${Math.round(totalDelay)}ms (attempt ${attempts + 1})`)

    this.reconnectTimer = setTimeout(() => {
      this.updateState({ reconnectAttempts: attempts + 1 })
      this.connect()
    }, totalDelay)
  }

  private clearTimers(): void {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  private updateState(updates: Partial<WebSocketState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyStateListeners()
  }

  private notifyStateListeners(): void {
    this.stateListeners.forEach((listener) => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[WebSocket] State listener error:', error)
      }
    })
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: WebSocketState) => void): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to specific event types
   * @returns Unsubscribe function
   */
  subscribe<T extends WebSocketEvent = WebSocketEvent>(
    eventTypes: WebSocketEventType | WebSocketEventType[],
    handler: WebSocketEventHandler<T>
  ): () => void {
    const id = `sub_${++this.subscriptionIdCounter}`

    this.subscriptions.set(id, {
      id,
      eventType: eventTypes,
      handler: handler as WebSocketEventHandler,
    })

    return () => {
      this.subscriptions.delete(id)
    }
  }

  private dispatchEvent(event: WebSocketEvent): void {
    this.subscriptions.forEach((subscription) => {
      const types = Array.isArray(subscription.eventType)
        ? subscription.eventType
        : [subscription.eventType]

      if (types.includes(event.type)) {
        try {
          subscription.handler(event)
        } catch (error) {
          console.error('[WebSocket] Subscription handler error:', error)
        }
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Sending Messages
  // ---------------------------------------------------------------------------

  /**
   * Send a message through the WebSocket
   */
  send(data: unknown): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send - not connected')
      return false
    }

    try {
      this.socket.send(JSON.stringify(data))
      return true
    } catch (error) {
      console.error('[WebSocket] Send error:', error)
      return false
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

// Create a singleton instance for app-wide use
export const webSocketService = new WebSocketService()

// Export the class for testing or custom instances
export { WebSocketService }
