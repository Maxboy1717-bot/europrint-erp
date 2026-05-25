/**
 * test/finance/investment.service.spec.ts
 *
 * Unit tests for InvestmentService — pure financial-math:
 * NPV, IRR, discounted payback, liquidity ratios, 13-week cashflow.
 */

import { InvestmentService } from '../../src/modules/finance/domain/services/investment.service';

describe('InvestmentService', () => {
  const svc = new InvestmentService();

  describe('validateCashFlows()', () => {
    it('accepts valid finite cashflows', () => {
      const r = svc.validateCashFlows([-1000, 500, 600]);
      expect(r.ok).toBe(true);
    });

    it('rejects empty array', () => {
      const r = svc.validateCashFlows([]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects NaN entries', () => {
      const r = svc.validateCashFlows([-1000, NaN, 500]);
      expect(r.ok).toBe(false);
    });

    it('rejects Infinity entries', () => {
      const r = svc.validateCashFlows([-1000, Infinity, 500]);
      expect(r.ok).toBe(false);
    });
  });

  describe('npv()', () => {
    it('returns 0 NPV for cashflows discounted exactly at rate where they break even', () => {
      // -100 + 110/(1.1) = 0
      const r = svc.npv(0.1, [-100, 110]);
      expect(r.npv).toBeCloseTo(0, 6);
      expect(r.discountRate).toBe(0.1);
    });

    it('0% discount → simple sum', () => {
      const r = svc.npv(0, [-100, 50, 60, 30]);
      expect(r.npv).toBe(40);
    });

    it('empty cashflows → 0', () => {
      const r = svc.npv(0.05, []);
      expect(r.npv).toBe(0);
    });

    it('higher rate → lower NPV (for typical positive-tail project)', () => {
      const low = svc.npv(0.05, [-100, 40, 40, 40]);
      const high = svc.npv(0.20, [-100, 40, 40, 40]);
      expect(low.npv).toBeGreaterThan(high.npv);
    });
  });

  describe('irr()', () => {
    it('finds IRR ~ 10% for -100 → 110 at t=1', () => {
      const r = svc.irr([-100, 110]);
      expect(r.converged).toBe(true);
      expect(r.irr).toBeCloseTo(0.1, 4);
    });

    it('reports non-convergence when no sign change in NPV bracket', () => {
      // All-positive cashflows: NPV is always positive → no IRR
      const r = svc.irr([100, 200, 300]);
      expect(r.converged).toBe(false);
    });

    it('finds IRR for a 3-year project', () => {
      // -1000 + 600/(1+r) + 600/(1+r)^2 = 0 → IRR ~ 13.07%
      const r = svc.irr([-1000, 600, 600]);
      expect(r.converged).toBe(true);
      expect(r.irr).toBeGreaterThan(0.10);
      expect(r.irr).toBeLessThan(0.15);
    });

    it('handles empty input without throwing', () => {
      const r = svc.irr([] as number[]);
      // Empty cashflows → 0 × 0 = 0, falls through to bisection which
      // converges trivially. Documenting the actual behaviour here.
      expect(typeof r.irr).toBe('number');
      expect(typeof r.converged).toBe('boolean');
    });
  });

  describe('discountedPayback()', () => {
    it('returns Infinity when project never breaks even at given rate', () => {
      const r = svc.discountedPayback(0.5, [-1000, 100, 100]);
      expect(r.paybackPeriod).toBe(Infinity);
    });

    it('returns finite payback when cashflows turn cumulative positive', () => {
      const r = svc.discountedPayback(0, [-100, 60, 60]);
      // cumulative: -100, -40, +20 → crosses between idx 1→2; fractional
      expect(r.paybackPeriod).toBeGreaterThan(1);
      expect(r.paybackPeriod).toBeLessThanOrEqual(2);
    });

    it('builds cumulative array matching cashflow length', () => {
      const r = svc.discountedPayback(0.1, [-100, 50, 50, 50]);
      expect(r.discountedCumulativeFlows).toHaveLength(4);
    });
  });

  describe('liquidityRatios()', () => {
    it('current ratio = CA / CL', () => {
      const r = svc.liquidityRatios(200, 100, 50, 25);
      expect(r.currentRatio).toBe(2);
    });

    it('quick ratio excludes inventory', () => {
      const r = svc.liquidityRatios(200, 100, 50, 25);
      // (200 - 50) / 100 = 1.5
      expect(r.quickRatio).toBe(1.5);
    });

    it('returns Infinity when liabilities are 0', () => {
      const r = svc.liquidityRatios(200, 0, 50, 25);
      expect(r.currentRatio).toBe(Infinity);
    });

    it('working capital = CA − CL', () => {
      const r = svc.liquidityRatios(200, 80, 50, 25);
      expect(r.workingCapital).toBe(120);
    });
  });

  describe('cashflow13Week()', () => {
    it('always produces 13 weeks', () => {
      const r = svc.cashflow13Week(1_000, [], [], new Date('2025-01-01'));
      expect(r).toHaveLength(13);
    });

    it('cumulative cash accumulates correctly with zero flows', () => {
      const r = svc.cashflow13Week(1_000, [], [], new Date('2025-01-01'));
      expect(r[0].cumulativeCash).toBe(1_000);
      expect(r[12].cumulativeCash).toBe(1_000);
    });

    it('applies inflows/outflows week-by-week', () => {
      const r = svc.cashflow13Week(0, [100, 200], [50, 50], new Date('2025-01-01'));
      expect(r[0].netCashFlow).toBe(50);
      expect(r[1].cumulativeCash).toBe(50 + 150);
    });
  });
});
