/**
 * @module monthly-plan.repository
 * @description Repository / data-access layer for monthly_plans. Uses
 *   typedExecute raw SQL — table is created by the gated P30 migration and is
 *   not in the Drizzle schema barrel (directive QADAM 2).
 * @layer Infrastructure (Director)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';
import type {
  IMonthlyPlanRepo,
  IMonthlyPlan,
  MonthlyPlanCreateInput,
  MonthlyPlanUpdateInput,
} from '../../domain/repositories/i-monthly-plan.repo';

@Injectable()
export class MonthlyPlanRepository implements IMonthlyPlanRepo {
  async list(goalId?: number): Promise<Result<IMonthlyPlan[]>> {
    return safeCall(
      async () =>
        typedExecute<IMonthlyPlan>(sql`
          SELECT * FROM monthly_plans
          WHERE (${goalId ?? null}::int IS NULL
                 OR strategic_goal_id = ${goalId ?? null}::int)
          ORDER BY month DESC, id DESC
        `),
      'DB_ERROR',
    );
  }

  async getByMonth(month: string, goalId?: number): Promise<Result<IMonthlyPlan[]>> {
    return safeCall(
      async () =>
        typedExecute<IMonthlyPlan>(sql`
          SELECT * FROM monthly_plans
          WHERE month = ${month}
            AND (${goalId ?? null}::int IS NULL
                 OR strategic_goal_id = ${goalId ?? null}::int)
          ORDER BY id DESC
        `),
      'DB_ERROR',
    );
  }

  async getById(id: number): Promise<Result<IMonthlyPlan | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<IMonthlyPlan>(
        sql`SELECT * FROM monthly_plans WHERE id = ${id}`,
      );
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async create(dto: MonthlyPlanCreateInput): Promise<Result<IMonthlyPlan>> {
    return safeCall(async () => {
      const rows = await typedExecute<IMonthlyPlan>(sql`
        INSERT INTO monthly_plans
          (strategic_goal_id, month, objectives, weekly_tasks)
        VALUES
          (${dto.strategic_goal_id ?? null}, ${dto.month},
           ${JSON.stringify(dto.objectives ?? [])}::jsonb,
           ${JSON.stringify(dto.weekly_tasks ?? [])}::jsonb)
        RETURNING *
      `);
      if (!rows[0]) throw new Error('INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  async update(id: number, dto: MonthlyPlanUpdateInput): Promise<Result<IMonthlyPlan>> {
    return safeCall(async () => {
      const objectivesJson = dto.objectives === undefined ? null : JSON.stringify(dto.objectives);
      const weeklyJson = dto.weekly_tasks === undefined ? null : JSON.stringify(dto.weekly_tasks);
      const rows = await typedExecute<IMonthlyPlan>(sql`
        UPDATE monthly_plans SET
          strategic_goal_id = COALESCE(${dto.strategic_goal_id ?? null}, strategic_goal_id),
          objectives        = COALESCE(${objectivesJson}::jsonb, objectives),
          weekly_tasks      = COALESCE(${weeklyJson}::jsonb, weekly_tasks),
          completion_pct    = COALESCE(${dto.completion_pct ?? null}::numeric, completion_pct),
          updated_at        = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      if (!rows[0]) throw new Error('NOT_FOUND');
      return rows[0];
    }, 'DB_ERROR');
  }

  async updateCompletion(id: number, pct: number): Promise<Result<void>> {
    return safeCall(async () => {
      await typedExecute<unknown>(sql`
        UPDATE monthly_plans SET completion_pct = ${pct}::numeric, updated_at = NOW()
        WHERE id = ${id}
      `);
    }, 'DB_ERROR');
  }
}
