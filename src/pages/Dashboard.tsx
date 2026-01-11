import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { callsApi, ordersApi } from '../lib/api'
import { formatCurrency, formatDuration, formatDateTime } from '../lib/utils'
import {
  PhoneCall,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, getEffectiveTenantId } = useAuthStore()
  const tenantId = getEffectiveTenantId() || ''

  const { data: callStats } = useQuery({
    queryKey: ['callStats', tenantId],
    queryFn: () => callsApi.getStats(tenantId),
    enabled: !!tenantId,
  })

  const { data: recentCalls } = useQuery({
    queryKey: ['recentCalls', tenantId],
    queryFn: () => callsApi.list(tenantId, { page: 1, page_size: 5 }),
    enabled: !!tenantId,
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['recentOrders', tenantId],
    queryFn: () => ordersApi.list(tenantId, { page: 1, page_size: 5 }),
    enabled: !!tenantId,
  })

  const stats = [
    {
      name: t('dashboard.totalCalls'),
      value: callStats?.total_calls || 0,
      change: '+12%',
      changeType: 'increase',
      icon: PhoneCall,
    },
    {
      name: t('dashboard.ordersToday'),
      value: recentOrders?.total || 0,
      change: '+8%',
      changeType: 'increase',
      icon: ShoppingBag,
    },
    {
      name: t('dashboard.avgDuration'),
      value: callStats?.avg_duration_seconds ? formatDuration(callStats.avg_duration_seconds) : '0:00',
      change: '-5%',
      changeType: 'decrease',
      icon: Clock,
    },
    {
      name: t('dashboard.escalationRate'),
      value: `${((callStats?.escalation_rate || 0) * 100).toFixed(1)}%`,
      change: '-2%',
      changeType: 'decrease',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{t('nav.dashboard')}</h1>
        <p className="text-neutral-400 mt-1">{t('dashboard.welcome', { name: user?.fullName || t('common.user') })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary-600/10 rounded-lg">
                <stat.icon className="w-5 h-5 text-primary-500" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-sm text-neutral-400">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">{t('dashboard.recentCalls')}</h2>
            <Link to="/calls" className="text-sm text-primary-500 hover:text-primary-400">
              {t('common.viewAll')}
            </Link>
          </div>

          <div className="space-y-4">
            {recentCalls?.items?.slice(0, 5).map((call: any) => (
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
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">{t('dashboard.recentOrders')}</h2>
            <Link to="/orders" className="text-sm text-primary-500 hover:text-primary-400">
              {t('common.viewAll')}
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders?.items?.slice(0, 5).map((order: any) => (
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
        </div>
      </div>

      {/* Quick stats */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">{t('dashboard.callOutcomes')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(callStats?.outcomes || {}).map(([outcome, count]) => (
            <div key={outcome} className="text-center p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-2xl font-display font-bold text-white">{count as number}</p>
              <p className="text-sm text-neutral-400 capitalize">{outcome.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
