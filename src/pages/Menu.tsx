import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import { menuApi } from '../lib/api'
import { formatCurrency, cn } from '../lib/utils'
import {
  UtensilsCrossed,
  Plus,
  Search,
  Upload,
  Pencil,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price_cents: number
  category: string | null
  is_active: boolean
  is_available: boolean
}

export default function Menu() {
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || ''
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    category: '',
    is_active: true,
  })
  
  const { data: items, isLoading } = useQuery({
    queryKey: ['menu', tenantId, categoryFilter],
    queryFn: () => menuApi.list(tenantId, { category: categoryFilter || undefined }),
    enabled: !!tenantId,
  })
  
  const createItem = useMutation({
    mutationFn: (data: any) => menuApi.create(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', tenantId] })
      toast.success('Menu item created')
      closeModal()
    },
    onError: () => {
      toast.error('Failed to create menu item')
    },
  })
  
  const updateItem = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      menuApi.update(tenantId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', tenantId] })
      toast.success('Menu item updated')
      closeModal()
    },
    onError: () => {
      toast.error('Failed to update menu item')
    },
  })
  
  const deleteItem = useMutation({
    mutationFn: (itemId: string) => menuApi.delete(tenantId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', tenantId] })
      toast.success('Menu item deleted')
    },
    onError: () => {
      toast.error('Failed to delete menu item')
    },
  })
  
  const importCSV = useMutation({
    mutationFn: (file: File) => menuApi.importCSV(tenantId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu', tenantId] })
      toast.success(`Imported ${data.items_created} items`)
    },
    onError: () => {
      toast.error('Failed to import CSV')
    },
  })
  
  const categories = [...new Set(items?.map((item: MenuItem) => item.category).filter(Boolean))]
  
  const filteredItems = items?.filter((item: MenuItem) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      price_cents: 0,
      category: '',
      is_active: true,
    })
    setShowModal(true)
  }
  
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price_cents: item.price_cents,
      category: item.category || '',
      is_active: item.is_active,
    })
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingItem) {
      updateItem.mutate({ itemId: editingItem.id, data: formData })
    } else {
      createItem.mutate(formData)
    }
  }
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importCSV.mutate(file)
    }
  }
  
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Menu</h1>
          <p className="text-neutral-400 mt-1">Manage your restaurant menu</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={importCSV.isPending}
          >
            {importCSV.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import CSV
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-neutral-850 border border-neutral-700 rounded-lg px-4 py-2.5"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      {/* Menu Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      ) : filteredItems?.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No menu items found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems?.map((item: MenuItem) => (
            <div
              key={item.id}
              className={cn(
                'card hover:border-neutral-700 transition-colors',
                !item.is_active && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{item.name}</h3>
                    {!item.is_available && (
                      <span className="badge badge-warning">Unavailable</span>
                    )}
                  </div>
                  {item.category && (
                    <span className="text-xs text-primary-500">{item.category}</span>
                  )}
                  {item.description && (
                    <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(item.price_cents)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => openEditModal(item)}
                  className="btn-ghost flex-1 py-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="btn-ghost flex-1 py-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-850 border border-neutral-800 rounded-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
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
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(formData.price_cents / 100).toFixed(2)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      price_cents: Math.round(parseFloat(e.target.value) * 100) 
                    })}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full"
                    placeholder="e.g., Pizza"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-neutral-300">
                  Active
                </label>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={createItem.isPending || updateItem.isPending}
                >
                  {(createItem.isPending || updateItem.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingItem ? (
                    'Update'
                  ) : (
                    'Create'
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

