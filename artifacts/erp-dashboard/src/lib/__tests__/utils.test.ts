/**
 * @module utils.test
 * @description Vitest tests for the cn / nanoid helpers in lib/utils.
 */

import { describe, it, expect } from 'vitest';
import { cn, nanoid } from '../utils';

describe('cn', () => {
  it('joins class strings with spaces', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips falsy values', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });

  it('honours conditional object form', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });

  it('returns empty string when nothing is passed', () => {
    expect(cn()).toBe('');
  });

  it('twMerge resolves conflicting Tailwind utility classes', () => {
    // p-2 + p-4 → twMerge keeps the last one (p-4)
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('nanoid', () => {
  it('returns a string of default length 12', () => {
    const id = nanoid();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(12);
  });

  it('returns a string of the requested length', () => {
    expect(nanoid(8).length).toBe(8);
    expect(nanoid(32).length).toBe(32);
  });

  it('contains only allowed alphanumeric characters', () => {
    const id = nanoid(64);
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
  });

  it('produces (with very high probability) different ids', () => {
    const a = nanoid(16);
    const b = nanoid(16);
    expect(a).not.toBe(b);
  });
});
