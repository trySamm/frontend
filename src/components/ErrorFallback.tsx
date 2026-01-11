import { AlertTriangle, RefreshCw, WifiOff, ShieldX, FileQuestion, ServerCrash } from 'lucide-react'
import { cn } from '../lib/utils'

export interface ErrorFallbackProps {
  error?: Error | null
  resetErrorBoundary?: () => void
  title?: string
  message?: string
  statusCode?: number
  className?: string
  compact?: boolean
}

const getErrorDetails = (statusCode?: number, error?: Error | null) => {
  if (statusCode === 401) {
    return {
      icon: ShieldX,
      title: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue.',
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
    }
  }

  if (statusCode === 403) {
    return {
      icon: ShieldX,
      title: 'Access Denied',
      message: "You don't have permission to access this resource.",
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    }
  }

  if (statusCode === 404) {
    return {
      icon: FileQuestion,
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      iconBg: 'bg-neutral-700',
      iconColor: 'text-neutral-400',
    }
  }

  if (statusCode && statusCode >= 500) {
    return {
      icon: ServerCrash,
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
    }
  }

  if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
    return {
      icon: WifiOff,
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    }
  }

  return {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
  }
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title,
  message,
  statusCode,
  className,
  compact = false,
}: ErrorFallbackProps) {
  const errorDetails = getErrorDetails(statusCode, error)
  const Icon = errorDetails.icon

  const displayTitle = title || errorDetails.title
  const displayMessage = message || errorDetails.message

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-4 bg-neutral-850 border border-neutral-800 rounded-lg', className)}>
        <div className={cn('p-2 rounded-lg', errorDetails.iconBg)}>
          <Icon className={cn('w-5 h-5', errorDetails.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{displayTitle}</p>
          <p className="text-xs text-neutral-400 truncate">{displayMessage}</p>
        </div>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-6', errorDetails.iconBg)}>
        <Icon className={cn('w-8 h-8', errorDetails.iconColor)} />
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{displayTitle}</h3>

      <p className="text-neutral-400 max-w-sm mb-6">{displayMessage}</p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="mb-6 p-4 bg-neutral-850 border border-neutral-800 rounded-lg text-left max-w-md w-full">
          <p className="text-xs font-medium text-neutral-500 mb-1">Error Details</p>
          <p className="text-sm font-mono text-red-400 break-all">{error.message}</p>
        </div>
      )}

      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorFallback
