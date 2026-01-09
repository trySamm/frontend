import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { callsApi } from '../lib/api'
import { formatDateTime, formatDuration, formatPhoneNumber, getStatusColor, getOutcomeLabel } from '../lib/utils'
import {
  PhoneCall,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
} from 'lucide-react'

export default function Calls() {
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || ''
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['calls', tenantId, page, statusFilter],
    queryFn: () => callsApi.list(tenantId, { 
      page, 
      page_size: 20,
      status: statusFilter || undefined,
    }),
    enabled: !!tenantId,
  })
  
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Calls</h1>
          <p className="text-neutral-400 mt-1">View call history and transcripts</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-850 border border-neutral-700 rounded-lg px-4 py-2.5"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Caller</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Outcome</th>
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
                  No calls found
                </td>
              </tr>
            ) : (
              data?.items?.map((call: any) => (
                <tr key={call.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-full">
                        <PhoneCall className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {formatPhoneNumber(call.from_number)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {call.direction}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{formatDateTime(call.started_at)}</td>
                  <td>
                    {call.duration_seconds ? formatDuration(call.duration_seconds) : '--'}
                  </td>
                  <td>
                    <span className={`badge ${
                      call.outcome === 'order_placed' || call.outcome === 'reservation_made'
                        ? 'badge-success'
                        : call.outcome === 'escalated'
                        ? 'badge-error'
                        : 'badge-neutral'
                    }`}>
                      {getOutcomeLabel(call.outcome)}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusColor(call.status)}>
                      {call.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/calls/${call.id}`}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        title="View transcript"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                      {call.recording_url && (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Play recording"
                        >
                          <Play className="w-4 h-4" />
                        </a>
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
      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} calls
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
              Page {page} of {data.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
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

