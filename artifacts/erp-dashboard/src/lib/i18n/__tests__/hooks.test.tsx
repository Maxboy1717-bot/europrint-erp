/**
 * @module hooks.test
 * @description Jest / Vitest test suite.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LanguageProvider } from '../context';
import {
  useTranslation,
  useLanguageSetter,
  useCurrentLanguage,
  useTGlobal,
  useInterpolatedTranslation,
  useLanguage,
} from '../hooks';

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function wrapper({ lang = 'uz' as 'uz' | 'ru', children }: { lang?: 'uz' | 'ru'; children: React.ReactNode }) {
  return <LanguageProvider initialLanguage={lang}>{children}</LanguageProvider>;
}

// ─── useTranslation ───────────────────────────────────────────────────────────

describe('useTranslation', () => {
  it('returns correct language', () => {
    function Comp() {
      const { language } = useTranslation();
      return <div data-testid="lang">{language}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'ru', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  it('returns UZ translation from default (common) module', () => {
    function Comp() {
      const { t } = useTranslation();
      return <div data-testid="val">{t('save')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('val').textContent).toBe('Saqlash');
  });

  it('returns RU translation from default (common) module', () => {
    function Comp() {
      return <div data-testid="val">{t('save')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'ru', children }) });
    expect(screen.getByTestId('val').textContent).toBe('Сохранить');
  });

  it('returns translation from a specific module', () => {
    function Comp() {
      return <div data-testid="val">{t('notFound')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    const val = screen.getByTestId('val').textContent ?? '';
    expect(val.length).toBeGreaterThan(0);
    expect(val).not.toBe('notFound');
  });

  it('t() with params interpolates the string', () => {
    function Comp() {
      return <div data-testid="val">{t('save', { x: '!' })}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    // 'save' = 'Saqlash' — no {x} placeholder, returns unchanged
    expect(screen.getByTestId('val').textContent).toBe('Saqlash');
  });

  it('returns key itself for unknown key', () => {
    function Comp() {
      return <div data-testid="val">{t('__unknown_hooks_key__')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ children }) });
    expect(screen.getByTestId('val').textContent).toBe('__unknown_hooks_key__');
  });

  it('updates when language changes', async () => {
    const user = userEvent.setup();

    function Comp() {
      const { setLanguage, language } = useLanguageSetter();
      return (
        <>
          <div data-testid="val">{t('save')}</div>
          <button onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}>switch</button>
        </>
      );
    }

    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('val').textContent).toBe('Saqlash');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('val').textContent).toBe('Сохранить');
  });
});

// ─── useLanguageSetter ────────────────────────────────────────────────────────

describe('useLanguageSetter', () => {
  it('returns current language', () => {
    function Comp() {
      const { language } = useLanguageSetter();
      return <div data-testid="lang">{language}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'ru', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  it('setLanguage updates the language in context', async () => {
    const user = userEvent.setup();

    function Comp() {
      const { language, setLanguage } = useLanguageSetter();
      return (
        <button onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}>
          {language}
        </button>
      );
    }

    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByRole('button').textContent).toBe('uz');

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('ru');
  });
});

// ─── useCurrentLanguage ───────────────────────────────────────────────────────

describe('useCurrentLanguage', () => {
  it('returns "uz" for uz provider', () => {
    function Comp() {
      const lang = useCurrentLanguage();
      return <div data-testid="lang">{lang}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('uz');
  });

  it('returns "ru" for ru provider', () => {
    function Comp() {
      const lang = useCurrentLanguage();
      return <div data-testid="lang">{lang}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'ru', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });
});

// ─── useTGlobal ───────────────────────────────────────────────────────────────

describe('useTGlobal', () => {
  it('translates with explicit module parameter', () => {
    function Comp() {
      const t = useTGlobal();
      return <div data-testid="val">{t('save', 'common')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('val').textContent).toBe('Saqlash');
  });

  it('uses common module by default', () => {
    function Comp() {
      const t = useTGlobal();
      return <div data-testid="val">{t('cancel')}</div>;
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('val').textContent).toBe('Bekor qilish');
  });
});

// ─── useInterpolatedTranslation ───────────────────────────────────────────────

describe('useInterpolatedTranslation', () => {
  it('returns language and t function', () => {
    function Comp() {
      const { language, t } = useInterpolatedTranslation();
      return (
        <>
          <div data-testid="lang">{language}</div>
          <div data-testid="val">{t('save')}</div>
        </>
      );
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('uz');
    expect(screen.getByTestId('val').textContent).toBe('Saqlash');
  });
});

// ─── useLanguage (deprecated) ─────────────────────────────────────────────────

describe('useLanguage (deprecated)', () => {
  it('still returns language, setLanguage, and t from context', () => {
    function Comp() {
      const ctx = useLanguage();
      return (
        <>
          <div data-testid="lang">{ctx.language}</div>
          <div data-testid="hasSetLang">{typeof ctx.setLanguage}</div>
          <div data-testid="hasT">{typeof ctx.t}</div>
        </>
      );
    }
    render(<Comp />, { wrapper: ({ children }) => wrapper({ lang: 'uz', children }) });
    expect(screen.getByTestId('lang').textContent).toBe('uz');
    expect(screen.getByTestId('hasSetLang').textContent).toBe('function');
    expect(screen.getByTestId('hasT').textContent).toBe('function');
  });
});
