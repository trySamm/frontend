import { ReactNode } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'
import { ApiError, getApiErrorDetails } from '../lib/api'

interface QueryErrorBoundaryProps {
  children: ReactNode
  fallbackRender?: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ReactNode
}

export function QueryErrorBoundary({ children, fallbackRender }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <ErrorBoundary
      onError={(error) => {
        // Log API errors for debugging
        if (error instanceof ApiError) {
          console.error('API Error:', {
            status: error.status,
            message: error.message,
            code: error.code,
          })
        }
      }}
      fallback={
        <QueryErrorFallbackWrapper reset={reset} fallbackRender={fallbackRender} />
      }
    >
      {children}
    </ErrorBoundary>
  )
}

interface QueryErrorFallbackWrapperProps {
  reset: () => void
  fallbackRender?: (props: {
    error: Error
    resetErrorBoundary: () => void
  }) => ReactNode
}

function QueryErrorFallbackWrapper({ reset, fallbackRender }: QueryErrorFallbackWrapperProps) {
  // This is a simplified fallback - in production you'd want to capture the actual error
  const handleReset = () => {
    reset()
    window.location.reload()
  }

  if (fallbackRender) {
    return <>{fallbackRender({ error: new Error('Query error'), resetErrorBoundary: handleReset })}</>
  }

  return (
    <ErrorFallback
      title="Failed to Load Data"
      message="There was a problem loading the data. Please try again."
      resetErrorBoundary={handleReset}
    />
  )
}

// Hook to use with suspended queries
export function useQueryErrorHandler() {
  const { reset } = useQueryErrorResetBoundary()

  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      const details = getApiErrorDetails(error.status)
      return {
        title: details.title,
        message: details.message,
        status: error.status,
        retry: reset,
      }
    }

    return {
      title: 'Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: undefined,
      retry: reset,
    }
  }

  return { handleError, reset }
}

export default QueryErrorBoundary
