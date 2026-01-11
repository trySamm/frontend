import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { cn } from '../lib/utils'
import LanguageSwitcher from '../components/LanguageSwitcher'
import TenantSelector from '../components/TenantSelector'
import {
  Phone,
  LayoutDashboard,
  PhoneCall,
  ShoppingBag,
  Calendar,
  UtensilsCrossed,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Brain,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { name: 'nav.calls', href: '/calls', icon: PhoneCall },
  { name: 'nav.orders', href: '/orders', icon: ShoppingBag },
  { name: 'nav.reservations', href: '/reservations', icon: Calendar },
  { name: 'nav.menu', href: '/menu', icon: UtensilsCrossed },
]

const settingsNavigation = [
  { name: 'nav.settings', href: '/settings', icon: Settings },
  { name: 'nav.aiSettings', href: '/settings/llm', icon: Brain },
]

export default function DashboardLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { direction, isRTL } = useLanguageStore()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div dir={direction} className="min-h-screen bg-neutral-925 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900/50 border-e border-neutral-800 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-semibold text-white">Samm AI</span>
          </div>
        </div>

        {/* Tenant Selector for Super Admin */}
        {user?.role === 'super_admin' && (
          <div className="px-4 pt-4">
            <TenantSelector />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600/10 text-primary-500'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {t(item.name)}
            </NavLink>
          ))}

          {/* Settings dropdown */}
          <div className="pt-4">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                {t('nav.settings')}
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                settingsOpen && 'rotate-180',
                isRTL() && !settingsOpen && '-scale-x-100'
              )} />
            </button>

            {settingsOpen && (
              <div className="mt-1 ms-4 space-y-1">
                {settingsNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'text-primary-500'
                          : 'text-neutral-500 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {t(item.name)}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Super admin only */}
          {user?.role === 'super_admin' && (
            <NavLink
              to="/tenants"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600/10 text-primary-500'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                )
              }
            >
              <Building2 className="w-5 h-5" />
              {t('nav.tenants')}
            </NavLink>
          )}
        </nav>

        {/* Language Switcher */}
        <div className="px-4 py-2 border-t border-neutral-800">
          <LanguageSwitcher />
        </div>

        {/* User section */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-300">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title={t('common.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
