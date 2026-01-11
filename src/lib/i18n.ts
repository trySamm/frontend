import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import ar from '../locales/ar.json'

export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
] as const

export type LanguageCode = (typeof languages)[number]['code']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

// Update document direction when language changes
i18n.on('languageChanged', (lng: string) => {
  const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
  
  // Store preference
  localStorage.setItem('i18nextLng', lng)
})

// Set initial direction
const initialLng = i18n.language || 'en'
document.documentElement.dir = RTL_LANGUAGES.includes(initialLng) ? 'rtl' : 'ltr'
document.documentElement.lang = initialLng

export default i18n

// Helper to check if current language is RTL
export const isRTL = () => RTL_LANGUAGES.includes(i18n.language)

// Helper to get current direction
export const getDirection = () => (isRTL() ? 'rtl' : 'ltr')
