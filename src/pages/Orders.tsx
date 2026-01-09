import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { ordersApi } from '../lib/api'
import { formatCurrency, formatDateTime, formatPhoneNumber, getStatusColor } from '../lib/utils'
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Orders() {
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
      toast.success('Order status updated')
    },
    onError: () => {
      toast.error('Failed to update order')
    },
  })
  
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Orders</h1>
          <p className="text-neutral-400 mt-1">Manage takeout orders</p>
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
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Pickup</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-neutral-500">
                  No orders found
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
                      {order.items?.length || 0} items
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
                      <span className="text-neutral-500">ASAP</span>
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
                            title="Confirm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus.mutate({ 
                              orderId: order.id, 
                              status: 'cancelled' 
                            })}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel"
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
                          Start Preparing
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
                          Mark Ready
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
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} orders
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

