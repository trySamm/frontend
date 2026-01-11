/**
 * ConnectionStatus Component
 *
 * Displays WebSocket connection status with visual indicator and tooltip.
 * Follows project's dark theme and accessibility standards.
 */

import { useState, useRef, useEffect } from 'react'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketStatus } from '../types/websocket'

interface ConnectionStatusProps {
  /** Custom class name */
  className?: string
  /** Show label text alongside indicator */
  showLabel?: boolean
  /** Position for the tooltip */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** Compact mode - smaller indicator */
  compact?: boolean
}

interface StatusConfig {
  color: string
  bgColor: string
  pulseColor: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}

const statusConfigs: Record<WebSocketStatus, StatusConfig> = {
  connected: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400',
    pulseColor: 'bg-emerald-400/50',
    icon: Wifi,
    label: 'Connected',
    description: 'Real-time updates active',
  },
  connecting: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-400',
    pulseColor: 'bg-amber-400/50',
    icon: Loader2,
    label: 'Connecting',
    description: 'Establishing connection...',
  },
  disconnected: {
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-400',
    pulseColor: 'bg-neutral-400/50',
    icon: WifiOff,
    label: 'Disconnected',
    description: 'Real-time updates paused',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-400',
    pulseColor: 'bg-red-400/50',
    icon: AlertCircle,
    label: 'Error',
    description: 'Connection failed',
  },
}

const tooltipPositionClasses = {
  top: 'bottom-full mb-2 start-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 start-1/2 -translate-x-1/2',
  left: 'end-full me-2 top-1/2 -translate-y-1/2',
  right: 'start-full ms-2 top-1/2 -translate-y-1/2',
}

export function ConnectionStatus({
  className,
  showLabel = false,
  tooltipPosition = 'bottom',
  compact = false,
}: ConnectionStatusProps) {
  const { status, state, reconnect } = useWebSocket()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const config = statusConfigs[status]
  const Icon = config.icon

  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
    }, 150)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const formatLastConnected = () => {
    if (!state.lastConnected) return null

    const date = new Date(state.lastConnected)
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  return (
    <div
      className={cn('relative inline-flex items-center gap-2', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      {/* Status indicator */}
      <div className="relative">
        {/* Pulse animation for connected state */}
        {status === 'connected' && !compact && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              config.pulseColor
            )}
            style={{ animationDuration: '2s' }}
          />
        )}

        {/* Status dot / icon */}
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full',
            compact ? 'w-2 h-2' : 'w-3 h-3',
            config.bgColor
          )}
        >
          {!compact && status === 'connecting' && (
            <Loader2
              className={cn(
                'w-2 h-2 animate-spin text-neutral-900'
              )}
            />
          )}
        </div>
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className={cn('text-sm', config.color)}>
          {config.label}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 min-w-[180px]',
            'bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl',
            'text-sm text-neutral-200',
            tooltipPositionClasses[tooltipPosition]
          )}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-neutral-800 border-neutral-700 transform rotate-45',
              tooltipPosition === 'top' && 'bottom-[-5px] start-1/2 -translate-x-1/2 border-b border-e',
              tooltipPosition === 'bottom' && 'top-[-5px] start-1/2 -translate-x-1/2 border-t border-s',
              tooltipPosition === 'left' && 'end-[-5px] top-1/2 -translate-y-1/2 border-t border-e',
              tooltipPosition === 'right' && 'start-[-5px] top-1/2 -translate-y-1/2 border-b border-s'
            )}
          />

          {/* Content */}
          <div className="flex items-center gap-2 mb-1">
            <Icon
              className={cn(
                'w-4 h-4',
                config.color,
                status === 'connecting' && 'animate-spin'
              )}
            />
            <span className="font-medium">{config.label}</span>
          </div>

          <p className="text-neutral-400 text-xs mb-2">
            {config.description}
          </p>

          {/* Additional info */}
          {state.lastConnected && status === 'connected' && (
            <p className="text-neutral-500 text-xs">
              Since {formatLastConnected()}
            </p>
          )}

          {state.reconnectAttempts > 0 && status !== 'connected' && (
            <p className="text-neutral-500 text-xs">
              Reconnect attempts: {state.reconnectAttempts}
            </p>
          )}

          {/* Reconnect button for error/disconnected states */}
          {(status === 'error' || status === 'disconnected') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                reconnect()
              }}
              className={cn(
                'mt-2 w-full px-2 py-1 text-xs font-medium rounded',
                'bg-neutral-700 hover:bg-neutral-600 transition-colors',
                'text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
            >
              Reconnect
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Minimal connection indicator - just a dot
 */
export function ConnectionDot({ className }: { className?: string }) {
  const { status } = useWebSocket()
  const config = statusConfigs[status]

  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        config.bgColor,
        status === 'connected' && 'animate-pulse',
        className
      )}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    />
  )
}

export default ConnectionStatus
