/**
 * test/wms/safety-stock.service.spec.ts
 *
 * Unit tests for SafetyStockService — Z-score × demand variability.
 * Note: @Calculation decorator wraps `calculate`/`computeEwmStats` in an async
 * shell, so we await them. `getZScore` / `getAbcZScore` are sync.
 */

import { SafetyStockService } from '../../src/modules/wms/domain/services/safety-stock.service';

describe('SafetyStockService', () => {
  const svc = new SafetyStockService();

  describe('calculate()', () => {
    it('rejects series shorter than 7 days', async () => {
      const r = await svc.calculate({
        dailyDemandSeries: [1, 2, 3],
        leadTimeDays: 7,
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects non-positive leadTime', async () => {
      const r = await svc.calculate({
        dailyDemandSeries: [10, 10, 10, 10, 10, 10, 10],
        leadTimeDays: 0,
      });

      expect(r.ok).toBe(false);
    });

    it('zero variance series → SS = 0 (no buffer needed)', async () => {
      const r = await svc.calculate({
        dailyDemandSeries: [10, 10, 10, 10, 10, 10, 10],
        leadTimeDays: 5,
        serviceLevel: 0.95,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.safetyStock).toBe(0);
        expect(r.data.zScore).toBeCloseTo(1.645, 3);
      }
    });

    it('higher service level → higher Z → higher SS', async () => {
      const series = [10, 12, 14, 8, 11, 9, 13];
      const low  = await svc.calculate({ dailyDemandSeries: series, leadTimeDays: 5, serviceLevel: 0.90 });
      const high = await svc.calculate({ dailyDemandSeries: series, leadTimeDays: 5, serviceLevel: 0.99 });

      expect(low.ok).toBe(true);
      expect(high.ok).toBe(true);
      if (low.ok && high.ok) {
        expect(high.data.zScore).toBeGreaterThan(low.data.zScore);
        expect(high.data.safetyStock).toBeGreaterThanOrEqual(low.data.safetyStock);
      }
    });

    it('uses ABC class Z table when abcClass is set', async () => {
      const r = await svc.calculate({
        dailyDemandSeries: [10, 12, 14, 8, 11, 9, 13],
        leadTimeDays: 5,
        abcClass: 'A',
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.zScore).toBe(2.326);
      }
    });

    it('useEwm flag populates ewm fields', async () => {
      const r = await svc.calculate({
        dailyDemandSeries: [10, 12, 14, 8, 11, 9, 13],
        leadTimeDays: 5,
        useEwm: true,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(typeof r.data.ewmMean).toBe('number');
        expect(typeof r.data.ewmStdDev).toBe('number');
      }
    });
  });

  describe('getZScore() / getAbcZScore()', () => {
    it('returns 1.645 for 0.95 service level', () => {
      expect(svc.getZScore(0.95)).toBe(1.645);
    });

    it('falls back to 1.645 for unknown level', () => {
      expect(svc.getZScore(0.42)).toBe(1.645);
    });

    it('class A → 2.326', () => {
      expect(svc.getAbcZScore('A')).toBe(2.326);
    });

    it('class C → 1.282', () => {
      expect(svc.getAbcZScore('C')).toBe(1.282);
    });
  });

  describe('computeEwmStats()', () => {
    it('mean of constant series equals the constant', async () => {
      const stats = await svc.computeEwmStats([5, 5, 5, 5, 5]);
      expect(stats.ewmMean).toBeCloseTo(5, 4);
    });

    it('stddev of constant series is 0', async () => {
      const stats = await svc.computeEwmStats([5, 5, 5, 5, 5]);
      expect(stats.ewmStdDev).toBeCloseTo(0, 4);
    });
  });
});
