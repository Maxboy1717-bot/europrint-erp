/**
 * @module clv.service
 * @description Customer Lifetime Value calculator. Provides two flavours that
 *   trade simplicity for fidelity:
 *
 *   1. **Simple (BG/NBD approximation)** — closed-form steady-state formula.
 *      Good enough for dashboards and prospect prioritisation.
 *        CLV = (AOV × PurchaseFreq × GrossMargin) / ChurnRate
 *
 *   2. **DCF (Discounted Cash Flow)** — period-by-period sum of present
 *      values. Use when CFO needs to compare CLV against capital costs or
 *      when revenue/cost profile is non-stationary (e.g. growing accounts).
 *        CLV = Σ_{t=0}^{n}  (R_t − C_t) / (1 + r)^t
 *      where r = discount rate (cost of capital), n = horizon (periods).
 * @layer Service (CRM analytics — pure compute, no I/O)
 *
 * WHY TWO FORMULAS
 *   The simple formula assumes constant cashflow forever and a memoryless
 *   churn process. That's a reasonable model for established B2B accounts but
 *   collapses for new logos with onboarding ramps or seasonal customers.
 *   DCF lets the CFO plug in a *projected* revenue/cost stream and discount
 *   future periods at the company's WACC, matching the same NPV math used
 *   for capex decisions — giving comparable apples-to-apples ROI numbers.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface SimpleClvInput {
  /** Average revenue per order (base currency, UZS). */
  avgOrderValue: number;
  /** How many orders the customer places per year on average. */
  purchaseFrequencyPerYear: number;
  /** Gross margin as a fraction (0..1). 0.35 means 35% margin. */
  grossMarginRate: number;
  /** Annual churn probability (0..1). 0.20 means 20% chance of leaving per year. */
  churnRate: number;
}

export interface SimpleClvResult {
  clv: number;
  avgOrderValue: number;
  annualRevenue: number;
  annualMargin: number;
  churnRate: number;
  avgLifespanYears: number;
}

export interface DcfPeriod {
  revenue: number;
  cost: number;
}

export interface DcfClvInput {
  periods: DcfPeriod[];
  discountRate: number;
}

export interface DcfClvResult {
  clv: number;
  discountRate: number;
  periods: number;
  presentValues: number[];
}

@Injectable()
export class ClvService {
  /**
   * @description Steady-state CLV — assumes the customer's annual margin will
   *   continue indefinitely under a constant churn hazard. Use for fast
   *   dashboards and lead prioritisation.
   *
   *   `avgLifespanYears = 1 / churnRate` follows from the geometric series:
   *   a customer with 20% annual churn has expected lifetime 5 years.
   *
   *   `clv = annualMargin / churnRate` is the closed-form steady-state NPV
   *   *without* discounting. For NPV with discounting, use `calculateDcf`.
   * @param input - all four inputs are validated; out-of-range yields Err.
   * @returns Ok with breakdown (annualRevenue, annualMargin, avgLifespanYears)
   *   so dashboards can display the build-up, not just the bottom number.
   *   Err(BAD_REQUEST) on any invalid input.
   */
  @Calculation('crm.clv.simple')
  async calculateSimple(input: SimpleClvInput): Promise<Result<SimpleClvResult, AppError>> {
    const validationErr = this.validateSimpleInput(input);
    if (validationErr) return validationErr;
    return Ok(this.buildSimpleResult(input));
  }

  private validateSimpleInput(input: SimpleClvInput): Result<SimpleClvResult, AppError> | null {
    const { avgOrderValue, purchaseFrequencyPerYear, grossMarginRate, churnRate } = input;
    if (safeNum(grossMarginRate) < 0 || safeNum(grossMarginRate) > 1) {
      return Err({ code: 'BAD_REQUEST', message: 'grossMarginRate 0..1 oralig\'ida bo\'lishi kerak' });
    }
    // WHY churnRate cannot be 0: lifespan = 1/churn diverges. A "never churns"
    // customer is not a valid input — caller should set a small floor (e.g. 0.01).
    if (safeNum(churnRate) <= 0 || safeNum(churnRate) > 1) {
      return Err({ code: 'BAD_REQUEST', message: 'churnRate (0..1] oralig\'ida bo\'lishi kerak' });
    }
    if (safeNum(avgOrderValue) < 0 || safeNum(purchaseFrequencyPerYear) < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'avgOrderValue va purchaseFrequency musbat bo\'lishi kerak' });
    }
    return null;
  }

  private buildSimpleResult(input: SimpleClvInput): SimpleClvResult {
    const aov = safeNum(input.avgOrderValue);
    const freq = safeNum(input.purchaseFrequencyPerYear);
    const margin = safeNum(input.grossMarginRate);
    const churn = safeNum(input.churnRate);
    const annualRevenue = aov * freq;
    const annualMargin = annualRevenue * margin;
    return {
      clv: safeDiv(annualMargin, churn),
      avgOrderValue: aov,
      annualRevenue,
      annualMargin,
      churnRate: churn,
      avgLifespanYears: safeDiv(1, churn),
    };
  }

  /**
   * @description Period-by-period DCF CLV. Caller supplies a projected revenue
   *   and cost stream; we discount each period back to present value and sum.
   *
   *   Index `t` is interpreted as a period offset starting at **0** for the
   *   current period. So `periods[0]` is undiscounted (PV = revenue − cost),
   *   `periods[1]` is divided by `(1 + r)^1`, etc. This matches standard NPV
   *   convention.
   * @param input.periods - cashflow per period, must be non-empty
   * @param input.discountRate - annualised rate as fraction (e.g. 0.12 = 12%).
   *   Use company WACC for capex parity, or simple cost of capital otherwise.
   * @returns Ok with the rolled-up CLV and the per-period PV breakdown
   *   (useful for waterfall charts). Err(BAD_REQUEST) on missing periods
   *   or negative discount rate.
   */
  @Calculation('crm.clv.dcf')
  async calculateDcf(input: DcfClvInput): Promise<Result<DcfClvResult, AppError>> {
    const { periods, discountRate } = input;

    if (!periods || periods.length === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'DCF uchun kamida 1 ta davr kerak' });
    }
    const r = safeNum(discountRate);
    if (r < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'discountRate manfiy bo\'lishi mumkin emas' });
    }

    // NOTE: Math.pow(1+r, 0) = 1, so the first period is undiscounted as
    // intended. If you change the indexing to "end-of-period", adjust here.
    const presentValues: number[] = (Array.isArray(periods) ? periods : []).map((p, t) => {
      const netCashFlow = safeNum(p.revenue) - safeNum(p.cost);
      return safeDiv(netCashFlow, Math.pow(1 + r, t));
    });

    const clv = (Array.isArray(presentValues) ? presentValues : []).reduce((sum, pv) => sum + pv, 0);

    return Ok({
      clv,
      discountRate: r,
      periods: periods.length,
      presentValues,
    });
  }
}
