/**
 * @module constants.test
 * @description Vitest tests for the frontend constants module.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  LARGE_LIST_LIMIT,
  CACHE_STALE_TIME_MS,
  CACHE_GC_TIME_MS,
  REFETCH_INTERVAL_MS,
  TOAST_DURATION_MS,
  DEBOUNCE_DELAY_MS,
  MAX_UPLOAD_SIZE_MB,
  MAX_UPLOAD_SIZE_BYTES,
  MIN_SEARCH_CHARS,
  MAX_ITEMS_PER_EXPORT,
  CURRENCY_DECIMAL_PLACES,
} from '../constants';

describe('frontend constants', () => {
  it('DEFAULT_PAGE_SIZE is positive and ≤ MAX_PAGE_SIZE', () => {
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
    expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });

  it('MAX_PAGE_SIZE is ≤ LARGE_LIST_LIMIT', () => {
    expect(MAX_PAGE_SIZE).toBeLessThanOrEqual(LARGE_LIST_LIMIT);
  });

  it('CACHE_GC_TIME_MS is longer than CACHE_STALE_TIME_MS', () => {
    expect(CACHE_GC_TIME_MS).toBeGreaterThan(CACHE_STALE_TIME_MS);
  });

  it('REFETCH_INTERVAL_MS is at least 1 second', () => {
    expect(REFETCH_INTERVAL_MS).toBeGreaterThanOrEqual(1_000);
  });

  it('MAX_UPLOAD_SIZE_BYTES equals MAX_UPLOAD_SIZE_MB × 1024 × 1024', () => {
    expect(MAX_UPLOAD_SIZE_BYTES).toBe(MAX_UPLOAD_SIZE_MB * 1024 * 1024);
  });

  it('DEBOUNCE_DELAY_MS is between 50ms and 1000ms', () => {
    expect(DEBOUNCE_DELAY_MS).toBeGreaterThanOrEqual(50);
    expect(DEBOUNCE_DELAY_MS).toBeLessThanOrEqual(1_000);
  });

  it('TOAST_DURATION_MS is at least 1 second', () => {
    expect(TOAST_DURATION_MS).toBeGreaterThanOrEqual(1_000);
  });

  it('MIN_SEARCH_CHARS and MAX_ITEMS_PER_EXPORT have reasonable bounds', () => {
    expect(MIN_SEARCH_CHARS).toBeGreaterThan(0);
    expect(MAX_ITEMS_PER_EXPORT).toBeGreaterThan(100);
  });

  it('CURRENCY_DECIMAL_PLACES is a non-negative integer', () => {
    expect(Number.isInteger(CURRENCY_DECIMAL_PLACES)).toBe(true);
    expect(CURRENCY_DECIMAL_PLACES).toBeGreaterThanOrEqual(0);
  });
});
