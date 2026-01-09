import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
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
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || ''
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
      toast.success('Reservation updated')
    },
    onError: () => {
      toast.error('Failed to update reservation')
    },
  })
  
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Reservations</h1>
          <p className="text-neutral-400 mt-1">Manage table reservations</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-850 border border-neutral-700 rounded-lg px-4 py-2.5"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="seated">Seated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Customer</th>
              <th>Party Size</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  No reservations found
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
                      {reservation.status}
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
                            title="Confirm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({ 
                              reservationId: reservation.id, 
                              status: 'cancelled' 
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel"
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
                            Seat Guest
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({ 
                              reservationId: reservation.id, 
                              status: 'no_show' 
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="No Show"
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
                          Complete
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
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} reservations
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-2 px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-neutral-400">
              Page {page} of {Math.ceil(data.total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(data.total / 20)}
              className="btn-secondary py-2 px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

