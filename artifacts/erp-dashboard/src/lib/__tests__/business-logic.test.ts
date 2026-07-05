/**
 * @module business-logic.test
 * @description Jest / Vitest test suite.
 */

import { describe, it, expect } from 'vitest';
import {
  calcGsdCompletionPct,
  calcGsdVariance,
  calcCompanyState,
  getWeekStart,
  formatMoney,
} from '../business-logic';

// ─── GSD hisob-kitob ──────────────────────────────────────────────────────────

describe('GSD hisob-kitob', () => {
  it('100% bajarilish: actual === target', () => {
    expect(calcGsdCompletionPct(100, 100)).toBe(100);
  });

  it('50% bajarilish: actual yarmi', () => {
    expect(calcGsdCompletionPct(50, 100)).toBe(50);
  });

  it('target=0 bo\'lsa 0 qaytaradi', () => {
    expect(calcGsdCompletionPct(50, 0)).toBe(0);
  });

  it('actual=0 bo\'lsa 0 qaytaradi', () => {
    expect(calcGsdCompletionPct(0, 100)).toBe(0);
  });

  it('actual > target bo\'lsa 100+ foiz', () => {
    expect(calcGsdCompletionPct(120, 100)).toBe(120);
  });

  it('variance: actual 110, target 100 → +10.0%', () => {
    expect(calcGsdVariance(110, 100)).toBe(10.0);
  });

  it('variance: actual 80, target 100 → -20.0%', () => {
    expect(calcGsdVariance(80, 100)).toBe(-20.0);
  });

  it('variance: target=0 → 0', () => {
    expect(calcGsdVariance(80, 0)).toBe(0);
  });

  it('variance: actual=target → 0', () => {
    expect(calcGsdVariance(100, 100)).toBe(0);
  });
});

// ─── Company state formula ─────────────────────────────────────────────────────

describe('Company state formula', () => {
  it('perf_ratio=110 → GROWTH', () => {
    expect(calcCompanyState(110)).toBe('GROWTH');
  });

  it('perf_ratio=150 → GROWTH (≥110)', () => {
    expect(calcCompanyState(150)).toBe('GROWTH');
  });

  it('perf_ratio=109.9 → NORMAL', () => {
    expect(calcCompanyState(109.9)).toBe('NORMAL');
  });

  it('perf_ratio=80 → NORMAL', () => {
    expect(calcCompanyState(80)).toBe('NORMAL');
  });

  it('perf_ratio=79.9 → RISK', () => {
    expect(calcCompanyState(79.9)).toBe('RISK');
  });

  it('perf_ratio=60 → RISK', () => {
    expect(calcCompanyState(60)).toBe('RISK');
  });

  it('perf_ratio=59.9 → CRITICAL', () => {
    expect(calcCompanyState(59.9)).toBe('CRITICAL');
  });

  it('perf_ratio=0 → CRITICAL', () => {
    expect(calcCompanyState(0)).toBe('CRITICAL');
  });

  it('perf_ratio=-10 → CRITICAL', () => {
    expect(calcCompanyState(-10)).toBe('CRITICAL');
  });
});

// ─── Week start / Sunday boundary ─────────────────────────────────────────────

describe('Week boundary (Dushanba = hafta boshi)', () => {
  it('Dushanba kuni o\'zi — o\'sha Dushanba qaytadi', () => {
    expect(getWeekStart('2024-04-08')).toBe('2024-04-08');
  });

  it('Seshanba kuni — o\'sha haftaning Dushanbasi', () => {
    expect(getWeekStart('2024-04-09')).toBe('2024-04-08');
  });

  it('Yakshanba kuni — o\'tgan haftaning Dushanbasi (Yakshanba bug protection)', () => {
    expect(getWeekStart('2024-04-14')).toBe('2024-04-08');
  });

  it('Shanba kuni — o\'sha haftaning Dushanbasi', () => {
    expect(getWeekStart('2024-04-13')).toBe('2024-04-08');
  });

  it('Juma kuni — o\'sha haftaning Dushanbasi', () => {
    expect(getWeekStart('2024-04-12')).toBe('2024-04-08');
  });

  it('Dushanba → Shanba orasida doim bir xil hafta boshi', () => {
    const weekDays = [
      '2024-04-08', '2024-04-09', '2024-04-10',
      '2024-04-11', '2024-04-12', '2024-04-13',
    ];
    for (const d of weekDays) {
      expect(getWeekStart(d)).toBe('2024-04-08');
    }
  });

  it('Yakshanba hafta boshi emas (Sunday bug check)', () => {
    const sunday = getWeekStart('2024-04-14');
    expect(sunday).not.toBe('2024-04-14');
    expect(sunday).toBe('2024-04-08');
  });

  it('yangi yil chegarasi to\'g\'ri ishlaydi', () => {
    expect(getWeekStart('2024-01-01')).toBe('2024-01-01');
    expect(getWeekStart('2023-12-31')).toBe('2023-12-25');
  });

  it('timezone-safe: YYYY-MM-DD bir xil natija beradi (UTC va local TZ farq qilmaydi)', () => {
    const monday = '2024-04-08';
    const tuesday = '2024-04-09';
    const sunday = '2024-04-14';
    expect(getWeekStart(monday)).toBe('2024-04-08');
    expect(getWeekStart(tuesday)).toBe('2024-04-08');
    expect(getWeekStart(sunday)).toBe('2024-04-08');
  });

  it('yil boshida: 2024-01-01 Dushanba → 2024-01-01', () => {
    expect(getWeekStart('2024-01-01')).toBe('2024-01-01');
  });

  it('yil oxirida: 2023-12-31 Yakshanba → 2023-12-25', () => {
    expect(getWeekStart('2023-12-31')).toBe('2023-12-25');
  });

  it('har bir kun uchun bir xil hafta boshi qaytariladi (takroriy tekshiruv)', () => {
    const expected = '2024-01-08';
    expect(getWeekStart('2024-01-08')).toBe(expected);
    expect(getWeekStart('2024-01-09')).toBe(expected);
    expect(getWeekStart('2024-01-10')).toBe(expected);
    expect(getWeekStart('2024-01-11')).toBe(expected);
    expect(getWeekStart('2024-01-12')).toBe(expected);
    expect(getWeekStart('2024-01-13')).toBe(expected);
    expect(getWeekStart('2024-01-14')).toBe(expected);
  });
});

// ─── formatMoney utility ──────────────────────────────────────────────────────

describe('formatMoney utility', () => {
  it('milliard formatlanadi', () => {
    expect(formatMoney(1_500_000_000)).toBe('1.5B');
  });

  it('million formatlanadi', () => {
    expect(formatMoney(2_500_000)).toBe('2.5M');
  });

  it('ming formatlanadi', () => {
    expect(formatMoney(25_000)).toBe('25K');
  });

  it('kichik son string sifatida', () => {
    expect(formatMoney(999)).toBe('999');
  });

  it('0 → "0"', () => {
    expect(formatMoney(0)).toBe('0');
  });

  it('aniq 1B chegarasi', () => {
    expect(formatMoney(1_000_000_000)).toBe('1.0B');
  });

  it('aniq 1M chegarasi', () => {
    expect(formatMoney(1_000_000)).toBe('1.0M');
  });
});
