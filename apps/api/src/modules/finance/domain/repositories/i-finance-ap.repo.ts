/**
 * @module i-finance-ap.repo
 * @description Domain repository interface for finance Accounts Payable.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/finance-ap.repository.ts`.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export type ApBucket = {
  vendor_id: null | string;
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_91_120: number;
  over_120: number;
  total_outstanding: number;
};

export type CreateApEntryDto = {
  vendorId?: string | number | null;
  amount: number;
  dueDate?: string | null;
  description?: string | null;
};

export interface IFinanceApRepo {
  getApAgingBuckets(): Promise<Result<Row[]>>;
  getApAgingTotals(): Promise<Result<Row>>;
  getOverduePurchaseInvoices(today: string): Promise<Result<Row[]>>;
  getUnpaidPurchaseInvoices(): Promise<Result<Row[]>>;
  clearApAgingBuckets(): Promise<void>;
  insertApAgingBucket(b: ApBucket): Promise<void>;
  replaceApAgingBuckets(rows: ApBucket[]): Promise<void>;
  createApEntry(dto: CreateApEntryDto): Promise<Result<Row>>;
}

export const FINANCE_AP_REPO = Symbol('FINANCE_AP_REPO');
