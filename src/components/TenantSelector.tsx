import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { tenantsApi } from '../lib/api'
import { Building2, ChevronDown, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

interface Tenant {
  id: string
  name: string
  phone?: string
  is_active: boolean
}

export default function TenantSelector() {
  const { t } = useTranslation()
  const { user, selectedTenantId, setSelectedTenant } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Only show for super_admin
  if (user?.role !== 'super_admin') {
    return null
  }

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: tenantsApi.list,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId)

  const handleSelect = (tenantId: string) => {
    setSelectedTenant(tenantId)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          selectedTenantId
            ? 'bg-primary-600/10 text-primary-500 border border-primary-600/30'
            : 'bg-yellow-600/10 text-yellow-500 border border-yellow-600/30'
        )}
      >
        <Building2 className="w-5 h-5" />
        <span className="flex-1 text-start truncate">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selectedTenant ? (
            selectedTenant.name
          ) : (
            t('tenants.selectTenant')
          )}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-neutral-850 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : tenants?.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500 text-center">
              {t('tenants.noTenants')}
            </div>
          ) : (
            tenants?.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelect(tenant.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-neutral-800',
                  tenant.id === selectedTenantId
                    ? 'bg-primary-600/10 text-primary-500'
                    : 'text-neutral-300'
                )}
              >
                <Building2 className="w-4 h-4" />
                <span className="flex-1 text-start truncate">{tenant.name}</span>
                {tenant.id === selectedTenantId && (
                  <span className="text-xs text-primary-500">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
