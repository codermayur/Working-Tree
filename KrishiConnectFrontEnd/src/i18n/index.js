/**
 * i18n setup for Khetibari. Supports en, hi, mr.
 * Language is persisted in localStorage (key: app_language) and synced with user preferences when logged in.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const LANGUAGE_KEY = 'app_language';
export const SUPPORTED_LANGS = ['en', 'hi', 'mr'];
const DEFAULT_LANG = 'en';

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (_) {}
  return null;
}

export function setStoredLanguage(lang) {
  try {
    if (lang && SUPPORTED_LANGS.includes(lang)) {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  } catch (_) {}
}

export function getLanguageToUse(userPreferencesLang) {
  const fromUser = userPreferencesLang && SUPPORTED_LANGS.includes(userPreferencesLang)
    ? userPreferencesLang
    : null;
  const fromStorage = getStoredLanguage();
  return fromUser || fromStorage || DEFAULT_LANG;
}

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS,
    showSupportNotice: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
