/**
 * @module aisha-i18n.spec
 * @description Verifies uz/ru AIsha translation files have identical key shapes
 * (no missing translations on either side).
 */

import { describe, expect, it } from 'vitest';
import uz from '../locales/uz/aisha.json';
import ru from '../locales/ru/aisha.json';

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return prefix ? [prefix] : [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('AIsha i18n', () => {
  it('exposes matching key sets in uz and ru', () => {
    const uzKeys = flatten(uz).sort();
    const ruKeys = flatten(ru).sort();
    expect(ruKeys).toEqual(uzKeys);
  });
});
