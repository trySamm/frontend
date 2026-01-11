import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { authApi } from '../lib/api'
import { Phone, Mail, Lock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
  const { direction } = useLanguageStore()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Login
      const tokenData = await authApi.login(email, password)

      // Get user info - pass token directly since store isn't updated yet
      const { data: userData } = await import('axios').then(axios =>
        axios.default.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/me`, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        })
      )

      setAuth(
        {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          role: userData.role,
          tenantId: userData.tenant_id,
        },
        tokenData.access_token,
        tokenData.refresh_token
      )

      toast.success(t('login.welcomeBack'))
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('login.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div dir={direction} className="space-y-8 animate-fade-in">
      {/* Language Switcher */}
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-display font-semibold text-white">Loman AI</span>
      </div>

      <div className="text-center lg:text-start">
        <h2 className="text-2xl font-display font-bold text-white">{t('login.title')}</h2>
        <p className="mt-2 text-neutral-400">{t('login.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            {t('login.email')}
          </label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              className="w-full ps-11"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            {t('login.password')}
          </label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full ps-11"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('login.signingIn')}
            </>
          ) : (
            t('login.signIn')
          )}
        </button>
      </form>

      <div className="text-center text-sm text-neutral-500">
        <p>{t('login.demoCredentials')}</p>
        <p className="text-neutral-400">admin@loman.ai / admin123</p>
      </div>
    </div>
  )
}
