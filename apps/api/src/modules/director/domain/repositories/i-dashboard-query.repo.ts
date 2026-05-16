/**
 * @module i-dashboard-query.repo
 * @description Domain repository interface for director KPI queries.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/dashboard-query.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface IDashboardQueryRepo {
  getActivePoCount(): Promise<Result<number>>;
  getCompletedTodayCount(today: Date): Promise<Result<number>>;
  getAverageOee(): Promise<Result<number>>;
  getMonthlyRevenue(startDate: Date, endDate: Date): Promise<Result<number>>;
  getTopUnpaidInvoices(): Promise<
    Result<Array<{ invoiceId: string; amount: number; daysOverdue: number }>>
  >;
  getAdvancePending(): Promise<Result<number>>;
  getAttendanceToday(today: Date): Promise<Result<{ attended: number; total: number }>>;
  getOpenPayrollCount(): Promise<Result<number>>;
}

export const DASHBOARD_QUERY_REPO = Symbol('DASHBOARD_QUERY_REPO');
