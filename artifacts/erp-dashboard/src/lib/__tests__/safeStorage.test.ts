/**
 * @module safeStorage.test
 * @description Vitest tests for the safeStorage wrapper.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { safeStorage } from '../safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore in non-browser env
    }
  });

  it('setItem / getItem round-trip', () => {
    safeStorage.setItem('foo', 'bar');
    expect(safeStorage.getItem('foo')).toBe('bar');
  });

  it('getItem returns null when key is absent', () => {
    expect(safeStorage.getItem('missing')).toBeNull();
  });

  it('removeItem deletes the entry', () => {
    safeStorage.setItem('a', '1');
    safeStorage.removeItem('a');
    expect(safeStorage.getItem('a')).toBeNull();
  });

  it('clear empties the store', () => {
    safeStorage.setItem('x', '1');
    safeStorage.setItem('y', '2');
    safeStorage.clear();
    expect(safeStorage.getItem('x')).toBeNull();
    expect(safeStorage.getItem('y')).toBeNull();
  });

  it('setJson / getJson round-trip', () => {
    safeStorage.setJson('user', { id: 1, name: 'A' });
    expect(safeStorage.getJson('user', null)).toEqual({ id: 1, name: 'A' });
  });

  it('getJson returns fallback when key is missing', () => {
    const fallback = { default: true };
    expect(safeStorage.getJson('missing', fallback)).toBe(fallback);
  });

  it('getJson returns fallback when stored value is invalid JSON', () => {
    safeStorage.setItem('bad', '{not-json');
    expect(safeStorage.getJson('bad', { ok: false })).toEqual({ ok: false });
  });

  it('setJson handles non-serialisable values without throwing', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => safeStorage.setJson('c', circular)).not.toThrow();
  });
});
