import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useLanguageStore } from '../stores/language'
import { languages, type LanguageCode } from '../lib/i18n'
import { cn } from '../lib/utils'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
  className?: string
}

export default function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const currentLanguage = languages.find(l => l.code === language)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code)
    setIsOpen(false)
  }
  
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'text-neutral-400 hover:text-white hover:bg-neutral-800',
          isOpen && 'bg-neutral-800 text-white'
        )}
        aria-label={t('common.language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        {variant === 'full' && (
          <>
            <span className="text-sm">{currentLanguage?.nativeName}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </>
        )}
      </button>
      
      {isOpen && (
        <div 
          className={cn(
            'absolute z-50 mt-2 py-1 bg-neutral-850 border border-neutral-700 rounded-lg shadow-lg min-w-[160px]',
            // Position based on RTL
            'end-0'
          )}
          role="listbox"
          aria-label={t('common.language')}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors',
                language === lang.code
                  ? 'bg-primary-600/10 text-primary-500'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              )}
              role="option"
              aria-selected={language === lang.code}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{lang.code === 'ar' ? '🇸🇦' : '🇺🇸'}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-neutral-500">{lang.name}</span>
                </div>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-primary-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
