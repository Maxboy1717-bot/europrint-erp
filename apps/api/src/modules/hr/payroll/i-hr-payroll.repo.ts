/**
 * @module i-hr-payroll.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

/**
 * Bitta aktiv-kartali xodimning karta-oylik kirish ma'lumotlari (Gap #1 — generatePeriodRows).
 * KANONIK zanjir: employee → employee_org_departments(aktiv) → org_departments(birlamchi karta) →
 *   razryad_levels.coefficient (razryad-koeff) + employee_org_departments.stake_fraction (ulush) +
 *   employees.base_salary (baza). FABRIKATSIYA YO'Q: qiymat yo'q → NULL (chaqiruvchi neytralga aylantiradi).
 */
export interface ActiveCardPayInput {
  employeeId: number;
  /** birlamchi aktiv karta (org_departments.id) — ЦКП/LMS darvoza shu karta bo'yicha. */
  cardId: number;
  /** baza oylik (employees.base_salary); NULL/0 → gross 0 (FABRIKATSIYA yo'q). */
  baseSalary: number | null;
  /** razryad koeffitsienti (razryad_levels.coefficient); NULL → 1.0 (neytral). */
  razryadCoeff: number | null;
  /** ko'p-karta ulushi (employee_org_departments.stake_fraction); NULL → 1.0 (yagona karta). */
  stakeShare: number | null;
}

export interface IHrPayrollRepository {
  findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;

  // ─── Payroll period closure (T7.4) ────────────────────────────────────
  findPeriodById(periodId: number): Promise<Result<Row | null>>;
  listRowsByPeriod(periodId: number): Promise<Result<Row[]>>;
  markPeriodClosed(periodId: number, totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }): Promise<Result<Row>>;
  markRowsPosted(periodId: number): Promise<Result<{ updated: number }>>;
  // insertGlJournalLines removed (#10 GL-unify) — payroll closure posts via GlPostingService.postJournal.

  // ─── Karta-oylik generatsiyasi (Gap #1, T20-A1) ───────────────────────
  /** Aktiv-kartali xodimlar + karta-oylik kirishlari (razryad-koeff + stake + baza). */
  listActiveCardPayInputs(): Promise<Result<ActiveCardPayInput[]>>;
  /** Bitta payroll_rows qatorini upsert qiladi (ON CONFLICT period_id, employee_id). */
  upsertPayrollRow(input: {
    periodId: number;
    employeeId: number;
    baseSalary: number;
    bonus: number;
    deductions: number;
    netPay: number;
    workDays: number | null;
    status: string;
    notes: string | null;
  }): Promise<Result<{ id: number; inserted: boolean }>>;
}

export const HR_PAYROLL_REPO = 'IHrPayrollRepository';
