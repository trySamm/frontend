import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { tenantsApi } from '../lib/api'
import { formatDate, cn } from '../lib/utils'
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Tenant {
  id: string
  name: string
  timezone: string
  is_active: boolean
  llm_provider: string
  llm_model: string
  created_at: string
}

export default function Tenants() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'America/New_York',
  })
  
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.list(),
    enabled: user?.role === 'super_admin',
  })
  
  const createTenant = useMutation({
    mutationFn: (data: any) => {
      // This would need a separate create endpoint
      return Promise.resolve(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant created')
      closeModal()
    },
    onError: () => {
      toast.error('Failed to create tenant')
    },
  })
  
  const filteredTenants = tenants?.filter((tenant: Tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const openCreateModal = () => {
    setEditingTenant(null)
    setFormData({
      name: '',
      timezone: 'America/New_York',
    })
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingTenant(null)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTenant.mutate(formData)
  }
  
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-neutral-500">You don't have access to this page</p>
      </div>
    )
  }
  
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Tenants</h1>
          <p className="text-neutral-400 mt-1">Manage restaurant accounts</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Tenant
        </button>
      </div>
      
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10"
        />
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Timezone</th>
              <th>AI Provider</th>
              <th>Status</th>
              <th>Created</th>
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
            ) : filteredTenants?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  No tenants found
                </td>
              </tr>
            ) : (
              filteredTenants?.map((tenant: Tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-600/10 rounded-full">
                        <Building2 className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="text-xs text-neutral-500">
                          {tenant.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-neutral-300">{tenant.timezone}</td>
                  <td>
                    <span className="badge badge-info">
                      {tenant.llm_provider} / {tenant.llm_model}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      'badge',
                      tenant.is_active ? 'badge-success' : 'badge-error'
                    )}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-neutral-400">
                    {formatDate(tenant.created_at)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-850 border border-neutral-800 rounded-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">
                Add New Tenant
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                  placeholder="Mario's Italian Kitchen"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={createTenant.isPending}
                >
                  {createTenant.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Tenant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

