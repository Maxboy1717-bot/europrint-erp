/**
 * PayrollClosureService — pure domain logic for the payroll month-close.
 *
 * Responsibilities:
 *   - Validate that a period is open and dates are sane.
 *   - Aggregate payroll rows into totals (gross, bonuses, deductions, net).
 *   - Generate GL journal entries (debit/credit) for the period.
 *   - Decide closure eligibility (at least one row, no draft rows remaining).
 *
 * No DB / HTTP dependencies — fully unit-testable.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';

export interface PayrollRow {
  id: number;
  employeeId: string | number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'posted' | string;
}

export interface PayrollPeriod {
  id: number;
  status: 'open' | 'calculated' | 'closed' | string;
  periodStartDate?: string;
  periodEndDate?: string;
  periodName?: string;
}

export interface PayrollTotals {
  rowCount: number;
  totalBase: number;
  totalBonus: number;
  totalDeductions: number;
  totalNet: number;
}

export interface GlJournalLine {
  account:  string;
  debit:    number;
  credit:   number;
  memo:     string;
}

/**
 * Account codes for HR payroll GL postings — LIVE Uzbek BHMS chart (`accounts`). The old codes
 * (6710 as expense, 6720/6760/6730) were wrong/absent: 6710 is a LIABILITY (Xodimlarga ish haqi) and
 * 6720/6730/6760 don't exist. No distinct bonus EXPENSE account exists, so bonus folds into salary (9410).
 */
export const PAYROLL_GL_ACCOUNTS = {
  EXPENSE_SALARY:  '9410', // Ish haqi (asosiy) — EXPENSE
  EXPENSE_BONUS:   '9410', // folded into salary expense (no distinct bonus account in the chart)
  LIABILITY_NET:   '6710', // Xodimlarga ish haqi (net payable) — LIABILITY
  LIABILITY_TAXES: '6520', // INPS, JSHD (deductions) — LIABILITY
} as const;

@Injectable()
export class PayrollClosureService {
  /** Sum up payroll rows into period totals; ignores nulls/NaN. */
  aggregate(rows: PayrollRow[] | undefined | null): PayrollTotals {
    const arr = Array.isArray(rows) ? rows : [];
    const out: PayrollTotals = {
      rowCount: arr.length,
      totalBase: 0,
      totalBonus: 0,
      totalDeductions: 0,
      totalNet: 0,
    };
    for (const r of arr) {
      if (!r || typeof r !== 'object') continue;
      out.totalBase       += this.toNum(r.baseSalary);
      out.totalBonus      += this.toNum(r.bonus);
      out.totalDeductions += this.toNum(r.deductions);
      out.totalNet        += this.toNum(r.netPay);
    }
    return out;
  }

  /**
   * Decide whether a period can be closed:
   *   - status must be 'open' or 'calculated' (not already 'closed')
   *   - must have at least one row
   *   - no rows in 'draft' status
   */
  canClose(period: PayrollPeriod, rows: PayrollRow[]): Result<{ totals: PayrollTotals }> {
    if (!period || typeof period !== 'object') {
      return Err(AppErr('NOT_FOUND', 'Davr topilmadi'));
    }
    const status = String(period.status ?? '').toLowerCase();
    if (status === 'closed') {
      return Err(AppErr('CONFLICT', "Davr allaqachon yopilgan"));
    }
    if (status !== 'open' && status !== 'calculated') {
      return Err(AppErr('INVALID_TRANSITION', `Davr holati noto'g'ri: ${period.status}`));
    }
    const arr = Array.isArray(rows) ? rows : [];
    if (arr.length === 0) {
      return Err(AppErr('NO_LINES', "Davr uchun payroll qatorlari mavjud emas"));
    }
    const draftCount = arr.filter((r) => String(r?.status ?? '').toLowerCase() === 'draft').length;
    if (draftCount > 0) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', `${draftCount} ta draft qator bor — avval tasdiqlang`));
    }
    return Ok({ totals: this.aggregate(arr) });
  }

  /**
   * Generate balanced GL journal entries for a closed period.
   *
   * Debit:  Salary expense (totalBase)
   *         Bonus expense  (totalBonus)
   * Credit: Liability — taxes/deductions (totalDeductions)
   *         Liability — net payable     (totalNet)
   *
   * Posting is balanced when totalBase + totalBonus == totalDeductions + totalNet.
   * Returns Err(VALIDATION) if unbalanced.
   */
  buildJournal(totals: PayrollTotals, periodName: string): Result<GlJournalLine[]> {
    if (!totals || typeof totals !== 'object') {
      return Err(AppErr('VALIDATION', 'Totals mavjud emas'));
    }
    const lines: GlJournalLine[] = [];
    if (totals.totalBase > 0) {
      lines.push({ account: PAYROLL_GL_ACCOUNTS.EXPENSE_SALARY, debit: totals.totalBase,   credit: 0, memo: `Maosh xarajati / ${periodName}` });
    }
    if (totals.totalBonus > 0) {
      lines.push({ account: PAYROLL_GL_ACCOUNTS.EXPENSE_BONUS,  debit: totals.totalBonus,  credit: 0, memo: `Bonus xarajati / ${periodName}` });
    }
    if (totals.totalDeductions > 0) {
      lines.push({ account: PAYROLL_GL_ACCOUNTS.LIABILITY_TAXES, debit: 0, credit: totals.totalDeductions, memo: `Soliq/cheklov / ${periodName}` });
    }
    if (totals.totalNet > 0) {
      lines.push({ account: PAYROLL_GL_ACCOUNTS.LIABILITY_NET,   debit: 0, credit: totals.totalNet,        memo: `Net to'lov / ${periodName}` });
    }
    const sumDebit  = lines.reduce((s, l) => s + l.debit, 0);
    const sumCredit = lines.reduce((s, l) => s + l.credit, 0);
    const diff = Math.abs(sumDebit - sumCredit);
    if (diff > 0.5) {
      return Err(AppErr('VALIDATION', `GL jurnal balansda emas: debit ${sumDebit} != credit ${sumCredit}`));
    }
    return Ok(lines);
  }

  /** Validate period date range. */
  validatePeriodDates(period: PayrollPeriod): Result<void> {
    if (!period.periodStartDate || !period.periodEndDate) {
      return Err(AppErr('VALIDATION', 'Davr boshlanish/tugash sanasi belgilanmagan'));
    }
    if (period.periodEndDate <= period.periodStartDate) {
      return Err(AppErr('VALIDATION', "Davr tugash sanasi boshlanish sanasidan keyin bo'lishi kerak"));
    }
    return Ok(undefined);
  }

  // ─── helpers ────────────────────────────────────────────────────────────
  private toNum(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }
}
