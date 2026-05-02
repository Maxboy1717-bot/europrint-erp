import { describe, it, expect } from 'vitest';
import { ALL_TRANSLATIONS } from '../loader';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, TRANSLATION_MODULES } from '../constants';

// ─── Structural completeness ──────────────────────────────────────────────────

describe('Translation completeness', () => {
  it('every supported language has all 30 modules defined', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const mod of TRANSLATION_MODULES) {
        expect(
          ALL_TRANSLATIONS[lang][mod],
          `${lang}/${mod} mavjud bo'lishi kerak`,
        ).toBeDefined();
      }
    }
  });

  it('every module for every language is an object (not null/array)', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const mod of TRANSLATION_MODULES) {
        const m = ALL_TRANSLATIONS[lang][mod];
        expect(typeof m, `${lang}/${mod} object bo'lishi kerak`).toBe('object');
        expect(Array.isArray(m), `${lang}/${mod} array bo'lmasligi kerak`).toBe(false);
      }
    }
  });

  it('every module has at least 1 translation key', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const mod of TRANSLATION_MODULES) {
        const keys = Object.keys(ALL_TRANSLATIONS[lang][mod]);
        expect(
          keys.length,
          `${lang}/${mod} kamida 1 ta kalit bo'lishi kerak`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every translation value is a non-empty string', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const mod of TRANSLATION_MODULES) {
        const entries = Object.entries(ALL_TRANSLATIONS[lang][mod]);
        for (const [key, val] of entries) {
          expect(
            typeof val,
            `${lang}/${mod}/${key} string bo'lishi kerak`,
          ).toBe('string');
          expect(
            (val as string).length,
            `${lang}/${mod}/${key} bo'sh string bo'lmasligi kerak`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ─── Per-module key parity ────────────────────────────────────────────────────

describe('Key parity between UZ and RU', () => {
  const baseLanguage = DEFAULT_LANGUAGE;
  const otherLanguages = SUPPORTED_LANGUAGES.filter((l) => l !== baseLanguage);

  for (const mod of TRANSLATION_MODULES) {
    const baseKeys = Object.keys(ALL_TRANSLATIONS[baseLanguage][mod]).sort();

    it(`${mod}: all UZ keys exist in RU`, () => {
      for (const lang of otherLanguages) {
        const langKeys = Object.keys(ALL_TRANSLATIONS[lang][mod]);
        const missing = (Array.isArray(baseKeys) ? baseKeys : []).filter((k) => !langKeys.includes(k));
        expect(
          missing,
          `${lang}/${mod} da yetishmayotgan kalitlar: ${missing.join(', ')}`,
        ).toHaveLength(0);
      }
    });

    it(`${mod}: RU does not have extra keys absent in UZ`, () => {
      for (const lang of otherLanguages) {
        const langKeys = Object.keys(ALL_TRANSLATIONS[lang][mod]).sort();
        const extra = (Array.isArray(langKeys) ? langKeys : []).filter((k) => !baseKeys.includes(k));
        expect(
          extra,
          `${lang}/${mod} da ortiqcha kalitlar: ${extra.join(', ')}`,
        ).toHaveLength(0);
      }
    });
  }
});

// ─── Known critical keys ──────────────────────────────────────────────────────

describe('Critical translation keys exist', () => {
  const criticalCommon = [
    'save', 'cancel', 'delete', 'edit', 'add',
    'loading', 'search', 'close', 'back', 'error',
    'success', 'yes', 'no', 'logout', 'settings',
  ];

  for (const key of criticalCommon) {
    it(`common.${key} exists in all languages`, () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(
          ALL_TRANSLATIONS[lang].common[key],
          `${lang}/common/${key} mavjud bo'lishi kerak`,
        ).toBeDefined();
        expect(
          ALL_TRANSLATIONS[lang].common[key],
          `${lang}/common/${key} string bo'lishi kerak`,
        ).toBeTypeOf('string');
      }
    });
  }
});

// ─── LANGUAGE_STORAGE_KEY constant ───────────────────────────────────────────

describe('Constants', () => {
  it('DEFAULT_LANGUAGE is "uz"', () => {
    expect(DEFAULT_LANGUAGE).toBe('uz');
  });

  it('SUPPORTED_LANGUAGES contains exactly "uz" and "ru"', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['ru', 'uz']);
  });

  it('TRANSLATION_MODULES contains exactly 30 modules', () => {
    expect(TRANSLATION_MODULES).toHaveLength(30);
  });

  it('TRANSLATION_MODULES contains expected module names', () => {
    const expected = [
      'common', 'auth', 'dashboard', 'hr', 'finance',
      'production', 'warehouse', 'wms', 'crm', 'lms',
      'settings', 'errors', 'validation', 'marketing',
      'navigation', 'public', 'sd', 'mes', 'kanban',
      'director', 'security', 'notifications', 'iot',
      'admin', 'mro', 'design', 'logistics', 'pos',
      'ai', 'coordination',
    ];
    for (const mod of expected) {
      expect(TRANSLATION_MODULES).toContain(mod);
    }
  });
});
