/**
 * @module format.test
 * @description Vitest tests for date/currency/number formatters.
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
} from '../format';

describe('formatDate', () => {
  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns "-" for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('returns "-" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('formats a valid Date instance to a non-empty string', () => {
    const out = formatDate(new Date('2024-04-22T12:00:00Z'));
    expect(out).not.toBe('-');
    expect(out.length).toBeGreaterThan(0);
  });

  it('formats a valid ISO date string', () => {
    const out = formatDate('2024-01-15');
    expect(out).not.toBe('-');
  });
});

describe('formatDateTime', () => {
  it('returns "-" for null', () => {
    expect(formatDateTime(null)).toBe('-');
  });

  it('returns "-" for invalid string', () => {
    expect(formatDateTime('xxx')).toBe('-');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    const out = formatDateTime('2024-04-22T08:30:00Z');
    expect(out).not.toBe('-');
    expect(out.length).toBeGreaterThan(0);
  });

  it('accepts a Date instance', () => {
    const out = formatDateTime(new Date('2024-04-22T08:30:00Z'));
    expect(out).not.toBe('-');
  });
});

describe('formatCurrency', () => {
  it('returns "0 UZS" for null', () => {
    expect(formatCurrency(null)).toBe('0 UZS');
  });

  it('returns "0 UZS" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('0 UZS');
  });

  it('honours the currency argument in fallback', () => {
    expect(formatCurrency(null, 'USD')).toBe('0 USD');
  });

  it('formats a positive amount without decimals', () => {
    const out = formatCurrency(1500);
    expect(out).not.toBe('0 UZS');
    expect(out).not.toMatch(/\.00/);
  });

  it('formats zero amount as a real currency string (not fallback)', () => {
    const out = formatCurrency(0);
    expect(out).not.toBe('0 UZS');
  });
});

describe('formatNumber', () => {
  it('returns "0" for null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('returns "0" for undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('formats integers as locale strings', () => {
    const out = formatNumber(1000);
    expect(out).not.toBe('0');
    expect(out.length).toBeGreaterThan(0);
  });

  it('formats a real number value', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('handles negative numbers', () => {
    const out = formatNumber(-100);
    expect(out.length).toBeGreaterThan(0);
  });
});
