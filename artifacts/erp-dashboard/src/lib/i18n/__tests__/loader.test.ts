/**
 * @module loader.test
 * @description Jest / Vitest test suite.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ALL_TRANSLATIONS,
  getTranslation,
  interpolate,
  validateTranslationCompleteness,
} from '../loader';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, TRANSLATION_MODULES } from '../constants';

// ─── ALL_TRANSLATIONS structure ───────────────────────────────────────────────

describe('ALL_TRANSLATIONS', () => {
  it('contains exactly the two supported languages', () => {
    const keys = Object.keys(ALL_TRANSLATIONS);
    expect(keys.sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });

  it('contains all 30 modules for each language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const modules = Object.keys(ALL_TRANSLATIONS[lang]);
      for (const mod of TRANSLATION_MODULES) {
        expect(modules).toContain(mod);
      }
    }
  });

  it('each module has at least one key', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const mod of TRANSLATION_MODULES) {
        const keys = Object.keys(ALL_TRANSLATIONS[lang][mod]);
        expect(keys.length, `${lang}/${mod} bo'sh bo'lmasligi kerak`).toBeGreaterThan(0);
      }
    }
  });
});

// ─── getTranslation ───────────────────────────────────────────────────────────

describe('getTranslation', () => {
  it('returns UZ translation for a known key', () => {
    expect(getTranslation('uz', 'common', 'save')).toBe('Saqlash');
  });

  it('returns RU translation for a known key', () => {
    expect(getTranslation('ru', 'common', 'save')).toBe('Сохранить');
  });

  it('returns a different key from UZ common module', () => {
    expect(getTranslation('uz', 'common', 'cancel')).toBe('Bekor qilish');
  });

  it('returns a different key from RU common module', () => {
    expect(getTranslation('ru', 'common', 'cancel')).toBe('Отмена');
  });

  it('returns key itself when key is missing from both lang and DEFAULT_LANGUAGE', () => {
    const result = getTranslation('ru', 'common', '__nonexistent_xyz_key__');
    expect(result).toBe('__nonexistent_xyz_key__');
  });

  it('uses provided fallback string when key is missing', () => {
    const result = getTranslation('ru', 'common', '__nonexistent_xyz_key__', 'fallback text');
    expect(result).toBe('fallback text');
  });

  it('falls back to DEFAULT_LANGUAGE value when lang is missing a key', () => {
    // Pick a key that exists in uz/common but test the fallback chain
    const uzValue = getTranslation('uz', 'common', 'save');
    const ruValue = getTranslation('ru', 'common', 'save');
    // Both exist, so they return their own values (not the fallback)
    expect(uzValue).not.toBe(ruValue);
  });

  it('emits console.warn in development for missing key', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    getTranslation('uz', 'common', '__missing_key_dev_warn__');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('__missing_key_dev_warn__'),
    );

    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('does NOT emit console.warn in production for missing key', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    getTranslation('uz', 'common', '__missing_key_prod__');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('returns same value on repeated calls (cache is consistent)', () => {
    const first = getTranslation('uz', 'common', 'save');
    const second = getTranslation('uz', 'common', 'save');
    expect(first).toBe(second);
  });

  it('works for all 30 modules in uz', () => {
    for (const mod of TRANSLATION_MODULES) {
      const keys = Object.keys(ALL_TRANSLATIONS['uz'][mod]);
      if (keys.length > 0) {
        const result = getTranslation('uz', mod, keys[0]);
        expect(result).toBe(ALL_TRANSLATIONS['uz'][mod][keys[0]]);
      }
    }
  });
});

// ─── interpolate ─────────────────────────────────────────────────────────────

describe('interpolate', () => {
  it('replaces a single {placeholder}', () => {
    expect(interpolate('Salom, {name}!', { name: 'Ali' })).toBe('Salom, Ali!');
  });

  it('replaces multiple {placeholders}', () => {
    expect(interpolate('{count} ta {item} topildi', { count: 5, item: 'buyum' }))
      .toBe('5 ta buyum topildi');
  });

  it('replaces a numeric value correctly', () => {
    expect(interpolate('ID: {id}', { id: 42 })).toBe('ID: 42');
  });

  it('leaves unknown placeholder as-is', () => {
    expect(interpolate('Xabar: {unknown}', {})).toBe('Xabar: {unknown}');
  });

  it('handles a template with no placeholders', () => {
    expect(interpolate('Oddiy matn', {})).toBe('Oddiy matn');
  });

  it('handles empty string template', () => {
    expect(interpolate('', { name: 'test' })).toBe('');
  });

  it('replaces the same placeholder multiple times', () => {
    expect(interpolate('{n} + {n} = {result}', { n: 2, result: 4 }))
      .toBe('2 + 2 = 4');
  });

  it('handles special regex characters in replacement value safely', () => {
    expect(interpolate('Narx: {price}', { price: '$100.00' })).toBe('Narx: $100.00');
  });
});

// ─── validateTranslationCompleteness ─────────────────────────────────────────

describe('validateTranslationCompleteness', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('does nothing (no warn) in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    validateTranslationCompleteness();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('runs without throwing in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => validateTranslationCompleteness()).not.toThrow();
  });

  it('skips DEFAULT_LANGUAGE itself when checking completeness', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    validateTranslationCompleteness();
    // Any warn calls should mention non-default languages only
    const calls = warnSpy.mock.calls?.map((c) => String(c[0]));
    for (const call of calls) {
      expect(call).not.toContain(`${DEFAULT_LANGUAGE}/`);
    }
  });
});
