import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { tenantsApi } from '../lib/api'
import {
  Clock,
  MapPin,
  Phone,
  Mic,
  Save,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function Settings() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const tenantId = user?.tenantId || ''
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', tenantId],
    queryFn: () => tenantsApi.getSettings(tenantId),
    enabled: !!tenantId,
  })

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    escalation_number: '',
    recording_enabled: true,
    max_party_size: '10',
    hours_json: {} as Record<string, { open: string; close: string }>,
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zip_code: settings.zip_code || '',
        escalation_number: settings.escalation_number || '',
        recording_enabled: settings.recording_enabled,
        max_party_size: settings.max_party_size || '10',
        hours_json: settings.hours_json || {},
      })
    }
  }, [settings])

  const updateSettings = useMutation({
    mutationFn: (data: any) => tenantsApi.updateSettings(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', tenantId] })
      toast.success(t('settings.saved'))
    },
    onError: () => {
      toast.error(t('settings.saveFailed'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings.mutate(formData)
  }

  const updateHours = (day: string, field: 'open' | 'close', value: string) => {
    setFormData({
      ...formData,
      hours_json: {
        ...formData.hours_json,
        [day]: {
          ...formData.hours_json[day],
          [field]: value,
        },
      },
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{t('nav.settings')}</h1>
        <p className="text-neutral-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('settings.location')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.locationDescription')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {t('settings.streetAddress')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full"
                placeholder={t('settings.streetAddressPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {t('settings.city')}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {t('settings.state')}
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {t('settings.zipCode')}
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('settings.operatingHours')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.operatingHoursDescription')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-neutral-300 capitalize">
                  {t(`settings.days.${day}`)}
                </span>
                <input
                  type="time"
                  value={formData.hours_json[day]?.open || '09:00'}
                  onChange={(e) => updateHours(day, 'open', e.target.value)}
                  className="w-32"
                />
                <span className="text-neutral-500">{t('settings.to')}</span>
                <input
                  type="time"
                  value={formData.hours_json[day]?.close || '21:00'}
                  onChange={(e) => updateHours(day, 'close', e.target.value)}
                  className="w-32"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Call Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Phone className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('settings.callSettings')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.callSettingsDescription')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {t('settings.escalationNumber')}
              </label>
              <input
                type="tel"
                value={formData.escalation_number}
                onChange={(e) => setFormData({ ...formData, escalation_number: e.target.value })}
                className="w-full max-w-md"
                placeholder={t('settings.escalationNumberPlaceholder')}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {t('settings.escalationNumberDescription')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {t('settings.maxPartySize')}
              </label>
              <input
                type="number"
                value={formData.max_party_size}
                onChange={(e) => setFormData({ ...formData, max_party_size: e.target.value })}
                className="w-24"
                min="1"
                max="50"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Mic className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{t('settings.callRecording')}</p>
                <p className="text-xs text-neutral-500">
                  {t('settings.callRecordingDescription')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recording_enabled}
                  onChange={(e) => setFormData({ ...formData, recording_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
