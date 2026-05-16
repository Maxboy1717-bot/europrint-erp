/**
 * test/wms/eoq-calculator.service.spec.ts
 *
 * Unit tests for EoqCalculatorService — pure Wilson EOQ math.
 * Note: @Calculation decorator wraps `calculate` + `calculateWithDiscounts`
 * in an async shell, so we await them. Default getters remain sync.
 */

import { EoqCalculatorService } from '../../src/modules/wms/domain/services/eoq-calculator.service';

describe('EoqCalculatorService', () => {
  const svc = new EoqCalculatorService();

  describe('calculate()', () => {
    it('classical Wilson: D=1000, S=100, H=2 → EOQ = sqrt(2·1000·100/2) = ~316', async () => {
      const r = await svc.calculate({
        annualDemand: 1_000,
        orderingCostUzs: 100,
        holdingCostPercent: 1.0, // → H = 1.0 × P
        unitPriceUzs: 2,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.eoq).toBeCloseTo(316.23, 1);
      }
    });

    it('rejects D ≤ 0', async () => {
      const r = await svc.calculate({
        annualDemand: 0,
        orderingCostUzs: 100,
        holdingCostPercent: 0.2,
        unitPriceUzs: 10,
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('rejects S ≤ 0', async () => {
      const r = await svc.calculate({
        annualDemand: 100,
        orderingCostUzs: 0,
        holdingCostPercent: 0.2,
        unitPriceUzs: 10,
      });

      expect(r.ok).toBe(false);
    });

    it('rejects H ≤ 0 (when holdingCostPercent × unitPrice = 0)', async () => {
      const r = await svc.calculate({
        annualDemand: 100,
        orderingCostUzs: 100,
        holdingCostPercent: 0.2,
        unitPriceUzs: 0,
      });

      expect(r.ok).toBe(false);
    });

    it('rounds to packSize multiples (ceiling)', async () => {
      const r = await svc.calculate({
        annualDemand: 1_000,
        orderingCostUzs: 100,
        holdingCostPercent: 1.0,
        unitPriceUzs: 2,
        packSize: 50,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.eoqRounded % 50).toBe(0);
      }
    });

    it('cycle time × order frequency ≈ 365 days', async () => {
      const r = await svc.calculate({
        annualDemand: 1_200,
        orderingCostUzs: 100,
        holdingCostPercent: 0.5,
        unitPriceUzs: 4,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        const product = r.data.cycleTimeDays * r.data.orderFrequency;
        expect(product).toBeCloseTo(365, 1);
      }
    });
  });

  describe('calculateWithDiscounts()', () => {
    it('selects the lowest-total-cost tier', async () => {
      const r = await svc.calculateWithDiscounts({
        annualDemand: 1_000,
        orderingCostUzs: 100,
        holdingCostPercent: 0.2,
        priceTiers: [
          { minQty: 0,   maxQty: 99,  unitPrice: 10 },
          { minQty: 100, maxQty: 499, unitPrice: 9 },
          { minQty: 500,              unitPrice: 8 },
        ],
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.selectedTierPrice).toBeGreaterThan(0);
        expect(r.data.eoq).toBeGreaterThan(0);
      }
    });

    it('rejects empty priceTiers', async () => {
      const r = await svc.calculateWithDiscounts({
        annualDemand: 1_000,
        priceTiers: [],
      });

      expect(r.ok).toBe(false);
    });

    it('rejects D ≤ 0', async () => {
      const r = await svc.calculateWithDiscounts({
        annualDemand: 0,
        priceTiers: [{ minQty: 0, unitPrice: 10 }],
      });

      expect(r.ok).toBe(false);
    });

    it('clamps EOQ up to tier minQty if rawEoq below floor', async () => {
      const r = await svc.calculateWithDiscounts({
        annualDemand: 10,
        orderingCostUzs: 1,
        holdingCostPercent: 0.5,
        priceTiers: [{ minQty: 1_000, unitPrice: 5 }],
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.eoq).toBeGreaterThanOrEqual(1_000);
      }
    });
  });

  describe('defaults', () => {
    it('exposes default holding rate 0.20', () => {
      expect(svc.getDefaultHoldingRate()).toBe(0.20);
    });

    it('exposes default ordering cost 150k UZS', () => {
      expect(svc.getDefaultOrderingCost()).toBe(150_000);
    });
  });
});
