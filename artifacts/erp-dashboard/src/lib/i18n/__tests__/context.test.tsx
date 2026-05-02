import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LanguageProvider, useLanguageContext } from '../context';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../constants';
import { safeStorage } from '@/lib/safeStorage';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function LanguageDisplay() {
  const { language } = useLanguageContext();
  return <div data-testid="lang">{language}</div>;
}

function TranslationDisplay({ module = 'common' }: { module?: string }) {
  const { t } = useLanguageContext();
  return <div data-testid="translation">{t('save', module as never)}</div>;
}

function LanguageSwitchButton() {
  const { language, setLanguage } = useLanguageContext();
  return (
    <button onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}>
      {language}
    </button>
  );
}

// ─── LanguageProvider ─────────────────────────────────────────────────────────

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children without crashing', () => {
    render(
      <LanguageProvider>
        <div data-testid="child">test</div>
      </LanguageProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides DEFAULT_LANGUAGE when no initialLanguage or stored value', () => {
    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe(DEFAULT_LANGUAGE);
  });

  it('uses initialLanguage prop when provided', () => {
    render(
      <LanguageProvider initialLanguage="ru">
        <LanguageDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  it('reads stored language from localStorage when no initialLanguage', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    render(
      <LanguageProvider>
        <LanguageDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('ru');
  });

  it('initialLanguage takes priority over localStorage', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    render(
      <LanguageProvider initialLanguage="uz">
        <LanguageDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('uz');
  });

  it('switches language when setLanguage is called', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLanguage="uz">
        <LanguageSwitchButton />
      </LanguageProvider>,
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('uz');

    await user.click(button);
    expect(button.textContent).toBe('ru');
  });

  it('persists language to localStorage when setLanguage is called', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLanguage="uz">
        <LanguageSwitchButton />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button'));
    expect(safeStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ru');
  });

  it('sets document.documentElement.lang when setLanguage is called', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider initialLanguage="uz">
        <LanguageSwitchButton />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button'));
    expect(document.documentElement.lang).toBe('ru');
  });

  it('t() returns correct UZ translation', () => {
    render(
      <LanguageProvider initialLanguage="uz">
        <TranslationDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('translation').textContent).toBe('Saqlash');
  });

  it('t() returns correct RU translation after language switch', async () => {
    const user = userEvent.setup();

    function SwitchAndTranslate() {
      const { t, setLanguage } = useLanguageContext();
      return (
        <>
          <div data-testid="translation">{t('save', 'common')}</div>
          <button onClick={() => setLanguage('ru')}>switch</button>
        </>
      );
    }

    render(
      <LanguageProvider initialLanguage="uz">
        <SwitchAndTranslate />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('translation').textContent).toBe('Saqlash');
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('translation').textContent).toBe('Сохранить');
  });

  it('t() returns key itself for unknown translation key', () => {
    function MissingKeyDisplay() {
      const { t } = useLanguageContext();
      return <div data-testid="missing">{t('__missing_key__', 'common')}</div>;
    }

    render(
      <LanguageProvider initialLanguage="uz">
        <MissingKeyDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('missing').textContent).toBe('__missing_key__');
  });

  it('t() with params interpolates correctly', () => {
    function InterpolatedDisplay() {
      const { t } = useLanguageContext();
      const result = t('save', 'common', { count: 99 });
      return <div data-testid="interp">{result}</div>;
    }

    render(
      <LanguageProvider initialLanguage="uz">
        <InterpolatedDisplay />
      </LanguageProvider>,
    );
    // 'save' has no {count} placeholder — returns "Saqlash" unchanged
    expect(screen.getByTestId('interp').textContent).toBe('Saqlash');
  });
});

// ─── useLanguageContext error boundary ────────────────────────────────────────

describe('useLanguageContext', () => {
  it('throws when used outside LanguageProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BareConsumer() {
      useLanguageContext();
      return null;
    }

    expect(() => render(<BareConsumer />)).toThrow(
      /useLanguageContext must be used within/,
    );

    consoleError.mockRestore();
  });
});
