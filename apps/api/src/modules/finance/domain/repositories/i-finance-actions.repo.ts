/**
 * @module i-finance-actions.repo
 * @description Domain repository interface for finance actions
 *   (salary benchmarks, approve payments, advances list / pending,
 *   create AP / AR entries).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/finance-actions.repository.ts`.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IFinanceActionsRepo {
  getSalaryBenchmark(): Promise<Result<Row>>;
  approvePayment(id: number, approvedBy: number | string): Promise<Result<Row>>;
  verifyPayment(id: number, verifiedBy: number): Promise<Result<Row>>;
  /** audit 2026-08-06 T25: compensation helper — revert status after a failed GL post. */
  setPaymentStatus(id: number, status: string): Promise<Result<Row>>;
  listAdvances(
    lim: number,
    off: number,
    page: number,
  ): Promise<Result<{ items: Row[]; total: number; page: number; limit: number }>>;
  getPendingAdvances(): Promise<Result<Row[]>>;
  createApEntry(data: Record<string, unknown>): Promise<Result<Row>>;
  createArEntry(data: Record<string, unknown>): Promise<Result<Row>>;
}

export const FINANCE_ACTIONS_REPO = Symbol('FINANCE_ACTIONS_REPO');
