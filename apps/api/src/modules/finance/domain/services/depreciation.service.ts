/**
 * @module depreciation.service
 * @description Fixed-asset depreciation calculator. Implements the four
 *   methods accepted by Uzbekistan tax accounting (IFRS-compatible):
 *
 *     SL  — Straight-line. Equal monthly depreciation. Used for buildings,
 *           office equipment, most furniture. Simplest, most defensible.
 *     DB  — Declining-balance (200%). Front-loads expense (matching the
 *           higher early-life productivity of machines). Tax-favorable.
 *     SYD — Sum-of-years-digits. Also front-loads but less aggressively
 *           than DB. Used when DB would over-depreciate (vehicles, IT).
 *     UOP — Units-of-production. Depreciation follows actual usage, not
 *           calendar time. Used for printing presses + cutters where
 *           wear is metered (impressions, hours, kg).
 *
 *   Every method returns a *monthly* depreciation number — the schedule is
 *   reported month-by-month so GL postings can be made as part of period
 *   close. `buildSchedule()` rolls it all up.
 * @layer Domain Service (FI / fixed assets)
 *
 * WHY MIX OF METHODS (instead of one)
 *   Tax law in UZ permits choosing per asset category, and CFO chooses the
 *   method that minimises taxable income within accounting rules. Methods
 *   are NOT interchangeable: once chosen for an asset they must be applied
 *   consistently until disposal (consistency principle). Storing the method
 *   on the asset and routing here lets us compute the same number every
 *   period without re-deriving it.
 *
 * WHY BOOK VALUE FLOORS AT SALVAGE
 *   For SL, DB, SYD the loop in `buildSchedule` caps depreciation at
 *   `bv - salvage` and breaks once book value reaches salvage. Depreciating
 *   below salvage is a misstatement — the asset still has residual value.
 *   UOP is naturally bounded by `unitsProduced/totalUnits`.
 *
 * WHY ALL NUMBERS HAVE `.toFixed(4)`
 *   Float arithmetic accumulates drift over a 5-7 year monthly schedule.
 *   4 decimals is the granularity required for GL posting in UZS — finer
 *   precision shows up as 0.0001 noise in reports.
 */

import { Ok, Err, Result, AppError } from '@common/result';
import { MONTHS_PER_YEAR } from '@common/constants/business.constants';

export type DepreciationMethod = 'SL' | 'DB' | 'SYD' | 'UOP';

export interface DepreciationParams {
  cost: number;
  salvage: number;
  usefulLifeYears: number;
  method: DepreciationMethod;
  unitsProduced?: number;
  totalUnits?: number;
  period?: number;
  bookValue?: number;
}

export interface DepreciationScheduleLine {
  period: number;
  depreciation: number;
  bookValue: number;
  accumulated: number;
}

export class DepreciationService {
  validateParams(params: DepreciationParams): Result<void, AppError> {
    if (params.usefulLifeYears <= 0)
      return Err({ code: 'VALIDATION', message: 'Foydali xizmat muddati 0 dan katta bo\'lishi kerak' });
    if (params.cost < params.salvage)
      return Err({ code: 'VALIDATION', message: 'Xarid narxi qoldiq qiymatdan katta bo\'lishi kerak' });
    if (params.cost < 0)
      return Err({ code: 'VALIDATION', message: 'Xarid narxi manfiy bo\'lishi mumkin emas' });
    return Ok(undefined);
  }

  /**
   * Straight-line monthly depreciation = (cost − salvage) / (lifeYears × 12).
   * Constant for every period of asset life.
   */
  straightLine(cost: number, salvage: number, yearsLife: number): number {
    if (yearsLife <= 0) return 0;
    return (cost - salvage) / yearsLife / MONTHS_PER_YEAR;
  }

  /**
   * Double-declining-balance: book value × (2 / life) / 12 per month.
   * The "2" is the standard 200% acceleration factor. Caller MUST clamp the
   * result so book value never goes below salvage — see `buildSchedule`.
   */
  doubleDeclining(bookValue: number, yearsLife: number): number {
    if (yearsLife <= 0) return 0;
    return bookValue * (2 / yearsLife) / MONTHS_PER_YEAR;
  }

  /**
   * Sum-of-Years-Digits monthly depreciation.
   *   SYD = n(n+1)/2          // denominator across full life
   *   year-fraction = (n - yearIndex + 1) / SYD   // year 1 gets the biggest share
   *   monthly = (cost - salvage) × year-fraction / 12
   *
   * `monthPeriod` is a 1-indexed month counter (period 1 = first month of
   * service). We derive the year index with `Math.ceil(...)` so months 1..12
   * stay in year 1, months 13..24 in year 2, etc.
   */
  sumOfYearsDigits(cost: number, salvage: number, yearsLife: number, monthPeriod: number): number {
    if (yearsLife <= 0) return 0;
    const n = yearsLife;
    const syD = (n * (n + 1)) / 2;
    const yearIndex = Math.ceil(monthPeriod / MONTHS_PER_YEAR);
    const remaining = n - yearIndex + 1;
    if (remaining <= 0) return 0;
    return (cost - salvage) * remaining / syD / MONTHS_PER_YEAR;
  }

  unitsOfProduction(cost: number, salvage: number, unitsProduced: number, totalUnits: number): number {
    if (totalUnits <= 0) return 0;
    return (cost - salvage) * (unitsProduced / totalUnits);
  }

  buildSchedule(params: DepreciationParams): DepreciationScheduleLine[] {
    const { cost, salvage, usefulLifeYears, method } = params;
    const months = usefulLifeYears * 12;
    const schedule: DepreciationScheduleLine[] = [];
    let bv = cost;
    let accumulated = 0;

    for (let t = 1; t <= months; t++) {
      let dep = 0;
      if (method === 'SL') {
        dep = this.straightLine(cost, salvage, usefulLifeYears);
      } else if (method === 'DB') {
        dep = Math.min(this.doubleDeclining(bv, usefulLifeYears), bv - salvage);
        if (dep < 0) dep = 0;
      } else if (method === 'SYD') {
        dep = this.sumOfYearsDigits(cost, salvage, usefulLifeYears, t);
      } else if (method === 'UOP') {
        const units = params.unitsProduced ?? 0;
        const total = params.totalUnits ?? 1;
        dep = this.unitsOfProduction(cost, salvage, units / months, total);
      }
      dep = Math.min(dep, bv - salvage);
      if (dep < 0) dep = 0;
      bv = bv - dep;
      accumulated += dep;
      schedule.push({ period: t, depreciation: +dep.toFixed(4), bookValue: +bv.toFixed(4), accumulated: +accumulated.toFixed(4) });
      if (bv <= salvage + 0.0001) break;
    }

    return schedule;
  }

  annualDepreciation(params: DepreciationParams): number {
    const schedule = this.buildSchedule(params);
    const firstYear = schedule.slice(0, 12);
    return (Array.isArray(firstYear) ? firstYear : []).reduce((s, l) => s + l.depreciation, 0);
  }
}
