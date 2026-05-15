/**
 * @module sd-helpers.test
 * @description Vitest tests for SD module label/colour helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  fmt,
  SEGMENT_LABELS,
  SEGMENT_COLORS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  SOURCE_LABELS,
  QUOT_STATUS_LABELS,
  QUOT_STATUS_COLORS,
} from '../sd-helpers';

describe('fmt', () => {
  it('formats integer values as a locale string', () => {
    const out = fmt(1500);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('rounds fractional values', () => {
    expect(fmt(1.4)).toBe(fmt(1));
    expect(fmt(1.6)).toBe(fmt(2));
  });

  it('treats null / NaN-like inputs as 0', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(Number.NaN)).toBe('0');
  });

  it('handles negative values', () => {
    const out = fmt(-50);
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('SD label maps', () => {
  it('SEGMENT_LABELS contains all 4 segments', () => {
    expect(SEGMENT_LABELS.vip).toBe('VIP');
    expect(SEGMENT_LABELS.regular).toBeDefined();
    expect(SEGMENT_LABELS.new).toBeDefined();
    expect(SEGMENT_LABELS.potential).toBeDefined();
  });

  it('SEGMENT_COLORS keys match SEGMENT_LABELS', () => {
    for (const key of Object.keys(SEGMENT_LABELS)) {
      expect(SEGMENT_COLORS[key]).toBeDefined();
    }
  });

  it('LEAD_STATUS_LABELS / COLORS keys align', () => {
    for (const key of Object.keys(LEAD_STATUS_LABELS)) {
      expect(LEAD_STATUS_COLORS[key]).toBeDefined();
    }
  });

  it('ORDER_STATUS_LABELS contains all lifecycle stages', () => {
    expect(ORDER_STATUS_LABELS.new).toBeDefined();
    expect(ORDER_STATUS_LABELS.production).toBeDefined();
    expect(ORDER_STATUS_LABELS.delivered).toBeDefined();
    expect(ORDER_STATUS_LABELS.cancelled).toBeDefined();
  });

  it('ORDER_STATUS_COLORS covers every ORDER_STATUS_LABELS key', () => {
    for (const key of Object.keys(ORDER_STATUS_LABELS)) {
      expect(ORDER_STATUS_COLORS[key]).toBeDefined();
    }
  });

  it('PAYMENT_STATUS_COLORS covers pending/paid/overdue', () => {
    expect(PAYMENT_STATUS_COLORS.pending).toBeDefined();
    expect(PAYMENT_STATUS_COLORS.paid).toBeDefined();
    expect(PAYMENT_STATUS_COLORS.overdue).toBeDefined();
  });

  it('SOURCE_LABELS contains common channels', () => {
    expect(SOURCE_LABELS.phone).toBeDefined();
    expect(SOURCE_LABELS.telegram).toBeDefined();
    expect(SOURCE_LABELS.website).toBeDefined();
  });

  it('QUOT_STATUS_LABELS and QUOT_STATUS_COLORS keys align', () => {
    for (const key of Object.keys(QUOT_STATUS_LABELS)) {
      expect(QUOT_STATUS_COLORS[key]).toBeDefined();
    }
  });
});
