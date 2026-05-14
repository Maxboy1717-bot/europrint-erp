/**
 * @module i-dashboard-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IDashboardSvcRepository {
  countUsers(): Promise<Result<number>>;
  countOrders(): Promise<Result<number>>;
  countPendingApprovals(): Promise<Result<number>>;
}

export const DASHBOARD_SVC_REPO = 'IDashboardSvcRepository';
