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

// ─── Provider ────────────────────────────────────────────────────────────────

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? getStoredLanguage(),
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
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
