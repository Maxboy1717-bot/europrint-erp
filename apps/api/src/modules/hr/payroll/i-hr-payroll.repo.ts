/**
 * @module i-hr-payroll.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IHrPayrollRepository {
  findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
}

export const HR_PAYROLL_REPO = 'IHrPayrollRepository';
