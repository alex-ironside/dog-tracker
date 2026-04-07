import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/common.json'
import pl from './locales/pl/common.json'

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: en },
        pl: { common: pl },
      },
      ns: ['common'],
      defaultNS: 'common',
      fallbackLng: 'en',
      supportedLngs: ['en', 'pl'],
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      react: { useSuspense: false },
      interpolation: { escapeValue: false },
    })
}

export default i18n
