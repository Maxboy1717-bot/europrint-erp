/**
 * @module queryClient.test
 * @description Vitest tests for the safeArray / selectArray helpers.
 */

import { describe, it, expect } from 'vitest';
import { safeArray, selectArray, queryClient } from '../queryClient';

describe('safeArray', () => {
  it('returns the same array when input is already an array', () => {
    const arr = [1, 2, 3];
    expect(safeArray(arr)).toBe(arr);
  });

  it('extracts from { data: [...] } envelope', () => {
    expect(safeArray({ data: [1, 2] })).toEqual([1, 2]);
  });

  it('extracts from { items: [...] } envelope', () => {
    expect(safeArray({ items: ['a'] })).toEqual(['a']);
  });

  it('extracts from { results: [...] } envelope', () => {
    expect(safeArray({ results: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it('extracts from { orders: [...] } envelope', () => {
    expect(safeArray({ orders: [{ orderNo: 1 }] })).toEqual([{ orderNo: 1 }]);
  });

  it('honours the explicit key argument over defaults', () => {
    expect(safeArray({ leads: [{ id: 9 }] }, 'leads')).toEqual([{ id: 9 }]);
  });

  it('returns empty array for null / undefined / non-object', () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray(undefined)).toEqual([]);
    expect(safeArray(42)).toEqual([]);
    expect(safeArray('not an array')).toEqual([]);
  });

  it('returns empty array when no known key contains an array', () => {
    expect(safeArray({ unrelated: 'x' })).toEqual([]);
  });
});

describe('selectArray', () => {
  it('behaves identically to safeArray', () => {
    expect(selectArray({ data: [1, 2] })).toEqual([1, 2]);
    expect(selectArray(null)).toEqual([]);
  });

  it('forwards the key argument', () => {
    expect(selectArray({ tasks: [1] }, 'tasks')).toEqual([1]);
  });
});

describe('queryClient singleton', () => {
  it('is exported and exposes defaultOptions', () => {
    expect(queryClient).toBeDefined();
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });

  it('default mutations.retry is false', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });
});
