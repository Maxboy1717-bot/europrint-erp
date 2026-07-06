/**
 * @module i-pp-planning.repo
 * @description Domain repository interface for production planning queries
 *   (schedule, operations). Concrete implementation lives at
 *   `infrastructure/repositories/pp-planning.repository.ts`.
 * @layer Domain (PP)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IPpPlanningRepo {
  getSchedule(start: string, end: string): Promise<Result<Row[]>>;
  createScheduleEntry(body: Row, createdBy?: number): Promise<Result<Row | null>>;
  updateOperation(id: number, body: Row): Promise<Result<Row | null>>;
}

export const PP_PLANNING_REPO = Symbol('PP_PLANNING_REPO');
