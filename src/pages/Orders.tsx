import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { ordersApi } from '../lib/api'
import { formatCurrency, formatDateTime, formatPhoneNumber, getStatusColor } from '../lib/utils'
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Orders() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || ''
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', tenantId, page, statusFilter],
    queryFn: () => ordersApi.list(tenantId, {
      page,
      page_size: 20,
      status: statusFilter || undefined,
    }),
    enabled: !!tenantId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.update(tenantId, orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', tenantId] })
      toast.success(t('orders.statusUpdated'))
    },
    onError: () => {
      toast.error(t('orders.updateFailed'))
    },
  })

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('nav.orders')}</h1>
          <p className="text-neutral-400 mt-1">{t('orders.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-850 border border-neutral-700 rounded-lg px-4 py-2.5"
        >
          <option value="">{t('common.allStatus')}</option>
          <option value="pending">{t('orders.pending')}</option>
          <option value="confirmed">{t('orders.confirmed')}</option>
          <option value="preparing">{t('orders.preparing')}</option>
          <option value="ready">{t('orders.ready')}</option>
          <option value="completed">{t('common.completed')}</option>
          <option value="cancelled">{t('orders.cancelled')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('orders.order')}</th>
              <th>{t('orders.customer')}</th>
              <th>{t('orders.items')}</th>
              <th>{t('orders.total')}</th>
              <th>{t('orders.pickup')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  {t('orders.noOrders')}
                </td>
              </tr>
            ) : (
              data?.items?.map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-600/10 rounded-full">
                        <ShoppingBag className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-white">{order.customer_name}</p>
                    <p className="text-xs text-neutral-500">
                      {formatPhoneNumber(order.customer_phone)}
                    </p>
                  </td>
                  <td>
                    <p className="text-neutral-300">
                      {order.items?.length || 0} {t('orders.items')}
                    </p>
                  </td>
                  <td>
                    <p className="font-medium text-white">
                      {formatCurrency(order.total_cents)}
                    </p>
                  </td>
                  <td>
                    {order.pickup_time ? (
                      formatDateTime(order.pickup_time)
                    ) : (
                      <span className="text-neutral-500">{t('orders.asap')}</span>
                    )}
                  </td>
                  <td>
                    <span className={getStatusColor(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus.mutate({
                              orderId: order.id,
                              status: 'confirmed'
                            })}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title={t('orders.confirm')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({
                              orderId: order.id,
                              status: 'cancelled'
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title={t('common.cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus.mutate({
                            orderId: order.id,
                            status: 'preparing'
                          })}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          {t('orders.startPreparing')}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateStatus.mutate({
                            orderId: order.id,
                            status: 'ready'
                          })}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          {t('orders.markReady')}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateStatus.mutate({
                            orderId: order.id,
                            status: 'completed'
                          })}
                          className="btn-primary py-1.5 px-3 text-xs"
                        >
                          {t('orders.complete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {t('common.showing', {
              from: ((page - 1) * 20) + 1,
              to: Math.min(page * 20, data.total),
              total: data.total
            })} {t('nav.orders').toLowerCase()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-2 px-3"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="text-sm text-neutral-400">
              {t('common.page')} {page} {t('common.of')} {Math.ceil(data.total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(data.total / 20)}
              className="btn-secondary py-2 px-3"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
