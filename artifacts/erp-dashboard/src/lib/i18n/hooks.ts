/**
 * @module hooks
 * @description Frontend utility / library module.
 */

import { useCallback } from 'react';
import { useLanguageContext } from './context';
import { getTranslation, interpolate } from './loader';
import type {
  Language,
  TranslationModuleName,
  UseLanguageSetterReturn,
  UseTranslationReturn,
} from './types';

// ─── Asosiy hooklar ───────────────────────────────────────────────────────────

/**
 * Tarjima uchun READ-ONLY hook.
 * setLanguage yo'q — faqat t() va language.
 *
 * @example
 * const { t, language } = useTranslation('finance');
 * <h1>{t('title')}</h1>
 * <p>{t('invoiceCreated', { id: '001' })}</p>
 */
export function useTranslation(module: TranslationModuleName = 'common'): UseTranslationReturn {
  const { language, setLanguage, t: tGlobal } = useLanguageContext();

  const t = useCallback(
    (key: string, paramsOrFallback?: Record<string, string | number> | string): string => {
      // Permit `t('key', 'fallback')` legacy pattern — fallback is used if key missing.
      if (typeof paramsOrFallback === 'string') {
        const value = tGlobal(key, module);
        // tGlobal returns the key itself if translation is missing — detect & use fallback.
        return value === key ? paramsOrFallback : value;
      }
      return tGlobal(key, module, paramsOrFallback);
    },
    [tGlobal, module],
  );

  return { language, t, setLanguage };
}

/**
 * Til o'zgartirish uchun WRITE-ONLY hook.
 * t() yo'q — faqat setLanguage va joriy language.
 *
 * @example
 * const { language, setLanguage } = useLanguageSetter();
 * <button onClick={() => setLanguage('ru')}>RU</button>
 */
export function useLanguageSetter(): UseLanguageSetterReturn {
  const { language, setLanguage } = useLanguageContext();
  return { language, setLanguage };
}

/**
 * Faqat joriy tilni qaytaradi.
 */
export function useCurrentLanguage(): Language {
  return useLanguageContext().language;
}

/**
 * Global t() — modul parametrini har safar ko'rsatish imkoni.
 */
export function useTGlobal() {
  return useLanguageContext().t;
}

/**
 * {placeholder} interpolatsiyasi bilan tarjima.
 */
export function useInterpolatedTranslation(module: TranslationModuleName = 'common') {
  const { language } = useLanguageContext();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const raw = getTranslation(language, module, key);
      return params ? interpolate(raw, params) : raw;
    },
    [language, module],
  );

  return { t, language };
}

/**
 * @deprecated useTranslation() yoki useLanguageSetter() ishlatilsin.
 * Eski i18n.tsx dagi useLanguage() bilan mos keladi.
 */
export function useLanguage() {
  return useLanguageContext();
}
