import { describe, it, expect } from 'vitest';

describe('numericMoney custom type behavior', () => {
  describe('fromDriver (DB string → TypeScript number)', () => {
    const fromDriver = (value: string): number => parseFloat(value ?? '0') || 0;

    it('oddiy son qaytaradi', () => {
      expect(fromDriver('12345.6789')).toBeCloseTo(12345.6789, 4);
    });

    it('butun son string → number', () => {
      expect(fromDriver('1000')).toBe(1000);
    });

    it('"0" → 0', () => {
      expect(fromDriver('0')).toBe(0);
    });

    it('manfiy qiymat', () => {
      expect(fromDriver('-500.25')).toBeCloseTo(-500.25, 2);
    });

    it('bo\'sh string → 0 (fallback)', () => {
      expect(fromDriver('')).toBe(0);
    });

    it('null ga o\'xshash undefined → 0', () => {
      expect(fromDriver(undefined as unknown as string)).toBe(0);
    });

    it('noto\'g\'ri string → 0', () => {
      expect(fromDriver('abc')).toBe(0);
    });

    it('katta son bilan ishlaydi', () => {
      expect(fromDriver('999999999.9999')).toBeCloseTo(999999999.9999, 2);
    });
  });

  describe('toDriver (TypeScript number → DB string)', () => {
    const toDriver = (value: number): string => String(value ?? 0);

    it('oddiy son string ga aylanadi', () => {
      expect(toDriver(123.45)).toBe('123.45');
    });

    it('0 → "0"', () => {
      expect(toDriver(0)).toBe('0');
    });

    it('manfiy → to\'g\'ri string', () => {
      expect(toDriver(-99.99)).toBe('-99.99');
    });

    it('null → "0" (fallback)', () => {
      expect(toDriver(null as unknown as number)).toBe('0');
    });

    it('undefined → "0" (fallback)', () => {
      expect(toDriver(undefined as unknown as number)).toBe('0');
    });

    it('katta son → string', () => {
      expect(toDriver(1_000_000)).toBe('1000000');
    });
  });

  describe('fromDriver ↔ toDriver round-trip', () => {
    const fromDriver = (value: string): number => parseFloat(value ?? '0') || 0;
    const toDriver = (value: number): string => String(value ?? 0);

    it('to\'g\'ri qiymat round-trip amalga oshiradi', () => {
      const original = 12345.6789;
      const roundTripped = fromDriver(toDriver(original));
      expect(roundTripped).toBeCloseTo(original, 4);
    });

    it('nol round-trip', () => {
      expect(fromDriver(toDriver(0))).toBe(0);
    });

    it('manfiy qiymat round-trip', () => {
      const original = -0.5;
      expect(fromDriver(toDriver(original))).toBeCloseTo(original, 4);
    });
  });
});
