import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../lib/i18n'
import { RTL_LANGUAGES, type LanguageCode } from '../lib/i18n'

interface LanguageState {
  language: LanguageCode
  direction: 'ltr' | 'rtl'
  setLanguage: (lang: LanguageCode) => void
  isRTL: () => boolean
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: (localStorage.getItem('i18nextLng') as LanguageCode) || 'en',
      direction: RTL_LANGUAGES.includes(localStorage.getItem('i18nextLng') || 'en') ? 'rtl' : 'ltr',
      
      setLanguage: (lang: LanguageCode) => {
        const direction = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
        
        // Update i18n
        i18n.changeLanguage(lang)
        
        // Update document
        document.documentElement.dir = direction
        document.documentElement.lang = lang
        
        // Update state
        set({ language: lang, direction })
      },
      
      isRTL: () => get().direction === 'rtl',
    }),
    {
      name: 'language-storage',
    }
  )
)
