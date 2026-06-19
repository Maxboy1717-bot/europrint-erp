/**
 * @module payroll-tax.service
 * @description Pure, unit-testable Uzbekistan payroll tax calculator.
 *   "Har so'm hisobli" — every som accounted for (EP-FIN-056).
 *
 * RESPONSIBILITIES
 *   Compute three mandatory tax/deduction components from a gross salary:
 *     1. incomeTax          — INPS (jismoniy shaxslardan daromad solig'i)
 *     2. socialContribution — JSHD (xodim hissasi, pensiya jamg'armasi)
 *     3. net                — gross − incomeTax − socialContribution
 *
 *   Returns a structured breakdown with configurable override rates so
 *   callers can pass DB-driven or owner-configured rates without changing
 *   this service.
 *
 * WHAT THIS SERVICE IS NOT
 *   - It does NOT touch payroll_periods / payroll_rows / entries (no DB).
 *   - It does NOT post GL journal lines (GlPostingService owns that).
 *   - It does NOT run the PayrollClosureService calculate/close path.
 *     Those paths are LOGIC-ZONES; this service is orthogonal.
 *   - It does NOT compute employer contributions (those are an additional
 *     employer GL cost, not an employee deduction; see PAYROLL_TAX_EMPLOYER_SOCIAL_RATE).
 *
 * ARCHITECTURE
 *   Pure function wrapped in an @Injectable() class so NestJS DI can inject
 *   it where needed without any constructor dependencies. No DB, no HTTP,
 *   no side-effects. `compute()` is synchronous and referentially transparent.
 *
 * CORRECTNESS (Q-40)
 *   Math is validated against known fixtures in payroll-tax.service.spec.ts.
 *   Rate override path is tested separately (rate override test).
 *
 * @see apps/api/src/modules/finance/domain/constants/payroll-tax.constants.ts
 * @see docs/audit/decisions/03-finance.md EP-FIN-056
 * @layer Domain Service (Finance / Payroll Tax)
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  PAYROLL_TAX_INCOME_RATE,
  PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE,
  PAYROLL_TAX_ROUND_PRECISION,
} from '../constants/payroll-tax.constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Optional overrides for statutory rates. If a field is omitted the
 * module-level default from payroll-tax.constants.ts is used. All rates
 * must be in [0, 1] (fractional, NOT percent). For example 12% = 0.12.
 */
export interface PayrollTaxOpts {
  /** Income tax rate override (INPS). Must be in [0, 1]. */
  incomeTaxRate?: number;
  /** Employee social/pension contribution rate override (JSHD). Must be in [0, 1]. */
  socialRate?: number;
}

/** Detailed breakdown returned by PayrollTaxService.compute(). */
export interface PayrollTaxBreakdown {
  /** Input gross salary (UZS, as provided). */
  gross: number;
  /** Income tax withheld (INPS): gross × incomeTaxRate. */
  incomeTax: number;
  /** Employee social/pension contribution (JSHD): gross × socialRate. */
  socialContribution: number;
  /** Net take-home pay: gross − incomeTax − socialContribution. */
  net: number;
  /** Rates used (effective after override merging). */
  appliedRates: {
    incomeTaxRate: number;
    socialRate: number;
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PayrollTaxService {
  /**
   * Compute Uzbekistan statutory payroll deductions and net pay.
   *
   * @param gross   Monthly gross salary in UZS. Must be a finite non-negative
   *                number. Zero is valid (no-salary period).
   * @param opts    Optional rate overrides. Rates must be in [0, 1].
   *
   * @returns Ok<PayrollTaxBreakdown> on success.
   *          Err(VALIDATION) if gross is negative, NaN, Infinity, or if an
   *          override rate is outside [0, 1].
   *
   * @example
   *   const r = service.compute(1_000_000);
   *   // r.data => { gross:1000000, incomeTax:120000, socialContribution:10000, net:870000, … }
   *
   *   const r2 = service.compute(2_000_000, { incomeTaxRate: 0.15 });
   *   // override: r2.data.incomeTax === 300_000
   */
  compute(
    gross: number,
    opts?: PayrollTaxOpts,
  ): Result<PayrollTaxBreakdown> {
    // --- Guard: gross must be a finite, non-negative number ---
    if (typeof gross !== 'number' || !Number.isFinite(gross)) {
      return Err(AppErr('VALIDATION', `gross must be a finite number (got ${gross})`));
    }
    if (gross < 0) {
      return Err(AppErr('VALIDATION', `gross must be non-negative (got ${gross})`));
    }

    // --- Resolve effective rates (override → constant default) ---
    const incomeTaxRate  = opts?.incomeTaxRate  ?? PAYROLL_TAX_INCOME_RATE;
    const socialRate     = opts?.socialRate      ?? PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE;

    // --- Guard: rates must be in [0, 1] ---
    const rateValidation = this.validateRates({ incomeTaxRate, socialRate });
    if (!rateValidation.ok) return rateValidation as Result<PayrollTaxBreakdown>;

    // --- Core computation ---
    const incomeTax         = this.round(gross * incomeTaxRate);
    const socialContribution = this.round(gross * socialRate);
    const net               = this.round(gross - incomeTax - socialContribution);

    return Ok({
      gross,
      incomeTax,
      socialContribution,
      net,
      appliedRates: { incomeTaxRate, socialRate },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Validate that all provided rates are within [0, 1].
   * Returns Err(VALIDATION) on the first out-of-range rate.
   */
  private validateRates(
    rates: Record<string, number>,
  ): Result<void> {
    for (const [name, value] of Object.entries(rates)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return Err(AppErr('VALIDATION', `${name} must be a finite number (got ${value})`));
      }
      if (value < 0 || value > 1) {
        return Err(AppErr('VALIDATION', `${name} must be in [0, 1] (got ${value})`));
      }
    }
    return Ok(undefined);
  }

  /**
   * Round to PAYROLL_TAX_ROUND_PRECISION decimal places (tiyin-level precision).
   * Uses symmetric rounding (Math.round — ties go away from zero).
   */
  private round(value: number): number {
    const factor = 10 ** PAYROLL_TAX_ROUND_PRECISION;
    return Math.round(value * factor) / factor;
  }
}
