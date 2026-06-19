/**
 * @file test/finance/payroll-tax.service.spec.ts
 * @description Unit tests for PayrollTaxService.compute().
 *
 * WHAT IS TESTED
 *   1. Known gross → known incomeTax + socialContribution + net (Q-40 real math)
 *   2. Zero gross → all deductions = 0, net = 0
 *   3. Rate override → deductions change, net changes correctly
 *   4. Negative gross → Err(VALIDATION)
 *   5. NaN gross → Err(VALIDATION)
 *   6. Infinity gross → Err(VALIDATION)
 *   7. Out-of-range incomeTaxRate (>1) → Err(VALIDATION)
 *   8. Negative socialRate → Err(VALIDATION)
 *   9. Both rates at zero → net = gross (edge case: tax-free scenario)
 *  10. appliedRates reflects defaults when no opts provided
 *  11. appliedRates reflects overrides when opts provided
 *  12. Rounding: fractional tiyin values round correctly
 *
 * No mocks needed — PayrollTaxService is pure (no DI dependencies).
 * Tests use plain instantiation: `new PayrollTaxService()`.
 */

import { PayrollTaxService, PayrollTaxOpts, PayrollTaxBreakdown } from '../../src/modules/finance/domain/services/payroll-tax.service';
import {
  PAYROLL_TAX_INCOME_RATE,
  PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE,
} from '../../src/modules/finance/domain/constants/payroll-tax.constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to 2dp for assertion equality (mirrors the service rounding). */
const r2 = (n: number): number => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PayrollTaxService', () => {
  let service: PayrollTaxService;

  beforeEach(() => {
    service = new PayrollTaxService();
  });

  // ── 1. Known gross — default rates ─────────────────────────────────────
  describe('compute() with known gross and default rates', () => {
    it('1_000_000 UZS gross → correct incomeTax, socialContribution, net', () => {
      const gross = 1_000_000;
      const result = service.compute(gross);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d: PayrollTaxBreakdown = result.data;

      // incomeTax = 1_000_000 × 0.12 = 120_000
      expect(d.incomeTax).toBe(r2(gross * PAYROLL_TAX_INCOME_RATE));
      expect(d.incomeTax).toBe(120_000);

      // socialContribution = 1_000_000 × 0.01 = 10_000
      expect(d.socialContribution).toBe(r2(gross * PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE));
      expect(d.socialContribution).toBe(10_000);

      // net = 1_000_000 − 120_000 − 10_000 = 870_000
      expect(d.net).toBe(870_000);

      // gross passthrough
      expect(d.gross).toBe(gross);
    });

    it('2_500_000 UZS gross → correct values', () => {
      const gross = 2_500_000;
      const result = service.compute(gross);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(300_000);          // 2_500_000 × 0.12
      expect(d.socialContribution).toBe(25_000);  // 2_500_000 × 0.01
      expect(d.net).toBe(2_175_000);              // 2_500_000 − 300_000 − 25_000
    });

    it('500_000 UZS gross → correct values (lower salary)', () => {
      const gross = 500_000;
      const result = service.compute(gross);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(60_000);           // 500_000 × 0.12
      expect(d.socialContribution).toBe(5_000);   // 500_000 × 0.01
      expect(d.net).toBe(435_000);                // 500_000 − 60_000 − 5_000
    });
  });

  // ── 2. Zero gross ──────────────────────────────────────────────────────
  describe('compute() with zero gross', () => {
    it('gross = 0 → incomeTax = 0, socialContribution = 0, net = 0', () => {
      const result = service.compute(0);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.gross).toBe(0);
      expect(d.incomeTax).toBe(0);
      expect(d.socialContribution).toBe(0);
      expect(d.net).toBe(0);
    });
  });

  // ── 3. Rate override ───────────────────────────────────────────────────
  describe('compute() with rate overrides', () => {
    it('incomeTaxRate override (0.15) → higher incomeTax, lower net', () => {
      const gross = 1_000_000;
      const opts: PayrollTaxOpts = { incomeTaxRate: 0.15 };
      const result = service.compute(gross, opts);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(150_000);           // 1_000_000 × 0.15
      expect(d.socialContribution).toBe(10_000);   // still default 0.01
      expect(d.net).toBe(840_000);                 // 1_000_000 − 150_000 − 10_000
      expect(d.appliedRates.incomeTaxRate).toBe(0.15);
      expect(d.appliedRates.socialRate).toBe(PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE);
    });

    it('socialRate override (0.02) → higher socialContribution, lower net', () => {
      const gross = 1_000_000;
      const opts: PayrollTaxOpts = { socialRate: 0.02 };
      const result = service.compute(gross, opts);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(120_000);           // default 0.12
      expect(d.socialContribution).toBe(20_000);   // 1_000_000 × 0.02
      expect(d.net).toBe(860_000);                 // 1_000_000 − 120_000 − 20_000
      expect(d.appliedRates.socialRate).toBe(0.02);
    });

    it('both rate overrides (0.10, 0.00) → only incomeTax deducted', () => {
      const gross = 1_000_000;
      const opts: PayrollTaxOpts = { incomeTaxRate: 0.10, socialRate: 0.00 };
      const result = service.compute(gross, opts);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(100_000);
      expect(d.socialContribution).toBe(0);
      expect(d.net).toBe(900_000);
    });

    it('both rates at 0 → net = gross (tax-free edge case)', () => {
      const gross = 3_000_000;
      const opts: PayrollTaxOpts = { incomeTaxRate: 0, socialRate: 0 };
      const result = service.compute(gross, opts);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      expect(d.incomeTax).toBe(0);
      expect(d.socialContribution).toBe(0);
      expect(d.net).toBe(gross);
    });
  });

  // ── 4. Guard: negative gross ──────────────────────────────────────────
  describe('compute() guard — invalid gross', () => {
    it('negative gross → Err(VALIDATION)', () => {
      const result = service.compute(-1);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/non-negative/i);
    });

    it('NaN gross → Err(VALIDATION)', () => {
      const result = service.compute(NaN);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('Infinity gross → Err(VALIDATION)', () => {
      const result = service.compute(Infinity);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('-Infinity gross → Err(VALIDATION)', () => {
      const result = service.compute(-Infinity);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });
  });

  // ── 5. Guard: out-of-range rate overrides ─────────────────────────────
  describe('compute() guard — invalid rate overrides', () => {
    it('incomeTaxRate > 1 → Err(VALIDATION)', () => {
      const result = service.compute(1_000_000, { incomeTaxRate: 1.5 });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/incomeTaxRate/i);
    });

    it('incomeTaxRate < 0 → Err(VALIDATION)', () => {
      const result = service.compute(1_000_000, { incomeTaxRate: -0.1 });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('socialRate < 0 → Err(VALIDATION)', () => {
      const result = service.compute(1_000_000, { socialRate: -0.01 });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/socialRate/i);
    });

    it('NaN socialRate → Err(VALIDATION)', () => {
      const result = service.compute(1_000_000, { socialRate: NaN });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });
  });

  // ── 6. appliedRates reflects defaults ────────────────────────────────
  describe('appliedRates', () => {
    it('returns module defaults when no opts provided', () => {
      const result = service.compute(1_000_000);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.appliedRates.incomeTaxRate).toBe(PAYROLL_TAX_INCOME_RATE);
      expect(result.data.appliedRates.socialRate).toBe(PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE);
    });

    it('returns overrides when opts provided', () => {
      const result = service.compute(1_000_000, { incomeTaxRate: 0.15, socialRate: 0.03 });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.appliedRates.incomeTaxRate).toBe(0.15);
      expect(result.data.appliedRates.socialRate).toBe(0.03);
    });
  });

  // ── 7. Rounding ───────────────────────────────────────────────────────
  describe('compute() rounding (tiyin precision)', () => {
    it('fractional result rounds to 2 decimal places', () => {
      // 333_333 × 0.12 = 39_999.96 → rounds to 39_999.96 (already 2dp)
      // 333_333 × 0.01 = 3_333.33  → rounds to 3_333.33
      const gross = 333_333;
      const result = service.compute(gross);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const d = result.data;
      // All returned values must be finite numbers
      expect(Number.isFinite(d.incomeTax)).toBe(true);
      expect(Number.isFinite(d.socialContribution)).toBe(true);
      expect(Number.isFinite(d.net)).toBe(true);

      // Verify max 2dp (no floating-point noise)
      const hasMax2dp = (n: number): boolean =>
        Math.round(n * 100) / 100 === n;

      expect(hasMax2dp(d.incomeTax)).toBe(true);
      expect(hasMax2dp(d.socialContribution)).toBe(true);
      expect(hasMax2dp(d.net)).toBe(true);

      // Exact values: 333_333 × 0.12 = 39_999.96
      expect(d.incomeTax).toBe(39_999.96);
      // 333_333 × 0.01 = 3_333.33
      expect(d.socialContribution).toBe(3_333.33);
      // net = 333_333 − 39_999.96 − 3_333.33 = 289_999.71
      expect(d.net).toBe(r2(gross - d.incomeTax - d.socialContribution));
    });
  });
});
