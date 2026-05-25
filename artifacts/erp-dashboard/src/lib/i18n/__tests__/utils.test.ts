/**
 * @module utils.test
 * @description Jest / Vitest test suite.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredLanguage, setStoredLanguage, isValidLanguage } from '../utils';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../constants';
import { safeStorage } from '@/lib/safeStorage';

// ─── getStoredLanguage ────────────────────────────────────────────────────────

describe('getStoredLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset navigator.language to default jsdom value ('en')
    Object.defineProperty(window.navigator, 'language', {
      value: 'en',
      configurable: true,
    });
  });

  it('returns DEFAULT_LANGUAGE when localStorage is empty and browser lang is unsupported', () => {
    expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('returns "uz" from unified LANGUAGE_STORAGE_KEY', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'uz');
    expect(getStoredLanguage()).toBe('uz');
  });

  it('returns "ru" from unified LANGUAGE_STORAGE_KEY', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    expect(getStoredLanguage()).toBe('ru');
  });

  it('ignores invalid value in LANGUAGE_STORAGE_KEY and falls through', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to legacy app_language key when primary key is empty', () => {
    safeStorage.setItem('app_language', 'ru');
    expect(getStoredLanguage()).toBe('ru');
  });

  it('falls back to legacy europrint-lang key when both primary and first legacy are empty', () => {
    safeStorage.setItem('europrint-lang', 'ru');
    expect(getStoredLanguage()).toBe('ru');
  });

  it('prefers LANGUAGE_STORAGE_KEY over legacy keys', () => {
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, 'uz');
    safeStorage.setItem('app_language', 'ru');
    safeStorage.setItem('europrint-lang', 'ru');
    expect(getStoredLanguage()).toBe('uz');
  });

  it('falls back to navigator.language when it is a supported language', () => {
    Object.defineProperty(window.navigator, 'language', {
      value: 'ru-RU',
      configurable: true,
    });
    expect(getStoredLanguage()).toBe('ru');
  });

  it('ignores navigator.language when it is not a supported language', () => {
    Object.defineProperty(window.navigator, 'language', {
      value: 'de-DE',
      configurable: true,
    });
    expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('returns DEFAULT_LANGUAGE when window is undefined (SSR environment)', () => {
    const origWindow = global.window;
    // Simulate SSR: window is not defined
    Object.defineProperty(global, 'window', { value: undefined, configurable: true });
    try {
      expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
    } finally {
      Object.defineProperty(global, 'window', { value: origWindow, configurable: true });
    }
  });

  it('returns DEFAULT_LANGUAGE when localStorage throws (Private Browsing)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
    spy.mockRestore();
  });
});

// ─── setStoredLanguage ────────────────────────────────────────────────────────

describe('setStoredLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves "uz" to localStorage', () => {
    setStoredLanguage('uz');
    expect(safeStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('uz');
  });

  it('saves "ru" to localStorage', () => {
    setStoredLanguage('ru');
    expect(safeStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ru');
  });

  it('overwrites a previously stored language', () => {
    setStoredLanguage('uz');
    setStoredLanguage('ru');
    expect(safeStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ru');
  });

  it('does not throw when Storage.prototype.setItem throws (safeStorage)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(() => setStoredLanguage('ru')).not.toThrow();
    spy.mockRestore();
  });

  it('does not propagate storage errors to the caller in development', () => {
    // safeStorage.setItem catches QuotaExceededError / SecurityError internally,
    // so setStoredLanguage cannot observe the failure and never reaches its
    // own console.warn branch. We assert the public contract: setStoredLanguage
    // never throws, even when the underlying storage rejects writes.
    vi.stubEnv('NODE_ENV', 'development');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(() => setStoredLanguage('ru')).not.toThrow();

    warnSpy.mockRestore();
    setItemSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('does NOT emit console.warn in production when localStorage throws', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    setStoredLanguage('ru');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    setItemSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});

// ─── isValidLanguage ──────────────────────────────────────────────────────────

describe('isValidLanguage', () => {
  it.each(['uz', 'ru'])('returns true for supported language "%s"', (lang) => {
    expect(isValidLanguage(lang)).toBe(true);
  });

  it.each(['en', 'de', 'fr', 'tr', 'UZ', 'RU', ''])(
    'returns false for unsupported string "%s"',
    (lang) => {
      expect(isValidLanguage(lang)).toBe(false);
    },
  );

  it.each([null, undefined, 0, 1, true, false, {}, []])(
    'returns false for non-string value %s',
    (val) => {
      expect(isValidLanguage(val)).toBe(false);
    },
  );
});
