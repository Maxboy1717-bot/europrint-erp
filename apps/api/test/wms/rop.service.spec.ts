/**
 * test/wms/rop.service.spec.ts
 *
 * Unit tests for RopService — reorder-point calculator:
 *   ROP = ceil(avgDailyDemand × leadTimeDays + safetyStock)
 *
 * Note: @Calculation decorator wraps `calculate` in an async shell, so we await.
 */

import { RopService } from '../../src/modules/wms/domain/services/rop.service';

describe('RopService', () => {
  const svc = new RopService();

  describe('calculate()', () => {
    it('classical case: 10/day × 7 days + 20 SS = 90', async () => {
      const r = await svc.calculate({
        avgDailyDemand: 10,
        leadTimeDays: 7,
        safetyStock: 20,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rop).toBe(90);
        expect(r.data.demandDuringLeadTime).toBe(70);
        expect(r.data.safetyStock).toBe(20);
      }
    });

    it('rejects negative avgDailyDemand', async () => {
      const r = await svc.calculate({
        avgDailyDemand: -1,
        leadTimeDays: 5,
        safetyStock: 10,
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects zero or negative leadTimeDays', async () => {
      const r = await svc.calculate({
        avgDailyDemand: 5,
        leadTimeDays: 0,
        safetyStock: 10,
      });

      expect(r.ok).toBe(false);
    });

    it('rejects negative safetyStock', async () => {
      const r = await svc.calculate({
        avgDailyDemand: 5,
        leadTimeDays: 7,
        safetyStock: -10,
      });

      expect(r.ok).toBe(false);
    });

    it('fractional demand is ceiling-rounded into the ROP', async () => {
      // 1.5 × 4 = 6.0 + 0 SS = 6
      const r = await svc.calculate({
        avgDailyDemand: 1.5,
        leadTimeDays: 4,
        safetyStock: 0,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rop).toBe(6);
      }
    });

    it('non-integer total is ceiling-rounded', async () => {
      // 1.3 × 5 = 6.5 + 2 SS = 8.5 → ceil 9
      const r = await svc.calculate({
        avgDailyDemand: 1.3,
        leadTimeDays: 5,
        safetyStock: 2,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rop).toBe(9);
      }
    });

    it('zero demand yields ROP = ceiling(SS)', async () => {
      const r = await svc.calculate({
        avgDailyDemand: 0,
        leadTimeDays: 5,
        safetyStock: 12,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rop).toBe(12);
      }
    });
  });
});
