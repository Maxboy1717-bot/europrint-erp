/**
 * @module monthly-plan.service
 * @description Business-logic service for director monthly plans. completePlan
 *   counts done weekly_tasks and recomputes completion_pct. Returns Result<T>.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import {
  MONTHLY_PLAN_REPO,
  type IMonthlyPlanRepo,
  type IMonthlyPlan,
  type MonthlyPlanCreateInput,
  type MonthlyPlanUpdateInput,
} from '../domain/repositories/i-monthly-plan.repo';

/** weekly_tasks ichidagi "done" task'lar foizini hisoblaydi (0..100). */
export function computeCompletionPct(weeklyTasks: unknown[]): number {
  const tasks = Array.isArray(weeklyTasks) ? weeklyTasks : [];
  if (tasks.length === 0) return 0;
  const done = tasks.filter(
    (t) =>
      t != null &&
      typeof t === 'object' &&
      ((t as Record<string, unknown>).done === true ||
        (t as Record<string, unknown>).status === 'done'),
  ).length;
  return Math.round((done / tasks.length) * 10000) / 100;
}

@Injectable()
export class MonthlyPlanService {
  private readonly logger = new Logger(MonthlyPlanService.name);

  constructor(
    @Inject(MONTHLY_PLAN_REPO) private readonly repo: IMonthlyPlanRepo,
  ) {}

  async list(goalId?: number): Promise<Result<IMonthlyPlan[]>> {
    return this.repo.list(goalId);
  }

  async getByMonth(month: string, goalId?: number): Promise<Result<IMonthlyPlan[]>> {
    return this.repo.getByMonth(month, goalId);
  }

  async create(dto: MonthlyPlanCreateInput): Promise<Result<IMonthlyPlan>> {
    this.logger.log({ code: 'EP-DIR-017', op: 'dir.monthlyPlan.create', month: dto.month });
    return this.repo.create(dto);
  }

  async update(id: number, dto: MonthlyPlanUpdateInput): Promise<Result<IMonthlyPlan>> {
    return this.repo.update(id, dto);
  }

  /** weekly_tasks holatidan completion_pct ni qayta hisoblab saqlaydi (EP-DIR-019). */
  async completePlan(id: number): Promise<Result<IMonthlyPlan>> {
    return safeCall(async () => {
      const found = await this.repo.getById(id);
      if (!found.ok) throw new Error(found.error.message);
      if (!found.data) throw new Error('NOT_FOUND');

      const pct = computeCompletionPct(found.data.weekly_tasks);
      this.logger.log({ code: 'EP-DIR-019', op: 'dir.monthlyPlan.complete', id, pct });

      const upd = await this.repo.updateCompletion(id, pct);
      if (!upd.ok) throw new Error(upd.error.message);

      const fresh = await this.repo.getById(id);
      if (!fresh.ok || !fresh.data) throw new Error('NOT_FOUND');
      return fresh.data;
    }, 'DB_ERROR');
  }
}
