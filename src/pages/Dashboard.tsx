import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useCalls, useCallStats } from '../hooks/useCalls'
import { useOrders } from '../hooks/useOrders'
import { formatCurrency, formatDuration, formatDateTime } from '../lib/utils'
import {
  PhoneCall,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardSkeleton, StatsSkeleton, ListSkeleton } from '../components/LoadingSkeleton'
import { QueryErrorBoundary } from '../components/QueryErrorBoundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { Call, Order } from '../types'

// Stats card component to reduce repetition
interface StatCardProps {
  name: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ name, value, icon: Icon }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-primary-600/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary-500" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-neutral-400">{name}</p>
      </div>
    </div>
  )
}

// Stats section component
function StatsSection() {
  const { t } = useTranslation()
  const { data: callStats, isLoading: isLoadingStats, error: statsError } = useCallStats()
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders({ page: 1, page_size: 5 })

  if (isLoadingStats || isLoadingOrders) {
    return <StatsSkeleton count={4} />
  }

  if (statsError) {
    return (
      <ErrorFallback
        error={statsError instanceof Error ? statsError : new Error('Failed to load stats')}
        title={t('common.error')}
        message={t('dashboard.statsError')}
        compact
      />
    )
  }

  const stats: StatCardProps[] = [
    {
      name: t('dashboard.totalCalls'),
      value: callStats?.total_calls || 0,
      icon: PhoneCall,
    },
    {
      name: t('dashboard.ordersToday'),
      value: ordersData?.total || 0,
      icon: ShoppingBag,
    },
    {
      name: t('dashboard.avgDuration'),
      value: callStats?.avg_duration_seconds ? formatDuration(callStats.avg_duration_seconds) : '0:00',
      icon: Clock,
    },
    {
      name: t('dashboard.escalationRate'),
      value: `${((callStats?.escalation_rate || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.name} {...stat} />
      ))}
    </div>
  )
}

// Recent calls section component
function RecentCallsSection() {
  const { t } = useTranslation()
  const { data: recentCalls, isLoading, error } = useCalls({ page: 1, page_size: 5 })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">{t('dashboard.recentCalls')}</h2>
        <Link to="/calls" className="text-sm text-primary-500 hover:text-primary-400">
          {t('common.viewAll')}
        </Link>
      </div>

      {isLoading && <ListSkeleton rows={5} />}

      {error && (
        <ErrorFallback
          error={error instanceof Error ? error : new Error('Failed to load calls')}
          title={t('common.error')}
          message={t('dashboard.callsError')}
          compact
        />
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {recentCalls?.items?.slice(0, 5).map((call: Call) => (
            <Link
              key={call.id}
              to={`/calls/${call.id}`}
              className="flex items-center gap-4 p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <div className={`p-2 rounded-full ${
                call.outcome === 'order_placed' || call.outcome === 'reservation_made'
                  ? 'bg-green-500/20'
                  : call.escalated
                  ? 'bg-red-500/20'
                  : 'bg-neutral-700'
              }`}>
                {call.outcome === 'order_placed' || call.outcome === 'reservation_made' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : call.escalated ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <PhoneCall className="w-4 h-4 text-neutral-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {call.from_number}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDateTime(call.started_at)}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm text-neutral-300">
                  {call.duration_seconds ? formatDuration(call.duration_seconds) : '--'}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {call.outcome?.replace('_', ' ') || call.status}
                </p>
              </div>
            </Link>
          ))}

          {(!recentCalls?.items || recentCalls.items.length === 0) && (
            <p className="text-center text-neutral-500 py-8">{t('calls.noCalls')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Recent orders section component
function RecentOrdersSection() {
  const { t } = useTranslation()
  const { data: recentOrders, isLoading, error } = useOrders({ page: 1, page_size: 5 })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">{t('dashboard.recentOrders')}</h2>
        <Link to="/orders" className="text-sm text-primary-500 hover:text-primary-400">
          {t('common.viewAll')}
        </Link>
      </div>

      {isLoading && <ListSkeleton rows={5} />}

      {error && (
        <ErrorFallback
          error={error instanceof Error ? error : new Error('Failed to load orders')}
          title={t('common.error')}
          message={t('dashboard.ordersError')}
          compact
        />
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {recentOrders?.items?.slice(0, 5).map((order: Order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-3 bg-neutral-800/50 rounded-lg"
            >
              <div className="p-2 rounded-full bg-primary-500/20">
                <ShoppingBag className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {order.customer_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {order.items?.length || 0} {t('orders.items')}
                </p>
              </div>
              <div className="text-end">
                <p className="text-sm font-medium text-white">
                  {formatCurrency(order.total_cents)}
                </p>
                <p className={`text-xs capitalize ${
                  order.status === 'completed' ? 'text-green-400' :
                  order.status === 'cancelled' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}

          {(!recentOrders?.items || recentOrders.items.length === 0) && (
            <p className="text-center text-neutral-500 py-8">{t('orders.noOrders')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Call outcomes section component
function CallOutcomesSection() {
  const { t } = useTranslation()
  const { data: callStats, isLoading, error } = useCallStats()

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">{t('dashboard.callOutcomes')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center p-4 bg-neutral-800/50 rounded-lg animate-pulse">
              <div className="h-8 w-16 mx-auto bg-neutral-700 rounded mb-2" />
              <div className="h-4 w-24 mx-auto bg-neutral-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">{t('dashboard.callOutcomes')}</h2>
        <ErrorFallback
          error={error instanceof Error ? error : new Error('Failed to load outcomes')}
          title={t('common.error')}
          message={t('dashboard.outcomesError')}
          compact
        />
      </div>
    )
  }

  const outcomes = callStats?.outcomes || {}

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-6">{t('dashboard.callOutcomes')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(outcomes).map(([outcome, count]) => (
          <div key={outcome} className="text-center p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-2xl font-display font-bold text-white">{count as number}</p>
            <p className="text-sm text-neutral-400 capitalize">{outcome.replace('_', ' ')}</p>
          </div>
        ))}
        {Object.keys(outcomes).length === 0 && (
          <p className="col-span-full text-center text-neutral-500 py-4">
            {t('dashboard.noOutcomes')}
          </p>
        )}
      </div>
    </div>
  )
}

// Main Dashboard content
function DashboardContent() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{t('nav.dashboard')}</h1>
        <p className="text-neutral-400 mt-1">{t('dashboard.welcome', { name: user?.fullName || t('common.user') })}</p>
      </div>

      {/* Stats */}
      <QueryErrorBoundary>
        <StatsSection />
      </QueryErrorBoundary>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QueryErrorBoundary>
          <RecentCallsSection />
        </QueryErrorBoundary>

        <QueryErrorBoundary>
          <RecentOrdersSection />
        </QueryErrorBoundary>
      </div>

      {/* Call Outcomes */}
      <QueryErrorBoundary>
        <CallOutcomesSection />
      </QueryErrorBoundary>
    </div>
  )
}

export default function Dashboard() {
  const { isLoading: isLoadingStats } = useCallStats()
  const { isLoading: isLoadingCalls } = useCalls({ page: 1, page_size: 5 })
  const { isLoading: isLoadingOrders } = useOrders({ page: 1, page_size: 5 })

  // Show full skeleton only on initial load when all data is loading
  const isInitialLoading = isLoadingStats && isLoadingCalls && isLoadingOrders

  if (isInitialLoading) {
    return <DashboardSkeleton />
  }

  return (
    <QueryErrorBoundary>
      <DashboardContent />
    </QueryErrorBoundary>
  )
}
