/**
 * test/finance/depreciation.service.spec.ts
 *
 * Unit tests for DepreciationService — pure-math depreciation calculator.
 * No DB / no repo: every method takes plain numbers and returns plain numbers.
 */

import {
  DepreciationService,
  type DepreciationParams,
} from '../../src/modules/finance/domain/services/depreciation.service';

describe('DepreciationService', () => {
  const svc = new DepreciationService();

  describe('validateParams()', () => {
    it('accepts valid SL params', () => {
      const r = svc.validateParams({
        cost: 10_000, salvage: 1_000, usefulLifeYears: 5, method: 'SL',
      });
      expect(r.ok).toBe(true);
    });

    it('rejects 0 useful life', () => {
      const r = svc.validateParams({
        cost: 10_000, salvage: 0, usefulLifeYears: 0, method: 'SL',
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects cost < salvage', () => {
      const r = svc.validateParams({
        cost: 500, salvage: 1_000, usefulLifeYears: 3, method: 'SL',
      });
      expect(r.ok).toBe(false);
    });

    it('rejects negative cost', () => {
      const r = svc.validateParams({
        cost: -100, salvage: 0, usefulLifeYears: 5, method: 'SL',
      });
      expect(r.ok).toBe(false);
    });
  });

  describe('straightLine()', () => {
    it('classic example: (12000 − 0) / 5 yrs / 12 = 200/month', () => {
      expect(svc.straightLine(12_000, 0, 5)).toBe(200);
    });

    it('respects salvage in numerator', () => {
      expect(svc.straightLine(12_000, 2_000, 5)).toBeCloseTo(166.667, 3);
    });

    it('returns 0 when life is 0', () => {
      expect(svc.straightLine(10_000, 0, 0)).toBe(0);
    });

    it('returns 0 when life is negative', () => {
      expect(svc.straightLine(10_000, 0, -2)).toBe(0);
    });
  });

  describe('doubleDeclining()', () => {
    it('200% × (1/life) / 12 = monthly factor', () => {
      // bookValue 10000, life 5 → 10000 * (2/5)/12 = 333.333
      expect(svc.doubleDeclining(10_000, 5)).toBeCloseTo(333.333, 3);
    });

    it('returns 0 when life is 0', () => {
      expect(svc.doubleDeclining(10_000, 0)).toBe(0);
    });

    it('scales linearly with book value', () => {
      const a = svc.doubleDeclining(1_000, 5);
      const b = svc.doubleDeclining(2_000, 5);
      expect(b).toBeCloseTo(2 * a, 4);
    });
  });

  describe('sumOfYearsDigits()', () => {
    it('year 1 month 1: fraction = n/SYD; 5yr → 5/15 of (cost-salv)/12', () => {
      // (10000-0)*5/15/12 = 277.778
      expect(svc.sumOfYearsDigits(10_000, 0, 5, 1)).toBeCloseTo(277.778, 3);
    });

    it('year 2 (month 13): fraction = 4/15', () => {
      expect(svc.sumOfYearsDigits(10_000, 0, 5, 13)).toBeCloseTo(222.222, 3);
    });

    it('past useful life → 0', () => {
      // 5yr life, month 73 = year 7 → remaining = 5-7+1 = -1 ≤ 0 → 0
      expect(svc.sumOfYearsDigits(10_000, 0, 5, 73)).toBe(0);
    });

    it('returns 0 for non-positive life', () => {
      expect(svc.sumOfYearsDigits(10_000, 0, 0, 1)).toBe(0);
    });
  });

  describe('unitsOfProduction()', () => {
    it('proportional to usage fraction', () => {
      // (10000-0) * (250/1000) = 2500
      expect(svc.unitsOfProduction(10_000, 0, 250, 1_000)).toBe(2_500);
    });

    it('returns 0 when totalUnits is 0', () => {
      expect(svc.unitsOfProduction(10_000, 0, 100, 0)).toBe(0);
    });

    it('respects salvage value', () => {
      expect(svc.unitsOfProduction(10_000, 2_000, 500, 1_000)).toBe(4_000);
    });
  });

  describe('buildSchedule()', () => {
    it('SL schedule sums to (cost − salvage) within tolerance', () => {
      const params: DepreciationParams = {
        cost: 12_000, salvage: 0, usefulLifeYears: 1, method: 'SL',
      };
      const lines = svc.buildSchedule(params);
      expect(lines).toHaveLength(12);
      const total = lines.reduce((s, l) => s + l.depreciation, 0);
      expect(total).toBeCloseTo(12_000, 1);
    });

    it('DB schedule never depreciates below salvage', () => {
      const params: DepreciationParams = {
        cost: 10_000, salvage: 2_000, usefulLifeYears: 3, method: 'DB',
      };
      const lines = svc.buildSchedule(params);
      for (const l of lines) {
        expect(l.bookValue).toBeGreaterThanOrEqual(2_000 - 0.001);
      }
    });

    it('SYD first-month depreciation > last-month depreciation', () => {
      const params: DepreciationParams = {
        cost: 10_000, salvage: 0, usefulLifeYears: 3, method: 'SYD',
      };
      const lines = svc.buildSchedule(params);
      expect(lines[0].depreciation).toBeGreaterThan(lines[lines.length - 1].depreciation);
    });

    it('UOP schedule produces a non-empty array', () => {
      const params: DepreciationParams = {
        cost: 10_000, salvage: 1_000, usefulLifeYears: 2, method: 'UOP',
        unitsProduced: 12_000, totalUnits: 24_000,
      };
      const lines = svc.buildSchedule(params);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0].depreciation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('annualDepreciation()', () => {
    it('SL annual = monthly × 12', () => {
      const params: DepreciationParams = {
        cost: 12_000, salvage: 0, usefulLifeYears: 5, method: 'SL',
      };
      // monthly = 200 → year1 = 2400
      expect(svc.annualDepreciation(params)).toBeCloseTo(2_400, 1);
    });

    it('SYD year 1 > SL year 1 (front-loaded)', () => {
      const sl = svc.annualDepreciation({ cost: 12_000, salvage: 0, usefulLifeYears: 5, method: 'SL' });
      const syd = svc.annualDepreciation({ cost: 12_000, salvage: 0, usefulLifeYears: 5, method: 'SYD' });
      expect(syd).toBeGreaterThan(sl);
    });
  });
});
