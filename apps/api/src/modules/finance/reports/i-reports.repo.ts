/**
 * @module i-reports.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IFinanceReportsRepository {
  findTrialBalance(fiscalYear?: number): Promise<Result<object[]>>;
  findProfitLoss(from?: string, to?: string): Promise<Result<Record<string, unknown>>>;
  findWeeklySummary(): Promise<Result<Record<string, unknown>>>;
  findMonthlySummary(year?: number): Promise<Result<object[]>>;
  findKpiDashboard(): Promise<Result<Record<string, unknown>>>;
}

export const FINANCE_REPORTS_REPO = 'IFinanceReportsRepository';
