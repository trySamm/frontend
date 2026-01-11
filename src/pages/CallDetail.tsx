import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { callsApi } from '../lib/api'
import { formatDateTime, formatDuration, formatPhoneNumber, getStatusColor, getOutcomeLabel } from '../lib/utils'
import {
  ArrowLeft,
  Phone,
  Clock,
  User,
  MessageSquare,
  Play,
  Pause,
  Volume2,
} from 'lucide-react'
import { useState, useRef } from 'react'

export default function CallDetail() {
  const { t } = useTranslation()
  const { direction } = useLanguageStore()
  const { callId } = useParams()
  const { getEffectiveTenantId } = useAuthStore()
  const tenantId = getEffectiveTenantId() || ''
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { data: call, isLoading } = useQuery({
    queryKey: ['call', tenantId, callId],
    queryFn: () => callsApi.get(tenantId, callId!),
    enabled: !!tenantId && !!callId,
  })

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-neutral-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-neutral-500">{t('callDetail.callNotFound')}</p>
      </div>
    )
  }

  return (
    <div dir={direction} className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/calls"
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('callDetail.title')}</h1>
          <p className="text-neutral-400 mt-1">
            {formatPhoneNumber(call.from_number)} • {formatDateTime(call.started_at)}
          </p>
        </div>
      </div>

      {/* Call info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Phone className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{t('callDetail.status')}</p>
              <span className={getStatusColor(call.status)}>
                {call.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{t('callDetail.duration')}</p>
              <p className="font-medium text-white">
                {call.duration_seconds ? formatDuration(call.duration_seconds) : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{t('callDetail.outcome')}</p>
              <p className="font-medium text-white">
                {getOutcomeLabel(call.outcome)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{t('callDetail.escalated')}</p>
              <p className="font-medium text-white">
                {call.escalated ? t('callDetail.yes') : t('callDetail.no')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recording player */}
      {call.recording_url && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{t('callDetail.recording')}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayback}
              className="p-4 bg-primary-600 rounded-full hover:bg-primary-500 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-neutral-800 rounded-full">
                <div className="h-full w-1/3 bg-primary-500 rounded-full" />
              </div>
            </div>
            <Volume2 className="w-5 h-5 text-neutral-400" />
          </div>
          <audio ref={audioRef} src={call.recording_url} onEnded={() => setIsPlaying(false)} />
        </div>
      )}

      {/* Summary */}
      {call.summary && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{t('callDetail.summary')}</h2>
          <p className="text-neutral-300">{call.summary}</p>
          {call.sentiment && (
            <div className="mt-4">
              <span className={`badge ${
                call.sentiment === 'positive' ? 'badge-success' :
                call.sentiment === 'negative' ? 'badge-error' :
                'badge-neutral'
              }`}>
                {call.sentiment} {t('callDetail.sentiment')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">{t('callDetail.transcript')}</h2>

        {call.transcript?.segments?.length > 0 ? (
          <div className="space-y-4">
            {call.transcript.segments.map((segment: any, index: number) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  segment.speaker === 'agent' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    segment.speaker === 'agent'
                      ? 'bg-neutral-800'
                      : 'bg-primary-600/20'
                  }`}
                >
                  <p className="text-xs text-neutral-500 mb-1">
                    {segment.speaker === 'agent' ? t('callDetail.agent') : t('callDetail.customer')}
                  </p>
                  <p className="text-neutral-200">{segment.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : call.transcript?.text ? (
          <p className="text-neutral-300 whitespace-pre-wrap">{call.transcript.text}</p>
        ) : (
          <p className="text-neutral-500">{t('callDetail.noTranscript')}</p>
        )}
      </div>
    </div>
  )
}
