/**
 * @module i-hr-payroll.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IHrPayrollRepository {
  findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;

  // ─── Payroll period closure (T7.4) ────────────────────────────────────
  findPeriodById(periodId: number): Promise<Result<Row | null>>;
  listRowsByPeriod(periodId: number): Promise<Result<Row[]>>;
  markPeriodClosed(periodId: number, totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }): Promise<Result<Row>>;
  markRowsPosted(periodId: number): Promise<Result<{ updated: number }>>;
  insertGlJournalLines(periodId: number, lines: ReadonlyArray<{ account: string; debit: number; credit: number; memo: string }>): Promise<Result<{ inserted: number }>>;
}

export const HR_PAYROLL_REPO = 'IHrPayrollRepository';
