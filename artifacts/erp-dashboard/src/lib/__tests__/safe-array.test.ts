/**
 * @module safe-array.test
 * @description Vitest tests for toArray/toObject/toNumber/toString_/hasItems helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  toArray,
  toObject,
  toNumber,
  toString_,
  hasItems,
} from '../safe-array';

describe('toArray', () => {
  it('returns the same array when input is already an array', () => {
    const arr = [1, 2, 3];
    expect(toArray(arr)).toBe(arr);
  });

  it('extracts .data array from { ok: true, data: [...] }', () => {
    expect(toArray({ ok: true, data: [1, 2] })).toEqual([1, 2]);
  });

  it('extracts plain .data array', () => {
    expect(toArray({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it('extracts .items array', () => {
    expect(toArray({ items: ['a', 'b'], total: 2 })).toEqual(['a', 'b']);
  });

  it('extracts .results / .rows', () => {
    expect(toArray({ results: [1] })).toEqual([1]);
    expect(toArray({ rows: [2] })).toEqual([2]);
  });

  it('returns empty array for null / undefined / number / string', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(42)).toEqual([]);
    expect(toArray('foo')).toEqual([]);
  });
});

describe('toObject', () => {
  it('returns fallback for null', () => {
    expect(toObject(null, { fallback: true })).toEqual({ fallback: true });
  });

  it('returns fallback for undefined', () => {
    expect(toObject(undefined, { a: 1 })).toEqual({ a: 1 });
  });

  it('returns fallback for arrays', () => {
    expect(toObject([1, 2, 3], { fallback: true })).toEqual({ fallback: true });
  });

  it('unwraps { ok: true, data: { ... } }', () => {
    expect(toObject({ ok: true, data: { id: 7 } })).toEqual({ id: 7 });
  });

  it('returns object itself when not wrapped', () => {
    expect(toObject({ name: 'a' })).toEqual({ name: 'a' });
  });
});

describe('toNumber', () => {
  it('returns the number for valid numeric input', () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(-3.14)).toBe(-3.14);
  });

  it('parses numeric strings', () => {
    expect(toNumber('5.5')).toBe(5.5);
    expect(toNumber('-1')).toBe(-1);
  });

  it('returns fallback for non-numeric strings', () => {
    expect(toNumber('abc', 99)).toBe(99);
  });

  it('returns fallback for objects and null', () => {
    expect(toNumber({}, 0)).toBe(0);
    expect(toNumber(null, 7)).toBe(7);
  });

  it('returns fallback for NaN / Infinity', () => {
    expect(toNumber(NaN, 1)).toBe(1);
    expect(toNumber(Infinity, 1)).toBe(1);
  });
});

describe('toString_', () => {
  it('returns the string when input is already a string', () => {
    expect(toString_('hello')).toBe('hello');
  });

  it('returns string of number or boolean', () => {
    expect(toString_(42)).toBe('42');
    expect(toString_(true)).toBe('true');
  });

  it('returns fallback for null / undefined', () => {
    expect(toString_(null, 'fallback')).toBe('fallback');
    expect(toString_(undefined)).toBe('');
  });

  it('returns fallback for objects', () => {
    expect(toString_({ a: 1 }, 'na')).toBe('na');
  });
});

describe('hasItems', () => {
  it('returns true for non-empty array', () => {
    expect(hasItems([1])).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(hasItems([])).toBe(false);
  });

  it('returns false for non-array inputs', () => {
    expect(hasItems(null)).toBe(false);
    expect(hasItems({})).toBe(false);
    expect(hasItems('abc')).toBe(false);
  });
});
