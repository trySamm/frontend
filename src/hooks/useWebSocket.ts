/**
 * useWebSocket Hook
 *
 * React hook for WebSocket connection management with React Query integration.
 * Provides connection state, event subscription, and cache update capabilities.
 */

import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { webSocketService } from '../lib/websocket'
import { useAuthStore } from '../stores/auth'
import {
  WebSocketState,
  WebSocketStatus,
  WebSocketEventType,
  WebSocketEvent,
  WebSocketEventHandler,
  CallUpdateEvent,
  OrderUpdateEvent,
} from '../types/websocket'
import { Call, Order } from '../types'
import { callsKeys } from './useCalls'
import { ordersKeys } from './useOrders'

// =============================================================================
// Main Hook
// =============================================================================

interface UseWebSocketOptions {
  /** Auto-connect when authenticated (default: true) */
  autoConnect?: boolean
  /** Enable React Query cache updates (default: true) */
  enableCacheUpdates?: boolean
}

interface UseWebSocketReturn {
  /** Current connection status */
  status: WebSocketStatus
  /** Full connection state */
  state: WebSocketState
  /** Whether connected */
  isConnected: boolean
  /** Connect to WebSocket */
  connect: () => void
  /** Disconnect from WebSocket */
  disconnect: () => void
  /** Force reconnection */
  reconnect: () => void
  /** Subscribe to specific events */
  subscribe: <T extends WebSocketEvent = WebSocketEvent>(
    eventTypes: WebSocketEventType | WebSocketEventType[],
    handler: WebSocketEventHandler<T>
  ) => () => void
}

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, enableCacheUpdates = true } = options

  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenantId

  // Subscribe to WebSocket state using useSyncExternalStore for proper React integration
  const state = useSyncExternalStore(
    useCallback((callback) => webSocketService.onStateChange(callback), []),
    () => webSocketService.getState(),
    () => webSocketService.getState()
  )

  // Memoize connection actions
  const connect = useCallback(() => webSocketService.connect(), [])
  const disconnect = useCallback(() => webSocketService.disconnect(), [])
  const reconnect = useCallback(() => webSocketService.reconnect(), [])

  // Subscribe wrapper that maintains type safety
  const subscribe = useCallback(
    <T extends WebSocketEvent = WebSocketEvent>(
      eventTypes: WebSocketEventType | WebSocketEventType[],
      handler: WebSocketEventHandler<T>
    ) => {
      return webSocketService.subscribe(eventTypes, handler)
    },
    []
  )

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && state.status === 'disconnected') {
      connect()
    }

    // Disconnect when logging out
    if (!isAuthenticated && state.status !== 'disconnected') {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, state.status, connect, disconnect])

  // Handle React Query cache updates
  useEffect(() => {
    if (!enableCacheUpdates || !tenantId) return

    const unsubscribeCall = webSocketService.subscribe<CallUpdateEvent>(
      ['call.started', 'call.updated', 'call.ended'],
      (event) => {
        handleCallUpdate(queryClient, tenantId, event)
      }
    )

    const unsubscribeOrder = webSocketService.subscribe<OrderUpdateEvent>(
      ['order.created', 'order.updated', 'order.cancelled'],
      (event) => {
        handleOrderUpdate(queryClient, tenantId, event)
      }
    )

    return () => {
      unsubscribeCall()
      unsubscribeOrder()
    }
  }, [enableCacheUpdates, tenantId, queryClient])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect if this was the initiating component
      // In production, you might want more sophisticated connection management
    }
  }, [])

  return {
    status: state.status,
    state,
    isConnected: state.status === 'connected',
    connect,
    disconnect,
    reconnect,
    subscribe,
  }
}

// =============================================================================
// Specialized Subscription Hooks
// =============================================================================

/**
 * Hook to subscribe to call events
 */
export function useCallEvents(
  handler: WebSocketEventHandler<CallUpdateEvent>,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe<CallUpdateEvent>(
      ['call.started', 'call.updated', 'call.ended'],
      (event) => handlerRef.current(event)
    )

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Hook to subscribe to order events
 */
export function useOrderEvents(
  handler: WebSocketEventHandler<OrderUpdateEvent>,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe<OrderUpdateEvent>(
      ['order.created', 'order.updated', 'order.cancelled'],
      (event) => handlerRef.current(event)
    )

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// =============================================================================
// React Query Cache Update Handlers
// =============================================================================

function handleCallUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
  event: CallUpdateEvent
): void {
  const { type, call } = event

  switch (type) {
    case 'call.started':
    case 'call.updated':
      // Update call in list cache
      queryClient.setQueryData<Call[]>(
        callsKeys.list(tenantId),
        (oldCalls) => {
          if (!oldCalls) return [call]

          const index = oldCalls.findIndex((c) => c.id === call.id)
          if (index >= 0) {
            // Update existing call
            const newCalls = [...oldCalls]
            newCalls[index] = call
            return newCalls
          } else if (type === 'call.started') {
            // Add new call at the beginning
            return [call, ...oldCalls]
          }
          return oldCalls
        }
      )

      // Update individual call detail cache
      queryClient.setQueryData(callsKeys.detail(tenantId, call.id), call)
      break

    case 'call.ended':
      // Update the call status in cache
      queryClient.setQueryData<Call[]>(
        callsKeys.list(tenantId),
        (oldCalls) => {
          if (!oldCalls) return oldCalls
          return oldCalls.map((c) => (c.id === call.id ? call : c))
        }
      )

      queryClient.setQueryData(callsKeys.detail(tenantId, call.id), call)

      // Invalidate stats as they may have changed
      queryClient.invalidateQueries({ queryKey: callsKeys.stats(tenantId) })
      break
  }
}

function handleOrderUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
  event: OrderUpdateEvent
): void {
  const { type, order } = event

  switch (type) {
    case 'order.created':
      // Add new order to list cache
      queryClient.setQueryData<Order[]>(
        ordersKeys.list(tenantId),
        (oldOrders) => {
          if (!oldOrders) return [order]
          return [order, ...oldOrders]
        }
      )
      break

    case 'order.updated':
      // Update order in list cache
      queryClient.setQueryData<Order[]>(
        ordersKeys.list(tenantId),
        (oldOrders) => {
          if (!oldOrders) return oldOrders
          return oldOrders.map((o) => (o.id === order.id ? order : o))
        }
      )

      // Update individual order detail cache
      queryClient.setQueryData(ordersKeys.detail(tenantId, order.id), order)
      break

    case 'order.cancelled':
      // Update order status in cache
      queryClient.setQueryData<Order[]>(
        ordersKeys.list(tenantId),
        (oldOrders) => {
          if (!oldOrders) return oldOrders
          return oldOrders.map((o) => (o.id === order.id ? order : o))
        }
      )

      queryClient.setQueryData(ordersKeys.detail(tenantId, order.id), order)
      break
  }
}
