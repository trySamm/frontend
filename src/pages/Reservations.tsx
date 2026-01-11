import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { reservationsApi } from '../lib/api'
import { formatDateTime, formatPhoneNumber, getStatusColor } from '../lib/utils'
import {
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Reservations() {
  const { t } = useTranslation()
  const { direction } = useLanguageStore()
  const { getEffectiveTenantId } = useAuthStore()
  const tenantId = getEffectiveTenantId() || ''
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', tenantId, page, statusFilter],
    queryFn: () => reservationsApi.list(tenantId, {
      page,
      page_size: 20,
      status: statusFilter || undefined,
    }),
    enabled: !!tenantId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ reservationId, status }: { reservationId: string; status: string }) =>
      reservationsApi.update(tenantId, reservationId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', tenantId] })
      toast.success(t('reservations.updated'))
    },
    onError: () => {
      toast.error(t('reservations.updateFailed'))
    },
  })

  return (
    <div dir={direction} className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('reservations.title')}</h1>
          <p className="text-neutral-400 mt-1">{t('reservations.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-850 border border-neutral-700 rounded-lg px-4 py-2.5"
        >
          <option value="">{t('reservations.allStatuses')}</option>
          <option value="pending">{t('reservations.status_labels.pending')}</option>
          <option value="confirmed">{t('reservations.status_labels.confirmed')}</option>
          <option value="seated">{t('reservations.status_labels.seated')}</option>
          <option value="completed">{t('reservations.status_labels.completed')}</option>
          <option value="cancelled">{t('reservations.status_labels.cancelled')}</option>
          <option value="no_show">{t('reservations.status_labels.no_show')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('reservations.reservation')}</th>
              <th>{t('reservations.customer')}</th>
              <th>{t('reservations.partySize')}</th>
              <th>{t('reservations.dateTime')}</th>
              <th>{t('reservations.status')}</th>
              <th>{t('reservations.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  {t('reservations.noReservations')}
                </td>
              </tr>
            ) : (
              data?.items?.map((reservation: any) => (
                <tr key={reservation.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-600/10 rounded-full">
                        <Calendar className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          #{reservation.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDateTime(reservation.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-white">{reservation.customer_name}</p>
                    <p className="text-xs text-neutral-500">
                      {formatPhoneNumber(reservation.customer_phone)}
                    </p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-300">{reservation.party_size}</span>
                    </div>
                  </td>
                  <td>
                    <p className="text-neutral-300">
                      {formatDateTime(reservation.reservation_datetime)}
                    </p>
                  </td>
                  <td>
                    <span className={getStatusColor(reservation.status)}>
                      {t(`reservations.status_labels.${reservation.status}`)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus.mutate({
                              reservationId: reservation.id,
                              status: 'confirmed'
                            })}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title={t('reservations.confirm')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({
                              reservationId: reservation.id,
                              status: 'cancelled'
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title={t('reservations.cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {reservation.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => updateStatus.mutate({
                              reservationId: reservation.id,
                              status: 'seated'
                            })}
                            className="btn-secondary py-1.5 px-3 text-xs"
                          >
                            {t('reservations.seatGuest')}
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({
                              reservationId: reservation.id,
                              status: 'no_show'
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title={t('reservations.status_labels.no_show')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {reservation.status === 'seated' && (
                        <button
                          onClick={() => updateStatus.mutate({
                            reservationId: reservation.id,
                            status: 'completed'
                          })}
                          className="btn-primary py-1.5 px-3 text-xs"
                        >
                          {t('reservations.complete')}
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
            {t('reservations.showing', {
              from: ((page - 1) * 20) + 1,
              to: Math.min(page * 20, data.total),
              total: data.total
            })}
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
              {t('reservations.page')} {page} {t('reservations.of')} {Math.ceil(data.total / 20)}
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
