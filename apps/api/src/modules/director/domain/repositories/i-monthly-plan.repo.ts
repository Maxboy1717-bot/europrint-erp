/**
 * @module i-monthly-plan.repo
 * @description Domain repository interface for director monthly plans
 *   (strategic_goal_id FK + month + objectives/weekly_tasks JSONB + completion).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/monthly-plan.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface IMonthlyPlan {
  id: number;
  strategic_goal_id?: number | null;
  month: string;
  objectives: unknown[];
  weekly_tasks: unknown[];
  completion_pct: string;
  created_at: Date;
  updated_at: Date;
}

export type MonthlyPlanCreateInput = {
  strategic_goal_id?: number | null;
  month: string;
  objectives: unknown[];
  weekly_tasks: unknown[];
};

export type MonthlyPlanUpdateInput = {
  strategic_goal_id?: number | null;
  objectives?: unknown[];
  weekly_tasks?: unknown[];
  completion_pct?: number;
};

export interface IMonthlyPlanRepo {
  list(goalId?: number): Promise<Result<IMonthlyPlan[]>>;
  getByMonth(month: string, goalId?: number): Promise<Result<IMonthlyPlan[]>>;
  getById(id: number): Promise<Result<IMonthlyPlan | null>>;
  create(dto: MonthlyPlanCreateInput): Promise<Result<IMonthlyPlan>>;
  update(id: number, dto: MonthlyPlanUpdateInput): Promise<Result<IMonthlyPlan>>;
  updateCompletion(id: number, pct: number): Promise<Result<void>>;
}

export const MONTHLY_PLAN_REPO = Symbol('MONTHLY_PLAN_REPO');
