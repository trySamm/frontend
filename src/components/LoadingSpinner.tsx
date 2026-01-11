import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
  centered?: boolean
  fullScreen?: boolean
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const labelSizeClasses: Record<SpinnerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

export function LoadingSpinner({
  size = 'md',
  label,
  className,
  centered = false,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <Loader2
        className={cn(
          'animate-spin text-primary-500',
          sizeClasses[size]
        )}
      />
      {label && (
        <p className={cn('text-neutral-400', labelSizeClasses[size])}>
          {label}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    )
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full">
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}

// Inline spinner for buttons or inline elements
interface InlineSpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function InlineSpinner({ size = 'sm', className }: InlineSpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
        className
      )}
    />
  )
}

// Page loading state
interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      <p className="text-neutral-400">{message}</p>
    </div>
  )
}

// Button loading state helper
interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoading({
  isLoading,
  children,
  loadingText,
}: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <InlineSpinner className="me-2" />
        {loadingText || 'Loading...'}
      </>
    )
  }

  return <>{children}</>
}

export default LoadingSpinner
