/**
 * @module i-finance-ar.repo
 * @description Domain repository interface for finance Accounts Receivable.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/finance-ar.repository.ts`.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export type ArBucket = {
  customer_id: null | string;
  customer_type: string;
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_91_120: number;
  over_120: number;
  total_outstanding: number;
};

export type CreateArEntryDto = {
  customerId?: string | number | null;
  amount: number;
  dueDate?: string | null;
  description?: string | null;
  createdBy?: number | null;
};

export interface IFinanceArRepo {
  getArAgingBuckets(): Promise<Result<Row[]>>;
  getArAgingTotals(): Promise<Result<Row>>;
  getOverdueInvoices(today: string): Promise<Result<Row[]>>;
  getUnpaidInvoices(): Promise<Result<Row[]>>;
  clearArAgingBuckets(): Promise<void>;
  insertArAgingBucket(b: ArBucket): Promise<void>;
  replaceArAgingBuckets(rows: ArBucket[]): Promise<void>;
  createArEntry(dto: CreateArEntryDto): Promise<Result<Row>>;
}

export const FINANCE_AR_REPO = Symbol('FINANCE_AR_REPO');
