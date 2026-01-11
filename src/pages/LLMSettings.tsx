import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { tenantsApi } from '../lib/api'
import {
  Brain,
  Save,
  Loader2,
  Zap,
  Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 Turbo, GPT-3.5 Turbo', icon: '🤖' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3 Opus, Sonnet, Haiku', icon: '🔮' },
  { id: 'gemini', name: 'Google Gemini', description: 'Gemini Pro, Gemini Flash', icon: '✨' },
  { id: 'ollama', name: 'Ollama (Local)', description: 'Llama 2, Mistral, etc.', icon: '🦙' },
]

const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  gemini: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-pro', name: 'Gemini Pro' },
  ],
  ollama: [
    { id: 'llama2', name: 'Llama 2' },
    { id: 'llama3', name: 'Llama 3' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'mixtral', name: 'Mixtral' },
  ],
}

export default function LLMSettings() {
  const { t } = useTranslation()
  const { direction } = useLanguageStore()
  const { getEffectiveTenantId } = useAuthStore()
  const tenantId = getEffectiveTenantId() || ''
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['llmConfig', tenantId],
    queryFn: () => tenantsApi.getLLMConfig(tenantId),
    enabled: !!tenantId,
  })

  const [formData, setFormData] = useState({
    llm_provider: 'openai',
    llm_model: 'gpt-4-turbo',
    fallback_llm_provider: 'anthropic',
    fallback_llm_model: 'claude-3-sonnet-20240229',
  })

  useEffect(() => {
    if (config) {
      setFormData({
        llm_provider: config.llm_provider,
        llm_model: config.llm_model,
        fallback_llm_provider: config.fallback_llm_provider,
        fallback_llm_model: config.fallback_llm_model,
      })
    }
  }, [config])

  const updateConfig = useMutation({
    mutationFn: (data: any) => tenantsApi.updateLLMConfig(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llmConfig', tenantId] })
      toast.success(t('llmSettings.saved'))
    },
    onError: () => {
      toast.error(t('llmSettings.saveFailed'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateConfig.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div dir={direction} className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{t('llmSettings.title')}</h1>
        <p className="text-neutral-400 mt-1">{t('llmSettings.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Primary Provider */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('llmSettings.primary.title')}</h2>
              <p className="text-sm text-neutral-400">{t('llmSettings.primary.description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    llm_provider: provider.id,
                    llm_model: MODELS[provider.id][0].id,
                  })
                }}
                className={`p-4 rounded-lg border text-start transition-colors ${
                  formData.llm_provider === provider.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <p className="font-medium text-white">{provider.name}</p>
                    <p className="text-xs text-neutral-400">{provider.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              {t('llmSettings.model.label')}
            </label>
            <select
              value={formData.llm_model}
              onChange={(e) => setFormData({ ...formData, llm_model: e.target.value })}
              className="w-full max-w-md"
            >
              {MODELS[formData.llm_provider]?.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fallback Provider */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Shield className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('llmSettings.fallback.title')}</h2>
              <p className="text-sm text-neutral-400">{t('llmSettings.fallback.description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PROVIDERS.filter(p => p.id !== formData.llm_provider).map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    fallback_llm_provider: provider.id,
                    fallback_llm_model: MODELS[provider.id][0].id,
                  })
                }}
                className={`p-4 rounded-lg border text-start transition-colors ${
                  formData.fallback_llm_provider === provider.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <p className="font-medium text-white">{provider.name}</p>
                    <p className="text-xs text-neutral-400">{provider.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              {t('llmSettings.fallback.model')}
            </label>
            <select
              value={formData.fallback_llm_model}
              onChange={(e) => setFormData({ ...formData, fallback_llm_model: e.target.value })}
              className="w-full max-w-md"
            >
              {MODELS[formData.fallback_llm_provider]?.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400">{t('llmSettings.info.title')}</p>
              <p className="text-sm text-blue-300/70 mt-1">
                {t('llmSettings.info.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('llmSettings.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
