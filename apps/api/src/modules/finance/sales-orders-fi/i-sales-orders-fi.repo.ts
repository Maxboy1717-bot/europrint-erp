/**
 * @module i-sales-orders-fi.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface ISalesOrdersFiRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
}

export const SALES_ORDERS_FI_REPO = 'ISalesOrdersFiRepository';
