/**
 * test/shared/money-precision.spec.ts
 *
 * Tests for money / decimal-precision concerns: NUMERIC(18,4) round-trips,
 * the 0.1 + 0.2 float-drift trap, and negative-amount handling.
 *
 * The numericMoney Drizzle type lives in lib/db; we don't import that here
 * because the migration boundary is integration-level. Instead we test the
 * conversion contract via Decimal.js (already a dep) and the underlying
 * pg-numeric string representation that Drizzle round-trips.
 */

import Decimal from 'decimal.js';

const toMoney = (n: number | string): string => new Decimal(n).toFixed(4);
const fromMoney = (s: string): number => new Decimal(s).toNumber();

describe('Money precision (numericMoney equivalent)', () => {
  it('round-trips a 4-decimal string verbatim', () => {
    expect(toMoney('123.4500')).toBe('123.4500');
    expect(fromMoney('123.4500')).toBe(123.45);
  });

  it('avoids float-drift trap: 0.1 + 0.2 is exactly 0.3', () => {
    const sum = new Decimal('0.1').plus('0.2');
    expect(sum.toString()).toBe('0.3');
    // Without Decimal: 0.1 + 0.2 === 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
  });

  it('preserves negative amounts', () => {
    expect(toMoney(-12.34)).toBe('-12.3400');
    expect(fromMoney('-12.3400')).toBe(-12.34);
  });

  it('preserves zero', () => {
    expect(toMoney(0)).toBe('0.0000');
    expect(fromMoney('0.0000')).toBe(0);
  });

  it('detects NaN/Infinity (output is NaN/Infinity string, must be guarded by caller)', () => {
    // Decimal.js does NOT throw on NaN/Infinity — it returns 'NaN' / 'Infinity'.
    // Callers must validate input before constructing money values. This test
    // documents the contract: invalid inputs become non-finite outputs that
    // can be detected with new Decimal(x).isFinite() before storage.
    expect(toMoney(NaN)).toBe('NaN');
    expect(new Decimal(NaN).isFinite()).toBe(false);
    expect(new Decimal(Infinity).isFinite()).toBe(false);
    expect(new Decimal(123.45).isFinite()).toBe(true);
  });

  it('multiplication is exact for currency rates', () => {
    // 19.5 UZS * 12 items should be exactly 234.0000
    const total = new Decimal('19.5').times(12);
    expect(total.toFixed(4)).toBe('234.0000');
  });

  it('rounds to bank rounding (half-up) at 4 dp', () => {
    const r = new Decimal('1.23455').toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    expect(r.toString()).toBe('1.2346');
  });

  it('large amounts (18-digit) stay precise', () => {
    // 18 digits total, 4 after decimal → max ~99,999,999,999,999.9999
    const big = '12345678901234.5678';
    expect(toMoney(big)).toBe('12345678901234.5678');
  });

  it('aggregation over 100 small amounts stays exact', () => {
    let sum = new Decimal(0);
    for (let i = 0; i < 100; i += 1) sum = sum.plus('0.0001');
    expect(sum.toFixed(4)).toBe('0.0100');
  });
});

describe('safeArray contract (Array.isArray guard helper)', () => {
  // The codebase uses Array.isArray(x) ? x : [] inline; document the contract.
  const safeArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

  it('returns array verbatim when input is array', () => {
    expect(safeArray([1, 2])).toEqual([1, 2]);
    expect(safeArray([])).toEqual([]);
  });

  it('returns [] for null / undefined', () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray(undefined)).toEqual([]);
  });

  it('returns [] for object/string/number', () => {
    expect(safeArray({ a: 1 })).toEqual([]);
    expect(safeArray('abc')).toEqual([]);
    expect(safeArray(42)).toEqual([]);
    expect(safeArray(false)).toEqual([]);
  });

  it('does not crash when chained with .map', () => {
    const x: unknown = null;
    const out = safeArray<number>(x).map((n) => n * 2);
    expect(out).toEqual([]);
  });
});
