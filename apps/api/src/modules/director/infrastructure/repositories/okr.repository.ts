/**
 * @module okr.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq, desc } from 'drizzle-orm';
import { db } from '@shared/db';
import { okr_objectives, okr_key_results } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { IOkrRepo, KeyResultsDashboard } from '../../domain/repositories/i-okr.repo';

type Row = Record<string, unknown>;

export type { KeyResultsDashboard };

@Injectable()
export class OkrRepository implements IOkrRepo {
  async listObjectives(type: string | null, year: number | null, quarter: string | null, status: string | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(okr_objectives)
        .where(sql`
          (${type}::text IS NULL OR ${okr_objectives.type} = ${type}) AND
          (${year}::int IS NULL OR ${okr_objectives.year} = ${year}::int) AND
          (${quarter}::text IS NULL OR ${okr_objectives.quarter} = ${quarter}) AND
          (${status}::text IS NULL OR ${okr_objectives.status} = ${status})
        `)
        .orderBy(desc(okr_objectives.created_at)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getObjective(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(okr_objectives).where(eq(okr_objectives.id, id)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createObjective(title: string, type: string, year: number, quarter: string, description: string | null, ownerId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(okr_objectives).values({
        title, type, year, quarter, description, owner_id: ownerId, status: 'active',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateObjective(id: number, title: string | null, status: string | null, description: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(okr_objectives).set({
        title:       sql`COALESCE(${title}, ${okr_objectives.title})`,
        status:      sql`COALESCE(${status}, ${okr_objectives.status})`,
        description: sql`COALESCE(${description}, ${okr_objectives.description})`,
        updated_at:  _time.now(),
      }).where(eq(okr_objectives.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteObjective(id: number): Promise<void> {
    await db.delete(okr_objectives).where(eq(okr_objectives.id, id));
  }

  async listKeyResults(objectiveId: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:              okr_key_results.id,
        objective_id:    okr_key_results.objective_id,
        title:           okr_key_results.title,
        target_value:    okr_key_results.target_value,
        current_value:   okr_key_results.current_value,
        unit:            okr_key_results.unit,
        owner_id:        okr_key_results.owner_id,
        status:          okr_key_results.status,
        created_at:      okr_key_results.created_at,
        updated_at:      okr_key_results.updated_at,
        objective_title: okr_objectives.title,
      })
        .from(okr_key_results)
        .leftJoin(okr_objectives, eq(okr_objectives.id, okr_key_results.objective_id))
        .where(sql`(${objectiveId}::int IS NULL OR ${okr_key_results.objective_id} = ${objectiveId}::int)`)
        .orderBy(desc(okr_key_results.created_at)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createKeyResult(objectiveId: number, title: string, targetValue: number, currentValue: number, unit: string, ownerId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(okr_key_results).values({
        objective_id: objectiveId, title, target_value: String(targetValue), current_value: String(currentValue), unit, owner_id: ownerId,
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateKeyResult(id: number, currentValue: number | null, status: string | null, title: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(okr_key_results).set({
        current_value: sql`COALESCE(${currentValue}::numeric, ${okr_key_results.current_value})`,
        status:        sql`COALESCE(${status}, ${okr_key_results.status})`,
        title:         sql`COALESCE(${title}, ${okr_key_results.title})`,
        updated_at:    _time.now(),
      }).where(eq(okr_key_results.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteKeyResult(id: number): Promise<void> {
    await db.delete(okr_key_results).where(eq(okr_key_results.id, id));
  }

  async getDashboardObjectives(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ status: okr_objectives.status, cnt: sql<number>`COUNT(*)` })
        .from(okr_objectives).groupBy(okr_objectives.status).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async getDashboardKeyResults(): Promise<Result<KeyResultsDashboard>> {
    return safeCall(async () => {
      const r = await db.select({
        avg_progress: sql<number>`ROUND(AVG(CASE WHEN ${okr_key_results.target_value} > 0 THEN (${okr_key_results.current_value}::float / ${okr_key_results.target_value} * 100) ELSE 0 END), 1)`,
        total:        sql<number>`COUNT(*)`,
      }).from(okr_key_results);
      return r[0] ?? { avg_progress: 0, total: 0 };
      }, 'DB_ERROR');
  }
}
