/**
 * @module utils
 * @description Frontend utility / library module.
 */

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './constants';
import type { Language } from './types';
import { safeStorage } from '@/lib/safeStorage';

/**
 * LocalStorage dan saqlangan tilni o'qiydi.
 * Xavfsiz: try/catch bilan Private Browsing va Safari ga chidamli.
 * Fallback: brauzer tili → DEFAULT_LANGUAGE ('uz')
 */
export function getStoredLanguage(): Language {
  try {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

    // Yangi unified kalit
    const stored = safeStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }

    // Eski kalitlar bilan orqaga muvofiqliq
    const legacy1 = safeStorage.getItem('app_language');
    if (legacy1 && (SUPPORTED_LANGUAGES as readonly string[]).includes(legacy1)) {
      return legacy1 as Language;
    }
    const legacy2 = safeStorage.getItem('europrint-lang');
    if (legacy2 && (SUPPORTED_LANGUAGES as readonly string[]).includes(legacy2)) {
      return legacy2 as Language;
    }

    // Brauzer tilini tekshirish
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang)) {
      return browserLang as Language;
    }

    return DEFAULT_LANGUAGE;
  } catch {
    // localStorage mavjud emas (Private Browsing, Safari, iframe sandbox)
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Tanlangan tilni localStorage ga saqlaydi.
 * Xavfsiz: muvaffaqiyatsizlik dasturni to'xtatmaydi.
 */
export function setStoredLanguage(lang: Language): void {
  try {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[i18n] Til localStorage ga saqlanmadi:', lang);
    }
  }
}

/**
 * Til to'g'ri ekanligini tekshiradi.
 */
export function isValidLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
