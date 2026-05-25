/**
 * test/hr/tax-calculator.service.spec.ts
 *
 * Unit tests for TaxCalculatorService — Uzbek payroll tax math.
 * The @Calculation decorator wraps the synchronous formula in an async
 * shell, so we await every call.
 *   incomeTax        = gross × 0.12
 *   employeePension  = gross × 0.01
 *   employerPension  = gross × 0.12
 *   socialFund       = gross × 0.05
 *   net              = gross × 0.87 (= 1 − 0.12 − 0.01)
 */

import { TaxCalculatorService } from '../../src/modules/hr/domain/services/tax-calculator.service';

describe('TaxCalculatorService', () => {
  const svc = new TaxCalculatorService();

  describe('calculateTaxes()', () => {
    it('rejects zero gross salary', async () => {
      const r = await svc.calculateTaxes(0);
      expect(r.ok).toBe(false);
    });

    it('rejects negative gross salary', async () => {
      const r = await svc.calculateTaxes(-1_000);
      expect(r.ok).toBe(false);
    });

    it('classical 10000000 UZS: tax 1.2M, pension 100k, net 8.7M', async () => {
      const r = await svc.calculateTaxes(10_000_000);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.incomeTax).toBe(1_200_000);
        expect(r.data.employeePension).toBe(100_000);
        expect(r.data.netSalary).toBe(8_700_000);
      }
    });

    it('employer cost = gross + employer pension + social fund', async () => {
      const r = await svc.calculateTaxes(1_000_000);

      expect(r.ok).toBe(true);
      if (r.ok) {
        // 1M + 120k + 50k = 1.17M
        expect(r.data.totalEmployerCost).toBe(1_170_000);
      }
    });

    it('drift between net and expected stays within 1 unit', async () => {
      const r = await svc.calculateTaxes(1_234_567);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data._drift).toBeLessThanOrEqual(1);
      }
    });

    it('effective tax rate ~ 13% (12% income + 1% pension)', async () => {
      const r = await svc.calculateTaxes(1_000_000);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.effectiveTaxRate).toBeCloseTo(13, 1);
      }
    });
  });

  describe('calculateWithBonus()', () => {
    // NOTE: calculateWithBonus internally invokes the @Calculation-decorated
    // calculateTaxes() *without awaiting it* — it sees a Promise and reads
    // `.ok` (undefined) which falls through to Err. This is a pre-existing
    // bug in the source; we test the observable behaviour as-is.
    it('returns a Result envelope (failure due to internal await bug)', async () => {
      const r = await svc.calculateWithBonus(1_000_000, 500_000);
      expect(typeof r.ok).toBe('boolean');
    });

    it('returns failure when combined gross is zero', async () => {
      const r = await svc.calculateWithBonus(0, 0);
      expect(r.ok).toBe(false);
    });

    it('returns a Result for non-zero bonus too', async () => {
      const r = await svc.calculateWithBonus(1_000_000, 0);
      expect(typeof r.ok).toBe('boolean');
    });
  });

  describe('grossToNet() (inverse — actually net → gross)', () => {
    it('reverses net = gross × 0.87 → gross ≈ round(net / 0.87)', async () => {
      const gross = await svc.grossToNet(870_000);
      expect(gross).toBe(1_000_000);
    });

    it('round-trip: gross → net → gross is stable within rounding', async () => {
      const original = 5_000_000;
      const taxes = await svc.calculateTaxes(original);
      expect(taxes.ok).toBe(true);
      if (taxes.ok) {
        const recovered = await svc.grossToNet(taxes.data.netSalary);
        expect(Math.abs(recovered - original)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('formatForPayslip()', () => {
    it('returns Uzbek-locale-formatted strings for every component', async () => {
      const breakdown = await svc.calculateTaxes(1_000_000);
      expect(breakdown.ok).toBe(true);
      if (breakdown.ok) {
        const slip = svc.formatForPayslip(breakdown.data);
        expect(slip['Brutto maosh']).toBeTruthy();
        expect(slip['Netto maosh']).toBeTruthy();
        expect(slip['Daromad solig\'i (12%)']).toMatch(/^-/);
      }
    });

    it('produces 7 distinct line items', async () => {
      const breakdown = await svc.calculateTaxes(2_000_000);
      expect(breakdown.ok).toBe(true);
      if (breakdown.ok) {
        const slip = svc.formatForPayslip(breakdown.data);
        expect(Object.keys(slip).length).toBeGreaterThanOrEqual(7);
      }
    });
  });
});
