/**
 * @module types
 * @description Frontend utility / library module.
 */

import { SUPPORTED_LANGUAGES, TRANSLATION_MODULES } from './constants';

/** 'uz' | 'ru' */
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * 'common' | 'auth' | 'dashboard' | 'hr' | 'finance' | 'production' |
 * 'warehouse' | 'wms' | 'crm' | 'lms' | 'settings' | 'errors' |
 * 'validation' | 'marketing' | 'navigation' | 'public'
 */
export type TranslationModuleName = (typeof TRANSLATION_MODULES)[number];

/** Bir modulning kalit-qiymat juftliklari */
export type TranslationModule = Record<string, string>;

/** Barcha tillar uchun to'liq tarjima to'plami */
export type AllTranslations = Record<Language, Record<TranslationModuleName, TranslationModule>>;

// ─── Context interfacelari ────────────────────────────────────────────────────

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Global t() — modul ko'rsatilishi shart */
  t: (key: string, module?: TranslationModuleName, params?: Record<string, string | number>) => string;
}

export interface LanguageProviderProps {
  children: React.ReactNode;
  /** SSR yoki test uchun boshlang'ich til */
  initialLanguage?: Language;
}

// ─── Hook return tiplaeri ─────────────────────────────────────────────────────

export interface UseTranslationReturn {
  language: Language;
  /** Modul ichida ishlaydi: t('key'), t('key', {...}), yoki t('key', 'fallback') */
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string) => string;
  /** Til o'zgartirish — agar kerak bo'lsa */
  setLanguage: (lang: Language) => void;
}

export interface UseLanguageSetterReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
}
