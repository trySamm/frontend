import { cn } from '../lib/utils'

interface SkeletonProps {
  className?: string
}

// Base skeleton element
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-neutral-800',
        className
      )}
    />
  )
}

// Table skeleton for data tables
interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
  showHeader?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 p-4 border-b border-neutral-800">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 p-4 border-b border-neutral-800/50"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'max-w-[200px]'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card skeleton for card grids
interface CardSkeletonProps {
  className?: string
  showImage?: boolean
  showActions?: boolean
}

export function CardSkeleton({
  className,
  showImage = false,
  showActions = false,
}: CardSkeletonProps) {
  return (
    <div className={cn('card', className)}>
      {showImage && (
        <Skeleton className="w-full h-32 mb-4 rounded-lg" />
      )}

      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      )}
    </div>
  )
}

// Card grid skeleton
interface CardGridSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
  showImage?: boolean
  showActions?: boolean
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
  showImage = false,
  showActions = false,
}: CardGridSkeletonProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          showImage={showImage}
          showActions={showActions}
        />
      ))}
    </div>
  )
}

// Stats skeleton for dashboard stats
interface StatsSkeletonProps {
  count?: number
  className?: string
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-12 h-4" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// List skeleton for list views
interface ListSkeletonProps {
  rows?: number
  className?: string
  showAvatar?: boolean
  showActions?: boolean
}

export function ListSkeleton({
  rows = 5,
  className,
  showAvatar = true,
  showActions = false,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-lg"
        >
          {showAvatar && (
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          )}

          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>

          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16 ms-auto" />
            <Skeleton className="h-3 w-12 ms-auto" />
          </div>

          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Form skeleton
interface FormSkeletonProps {
  fields?: number
  className?: string
  showSubmit?: boolean
}

export function FormSkeleton({
  fields = 4,
  className,
  showSubmit = true,
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      {showSubmit && (
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      )}
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

// Dashboard skeleton combining multiple elements
export function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <ListSkeleton rows={5} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <ListSkeleton rows={5} />
        </div>
      </div>
    </div>
  )
}

export default {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  CardGridSkeleton,
  StatsSkeleton,
  ListSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  DashboardSkeleton,
}
