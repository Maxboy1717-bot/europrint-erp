import { describe, it, expect } from 'vitest';
import {
  calcGsdCompletionPct,
  calcGsdVariance,
  calcCompanyState,
  computeZvsLevel,
  canApproveZvs,
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

// ─── ZVS approval matrix ──────────────────────────────────────────────────────

describe('ZVS approval matrix', () => {
  describe('computeZvsLevel', () => {
    it('1 so\'m → level 1', () => {
      expect(computeZvsLevel(1)).toBe(1);
    });

    it('500_000 → level 1 (chegara)', () => {
      expect(computeZvsLevel(500_000)).toBe(1);
    });

    it('500_001 → level 2', () => {
      expect(computeZvsLevel(500_001)).toBe(2);
    });

    it('5_000_000 → level 2 (chegara)', () => {
      expect(computeZvsLevel(5_000_000)).toBe(2);
    });

    it('5_000_001 → level 3', () => {
      expect(computeZvsLevel(5_000_001)).toBe(3);
    });

    it('100_000_000 → level 3', () => {
      expect(computeZvsLevel(100_000_000)).toBe(3);
    });
  });

  describe('canApproveZvs', () => {
    it('manager level-1 ni tasdiqlashi mumkin', () => {
      expect(canApproveZvs('manager', 1)).toBe(true);
    });

    it('manager level-2 ni tasdiqlash mumkin emas', () => {
      expect(canApproveZvs('manager', 2)).toBe(false);
    });

    it('finance_manager level-2 ni tasdiqlashi mumkin', () => {
      expect(canApproveZvs('finance_manager', 2)).toBe(true);
    });

    it('finance_manager level-3 ni tasdiqlash mumkin emas', () => {
      expect(canApproveZvs('finance_manager', 3)).toBe(false);
    });

    it('director level-3 ni tasdiqlashi mumkin', () => {
      expect(canApproveZvs('director', 3)).toBe(true);
    });

    it('employee (noma\'lum rol) level-1 ni ham tasdiqlash mumkin emas', () => {
      expect(canApproveZvs('employee', 1)).toBe(false);
    });

    it('admin barcha level ni tasdiqlashi mumkin', () => {
      expect(canApproveZvs('admin', 1)).toBe(true);
      expect(canApproveZvs('admin', 2)).toBe(true);
      expect(canApproveZvs('admin', 3)).toBe(true);
    });
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
