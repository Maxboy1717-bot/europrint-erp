/**
 * @module context
 * @description Frontend utility / library module.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getStoredLanguage, setStoredLanguage } from './utils';
import { getTranslation, interpolate } from './loader';
import type {
  Language,
  LanguageContextType,
  LanguageProviderProps,
  TranslationModuleName,
} from './types';

// ─── Context ─────────────────────────────────────────────────────────────────

const _noop = () => {};
const _defaultCtx: LanguageContextType = {
  language: 'uz',
  setLanguage: _noop,
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageContextType>(_defaultCtx);

// ─── Global `t` fallback ─────────────────────────────────────────────────────
// Many components were auto-refactored to call t() without their own hook.
// To avoid `t is not defined` runtime errors in those leftover spots, we expose
// a module-level `t` that the LanguageProvider updates on each language change.
// This is a stop-gap until every component has its own useTranslation hook.
let _currentLanguage: Language = 'uz';
function _globalT(key: string, _module?: TranslationModuleName, params?: Record<string, string | number>): string {
  const raw = getTranslation(_currentLanguage, _module ?? 'common', key);
  return params ? interpolate(raw, params) : raw;
}
if (typeof globalThis !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).t = _globalT;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? getStoredLanguage(),
  );

  // Keep the global `_currentLanguage` in sync with state so the global `t` fallback
  // returns translations for the current language.
  _currentLanguage = language;

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
    _currentLanguage = lang;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback(
    (
      key: string,
      module: TranslationModuleName = 'common',
      params?: Record<string, string | number>,
    ): string => {
      const raw = getTranslation(language, module, key);
      return params ? interpolate(raw, params) : raw;
    },
    [language],
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Internal hook ────────────────────────────────────────────────────────────

export function useLanguageContext(): LanguageContextType {
  return useContext(LanguageContext);
}
