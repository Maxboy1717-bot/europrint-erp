/**
 * @module goals-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';



const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class GoalsCompatService {
  private readonly logger = new Logger(GoalsCompatService.name);

  async getGoals(status?: string, category?: string, targetType?: string, limit = '50'): Promise<Result<object, AppError>> {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const statusFilter   = status     ? sql`AND g.status = ${status}`          : sql``;
    const categoryFilter = category   ? sql`AND g.category = ${category}`      : sql``;
    const typeFilter     = targetType ? sql`AND g.target_type = ${targetType}` : sql``;
    const r = await safeCall(() => rawSql(sql`
      SELECT g.id, g.title, g.description, g.category, g.target_type, g.target_id,
             g.metric, g.current_value, g.target_value, g.start_date, g.end_date,
             g.status, g.priority, g.created_by, g.created_at, g.updated_at
      FROM goals g
      WHERE true ${statusFilter} ${categoryFilter} ${typeFilter}
      ORDER BY g.created_at DESC
      LIMIT ${lim}
    `));
    if (!r.ok) { this.logger.warn(`getGoals: ${r.error}`); return Ok([]); }
    return Ok(dbRows(r.data));
  }

  async createGoal(body: Record<string, unknown>) {
    const { title, description, category, target_type, target_id, metric,
            current_value, target_value, start_date, end_date, status, priority, created_by } = body;
    if (!title) throw new BadRequestException('title majburiy');
    const r = await safeCall(() => rawSql(sql`
      INSERT INTO goals (title, description, category, target_type, target_id, metric,
                        current_value, target_value, start_date, end_date, status, priority, created_by)
      VALUES (${title ?? ''}, ${description ?? null}, ${category ?? 'department'},
              ${target_type ?? 'department'}, ${String(target_id ?? '')}, ${metric ?? null},
              ${si(current_value)}, ${si(target_value, 100)},
              ${start_date ?? null}, ${end_date ?? null},
              ${status ?? 'active'}, ${priority ?? 'medium'}, ${String(created_by ?? '')})
      RETURNING id, title, status, priority, created_at
    `));
    if (!r.ok) { this.logger.error(`createGoal: ${r.error}`); throw new InternalServerErrorException('Maqsad yaratishda xatolik'); }
    return dbRows(r.data)[0];
  }

  async getGoalStats() {
    const r = await safeCall(() => rawSql(sql`
      SELECT
        COUNT(*) AS total_goals,
        COUNT(*) FILTER (WHERE status = 'active') AS active_goals,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_goals,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_goals,
        ROUND(AVG(CASE WHEN target_value > 0 THEN (current_value::numeric / target_value * 100) END), 1) AS avg_progress
      FROM goals
    `));
    if (!r.ok) {
      this.logger.warn(`getGoalStats: ${r.error}`);
      return { total_goals: 0, active_goals: 0, completed_goals: 0, overdue_goals: 0, avg_progress: 0 };
    }
    const found = dbRows(r.data)[0];
    if (!found) throw new NotFoundException('Record not found');
    return found;
  }

  async getGoal(id: string) {
    const r = await safeCall(() => rawSql(sql`
      SELECT g.id, g.title, g.description, g.category, g.target_type, g.target_id,
             g.metric, g.current_value, g.target_value, g.start_date, g.end_date,
             g.status, g.priority, g.created_by, g.created_at, g.updated_at
      FROM goals g
      WHERE g.id = ${id}
    `));
    if (!r.ok) {
      this.logger.warn(`getGoal(${id}): ${r.error}`);
      throw new NotFoundException('Record not found');
    }
    const found = dbRows(r.data)[0];
    if (!found) throw new NotFoundException('Record not found');
    return found;
  }

  async updateGoal(id: string, body: Record<string, unknown>) {
    const { title, description, current_value, target_value, status, priority, end_date } = body;
    const r = await safeCall(() => rawSql(sql`
      UPDATE goals
      SET title = COALESCE(${title ?? null}, title),
          description = COALESCE(${description ?? null}, description),
          current_value = COALESCE(${current_value ?? null}, current_value),
          target_value = COALESCE(${target_value ?? null}, target_value),
          status = COALESCE(${status ?? null}, status),
          priority = COALESCE(${priority ?? null}, priority),
          end_date = COALESCE(${end_date ?? null}, end_date),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, status, current_value, target_value, updated_at
    `));
    if (!r.ok) {
      this.logger.warn(`updateGoal(${id}): ${r.error}`);
      throw new NotFoundException('Record not found');
    }
    const found = dbRows(r.data)[0];
    if (!found) throw new NotFoundException('Record not found');
    return found;
  }

  async deleteGoal(id: string) {
    const r = await safeCall(() => rawSql(sql`DELETE FROM goals WHERE id = ${id}`));
    if (!r.ok) this.logger.error(`deleteGoal(${id}): ${r.error}`);
    return { ok: r.ok, deleted: r.ok };
  }
}
