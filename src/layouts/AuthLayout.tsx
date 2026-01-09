import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { Phone } from 'lucide-react'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return (
    <div className="min-h-screen bg-neutral-925 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900/30 via-neutral-925 to-neutral-925 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-semibold text-white">Loman AI</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-display font-bold text-white leading-tight">
            Your 24/7 AI<br />
            Phone Assistant
          </h1>
          <p className="text-lg text-neutral-400 max-w-md">
            Never miss a call again. Let AI handle orders, reservations, and FAQs 
            while you focus on running your restaurant.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-neutral-850/50 border border-neutral-800 rounded-xl p-4">
              <div className="text-3xl font-display font-bold text-primary-500">24/7</div>
              <div className="text-sm text-neutral-400">Always Available</div>
            </div>
            <div className="bg-neutral-850/50 border border-neutral-800 rounded-xl p-4">
              <div className="text-3xl font-display font-bold text-primary-500">100%</div>
              <div className="text-sm text-neutral-400">Call Coverage</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-neutral-500">
          © 2024 Loman AI. All rights reserved.
        </div>
      </div>
      
      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

