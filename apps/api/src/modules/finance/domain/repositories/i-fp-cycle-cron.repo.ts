/**
 * @module i-fp-cycle-cron.repo
 * @description Domain repository interface for FP cycle cron queries
 *   (employee role lookup, ZVS counts and stats).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/fp-cycle-cron.repository.ts`.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

export interface ZvsStatsRow {
  pending: string;
  approved: string;
  approved_total: string;
  [key: string]: unknown;
}

export interface IFpCycleCronRepo {
  getEmployeeIdsByRoles(roles: string[]): Promise<Result<number[]>>;
  getPendingZvsCount(weekStart: string): Promise<Result<number>>;
  getZvsStats(weekStart: string): Promise<Result<ZvsStatsRow>>;
}

export const FP_CYCLE_CRON_REPO = Symbol('FP_CYCLE_CRON_REPO');
