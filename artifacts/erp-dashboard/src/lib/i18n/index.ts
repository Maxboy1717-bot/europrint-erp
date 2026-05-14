/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

// ============================================================
// EUROPRINT ERP — i18n Public API
// Barcha eksportlar shu yerdan
// ============================================================

// Provider & Context
export { LanguageProvider, useLanguageContext } from './context';

// Hooklar
export {
  useTranslation,        // READ-ONLY: t(key) + language
  useLanguageSetter,     // WRITE-ONLY: setLanguage + language
  useCurrentLanguage,    // faqat language
  useTGlobal,            // global t(key, module)
  useInterpolatedTranslation, // {placeholder} bilan
  useLanguage,           // @deprecated legacy compat
} from './hooks';

// Konstantalar
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_LABELS,
  TRANSLATION_MODULES,
} from './constants';

// Tiplar
export type {
  Language,
  TranslationModuleName,
  TranslationModule,
  AllTranslations,
  LanguageContextType,
  LanguageProviderProps,
  UseTranslationReturn,
  UseLanguageSetterReturn,
} from './types';

// Loader
export {
  ALL_TRANSLATIONS,
  getTranslation,
  interpolate,
  validateTranslationCompleteness,
} from './loader';

// Utils
export { getStoredLanguage, setStoredLanguage, isValidLanguage } from './utils';
