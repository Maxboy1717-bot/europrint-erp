/**
 * LeaveAccrualService — pure domain logic for monthly leave-balance accrual.
 *
 * Policy (EuroPrint default):
 *   - Annual leave: 28 working days / year → 28 / 12 ≈ 2.33 days per month
 *   - Sick leave:    7 days / year capped at year-total
 *   - Personal leave: 3 days / year
 *
 * Pro-rating:
 *   - For new hires, accrual is pro-rated based on hire-date within the month.
 *   - For the year of hire, the annual entitlement is reduced proportional to
 *     the number of months remaining in the year (including the hire month).
 *
 * No DB / HTTP dependencies — fully unit-testable.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';

export type LeaveType = 'annual' | 'sick' | 'personal' | 'unpaid';

export interface LeaveAccrualPolicy {
  annualDaysPerYear: number;
  sickDaysPerYear: number;
  personalDaysPerYear: number;
}

export const DEFAULT_LEAVE_POLICY: LeaveAccrualPolicy = {
  annualDaysPerYear:    28,
  sickDaysPerYear:       7,
  personalDaysPerYear:   3,
};

export interface AccrualInput {
  employeeId: number;
  /** ISO yyyy-mm-dd hire date. */
  hireDate: string;
  /** Year of the accrual run, e.g. 2026. */
  year: number;
  /** Month of the accrual run, 1..12. */
  month: number;
  /** Optional override policy. */
  policy?: LeaveAccrualPolicy;
}

export interface AccrualLine {
  leaveType: LeaveType;
  daysAccrued: number;
  yearTotal: number;
}

@Injectable()
export class LeaveAccrualService {
  /**
   * Compute accrual lines for a single employee for the given year/month.
   * Returns Err on invalid month or future hire date relative to the period.
   */
  computeAccrual(input: AccrualInput): Result<AccrualLine[]> {
    if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
      return Err(AppErr('VALIDATION', `month 1..12 oraligida bo'lishi kerak: ${input.month}`));
    }
    if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) {
      return Err(AppErr('VALIDATION', `year noto'g'ri: ${input.year}`));
    }
    const hire = this.parseDate(input.hireDate);
    if (hire === null) {
      return Err(AppErr('VALIDATION', `hire_date noto'g'ri: ${input.hireDate}`));
    }
    const policy = input.policy ?? DEFAULT_LEAVE_POLICY;
    if (policy.annualDaysPerYear < 0 || policy.sickDaysPerYear < 0 || policy.personalDaysPerYear < 0) {
      return Err(AppErr('VALIDATION', "Manfiy policy qiymati taqiqlangan"));
    }

    const hireYear  = hire.getUTCFullYear();
    const hireMonth = hire.getUTCMonth() + 1;

    // Cannot accrue for months strictly before the hire month.
    if (input.year < hireYear || (input.year === hireYear && input.month < hireMonth)) {
      return Ok([]);
    }

    const proRation = this.proRationFactor(input.year, input.month, hire);

    const annualPerMonth   = (policy.annualDaysPerYear   / 12) * proRation;
    const sickPerMonth     = (policy.sickDaysPerYear     / 12) * proRation;
    const personalPerMonth = (policy.personalDaysPerYear / 12) * proRation;

    return Ok([
      { leaveType: 'annual',   daysAccrued: this.round2(annualPerMonth),   yearTotal: this.round2(policy.annualDaysPerYear   * this.yearProRation(input.year, hire)) },
      { leaveType: 'sick',     daysAccrued: this.round2(sickPerMonth),     yearTotal: this.round2(policy.sickDaysPerYear     * this.yearProRation(input.year, hire)) },
      { leaveType: 'personal', daysAccrued: this.round2(personalPerMonth), yearTotal: this.round2(policy.personalDaysPerYear * this.yearProRation(input.year, hire)) },
    ]);
  }

  /**
   * Compute the new remaining balance after an accrual line is applied.
   * Caps at `yearTotal` (no negative ceiling allowed).
   */
  applyAccrual(
    current: { total_days: number; used_days: number; remaining_days: number },
    accrual: AccrualLine,
  ): { total_days: number; used_days: number; remaining_days: number } {
    const newTotal     = Math.min(accrual.yearTotal, current.total_days + accrual.daysAccrued);
    const newRemaining = Math.max(0, newTotal - current.used_days);
    return {
      total_days:     this.round2(newTotal),
      used_days:      current.used_days,
      remaining_days: this.round2(newRemaining),
    };
  }

  /**
   * Returns 1.0 for full month accrual; otherwise the fraction of the
   * month covered by the employment relationship (hire-date in mid-month).
   */
  private proRationFactor(year: number, month: number, hire: Date): number {
    const monthStart = Date.UTC(year, month - 1, 1);
    const monthEnd   = Date.UTC(year, month, 0); // last day of month
    const monthDays  = (monthEnd - monthStart) / (24 * 60 * 60 * 1000) + 1;
    const hireTs     = hire.getTime();
    if (hireTs <= monthStart) return 1;
    if (hireTs > monthEnd) return 0;
    const daysWorked = (monthEnd - hireTs) / (24 * 60 * 60 * 1000) + 1;
    const factor = daysWorked / monthDays;
    return Math.max(0, Math.min(1, factor));
  }

  /**
   * For the year of hire, the annual yearTotal is reduced proportional to
   * the months remaining. For subsequent years → 1.0.
   */
  private yearProRation(year: number, hire: Date): number {
    const hireYear  = hire.getUTCFullYear();
    if (year > hireYear) return 1;
    if (year < hireYear) return 0;
    const hireMonth = hire.getUTCMonth() + 1; // 1..12
    // Months covered: hireMonth..12 → (12 - hireMonth + 1) months, with hire-month pro-rated.
    const proFirstMonth = this.proRationFactor(year, hireMonth, hire);
    const remainingFullMonths = 12 - hireMonth;
    return (proFirstMonth + remainingFullMonths) / 12;
  }

  private parseDate(iso: string): Date | null {
    if (typeof iso !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return null;
    const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3]);
    const ts = Date.UTC(y, mo, d);
    if (!Number.isFinite(ts)) return null;
    return new Date(ts);
  }

  private round2(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
  }
}
