/**
 * currency.vo.spec.ts — Currency value object tests (DDD C.20).
 */

import { Currency } from '../../src/modules/shared/domain/value-objects/currency.vo';

describe('Currency value object', () => {
  it('accepts UZS', () => {
    const r = Currency.of('UZS');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.code).toBe('UZS');
  });

  it('accepts lower-case input and normalises to uppercase', () => {
    const r = Currency.of('usd');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.code).toBe('USD');
  });

  it('returns Err for empty input', () => {
    const r = Currency.of('');
    expect(r.ok).toBe(false);
  });

  it('returns Err for malformed code (two letters)', () => {
    const r = Currency.of('US');
    expect(r.ok).toBe(false);
  });

  it('returns Err for non-whitelisted code', () => {
    const r = Currency.of('XYZ');
    expect(r.ok).toBe(false);
  });

  it('UZS() and USD() static factories return canonical instances', () => {
    expect(Currency.UZS().code).toBe('UZS');
    expect(Currency.USD().code).toBe('USD');
  });

  it('equals returns true for same code, false otherwise', () => {
    expect(Currency.UZS().equals(Currency.UZS())).toBe(true);
    expect(Currency.UZS().equals(Currency.USD())).toBe(false);
    expect(Currency.UZS().equals(null)).toBe(false);
  });
});
