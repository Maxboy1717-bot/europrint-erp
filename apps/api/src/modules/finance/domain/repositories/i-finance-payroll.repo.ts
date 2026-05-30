/**
 * @module i-finance-payroll.repo
 * @description Domain repository interface for finance-side payroll roll-up
 *   (department / brigade breakdown, tax summary).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/finance-payroll.repository.ts`.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IFinancePayrollRepo {
  byDepartment(periodId?: string): Promise<Result<Row[]>>;
  byBrigade(periodId?: string): Promise<Result<Row[]>>;
  // ERP gross-only: returns gross/net/headcount. Tax (INPS/JSHD) totals are 1C's domain.
  taxSummary(periodId?: string): Promise<
    Result<{
      grossSalary: number;
      netSalary: number;
      employeeCount: number;
    }>
  >;
}

export const FINANCE_PAYROLL_APP_REPO = Symbol('FINANCE_PAYROLL_APP_REPO');
