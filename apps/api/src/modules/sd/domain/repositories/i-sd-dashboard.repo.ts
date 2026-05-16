/**
 * @module i-sd-dashboard.repo
 * @description Domain repository interface for SD dashboard aggregates
 *   (overview, top customers, manager-action queues, quota stats).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/sd-dashboard.repository.ts`.
 * @layer Domain (SD)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ISdDashboardRepo {
  getOverview(): Promise<Result<Row>>;
  getTopCustomers(): Promise<Result<Row[]>>;
  getPendingAdvanceOrders(mid: number | null, lim: number): Promise<Result<Row[]>>;
  getPendingTechCheckpoints(mid: number | null, lim: number): Promise<Result<Row[]>>;
  getQuotaStats(mid: number | null): Promise<Result<Row[]>>;
}

export const SD_DASHBOARD_REPO = Symbol('SD_DASHBOARD_REPO');
