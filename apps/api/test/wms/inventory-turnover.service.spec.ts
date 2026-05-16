/**
 * test/wms/inventory-turnover.service.spec.ts
 *
 * Unit tests for InventoryTurnoverService — pure ratio + DIO calculator.
 * Note: @Calculation decorator wraps `calculate` in an async shell, so we await.
 * `calculateDio` is sync (no decorator) — kept sync in tests.
 */

import { InventoryTurnoverService } from '../../src/modules/wms/domain/services/inventory-turnover.service';

describe('InventoryTurnoverService', () => {
  const svc = new InventoryTurnoverService();

  describe('calculate()', () => {
    it('returns turnover = COGS / avgInventory', async () => {
      const r = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 200_000 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.turnover).toBe(5);
      }
    });

    it('DIO = 365 / turnover', async () => {
      const r = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 200_000 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.dio).toBeCloseTo(73, 0);
      }
    });

    it('rejects negative COGS', async () => {
      const r = await svc.calculate({ annualCogs: -100, avgInventoryValue: 100 });
      expect(r.ok).toBe(false);
    });

    it('rejects negative avgInventory', async () => {
      const r = await svc.calculate({ annualCogs: 100, avgInventoryValue: -50 });
      expect(r.ok).toBe(false);
    });

    it('returns "no data" when both COGS and inventory are zero', async () => {
      const r = await svc.calculate({ annualCogs: 0, avgInventoryValue: 0 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.turnover).toBe(0);
        expect(r.data.interpretation).toMatch(/yetarli/);
      }
    });

    it('rejects zero inventory with non-zero COGS (undefined turnover)', async () => {
      const r = await svc.calculate({ annualCogs: 100, avgInventoryValue: 0 });
      expect(r.ok).toBe(false);
    });
  });

  describe('interpretation labels', () => {
    it('high turnover (low DIO) → "tez aylanuvchi"', async () => {
      // COGS 1M, inv 50k → turnover 20, DIO ~18
      const r = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 50_000 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.interpretation).toMatch(/Tez/i);
      }
    });

    it('low turnover (high DIO > 180) → "sekin"', async () => {
      // COGS 100, inv 100 → turnover 1, DIO 365
      const r = await svc.calculate({ annualCogs: 100, avgInventoryValue: 100 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.interpretation).toMatch(/sekin/i);
      }
    });
  });

  describe('calculateDio()', () => {
    it('returns 365 / turnover', () => {
      const r = svc.calculateDio(10);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toBe(36.5);
      }
    });

    it('rejects negative turnover', () => {
      const r = svc.calculateDio(-1);
      expect(r.ok).toBe(false);
    });

    it('rejects zero turnover', () => {
      const r = svc.calculateDio(0);
      expect(r.ok).toBe(false);
    });
  });
});
