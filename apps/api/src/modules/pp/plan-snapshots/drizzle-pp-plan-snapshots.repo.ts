/**
 * @module drizzle-pp-plan-snapshots.repo
 * @description Drizzle implementation of the Director PP plan% snapshot port
 *   (pp_plan_snapshots, vision 07-pp#49). The aggregate roll-up over production_sessions
 *   runs through parameterised runQuery (Rule B: every value bound, no sql.raw of a
 *   variable); insert/latest use the Drizzle builder against the mirrored ppPlanSnapshots
 *   table def. All methods return Result<T> and guard rows with Array.isArray.
 */

import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { ppPlanSnapshots } from '@europrint/schemas';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpPlanSnapshotsRepo,
  PlanFactAggregate,
  PlanSnapshotRow,
  CreatePlanSnapshotInput,
  PlanSnapshotPeriod,
} from './i-pp-plan-snapshots.repo';

/** Raw aggregate row (snake_case) before Number() coercion. */
interface AggregateDbRow {
  planned_qty: string | number;
  actual_qty: string | number;
  session_count: string | number;
}

function mapRow(row: typeof ppPlanSnapshots.$inferSelect): PlanSnapshotRow {
  return {
    id: Number(row.id),
    snapshotDate: String(row.snapshotDate),
    periodType: String(row.periodType),
    shiftLabel: row.shiftLabel != null ? String(row.shiftLabel) : null,
    workCenterId: row.workCenterId != null ? Number(row.workCenterId) : null,
    plannedQty: Number(row.plannedQty ?? 0),
    actualQty: Number(row.actualQty ?? 0),
    planPercent: Number(row.planPercent ?? 0),
    sessionCount: Number(row.sessionCount ?? 0),
    source: String(row.source),
    capturedAt: row.capturedAt instanceof Date ? row.capturedAt.toISOString() : String(row.capturedAt),
  };
}

@Injectable()
export class DrizzlePpPlanSnapshotsRepository implements IPpPlanSnapshotsRepo {
  async aggregatePlanFact(fromInclusive: string, toExclusive: string): Promise<Result<PlanFactAggregate>> {
    try {
      const r = await runQuery<AggregateDbRow>(sql`
        SELECT COALESCE(SUM(target_quantity), 0) AS planned_qty,
               COALESCE(SUM(actual_quantity), 0) AS actual_qty,
               COUNT(*)                          AS session_count
        FROM production_sessions
        WHERE started_at >= ${fromInclusive} AND started_at < ${toExclusive}`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok({
        plannedQty: Number(row?.planned_qty ?? 0),
        actualQty: Number(row?.actual_qty ?? 0),
        sessionCount: Number(row?.session_count ?? 0),
      });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Reja/fakt agregatini hisoblashda xatolik'));
    }
  }

  async insertSnapshot(input: CreatePlanSnapshotInput): Promise<Result<PlanSnapshotRow>> {
    try {
      const rows = await db
        .insert(ppPlanSnapshots)
        .values({
          snapshotDate: input.snapshotDate,
          periodType: input.periodType,
          shiftLabel: input.shiftLabel ?? null,
          workCenterId: input.workCenterId ?? null,
          plannedQty: input.plannedQty,
          actualQty: input.actualQty,
          planPercent: input.planPercent,
          sessionCount: input.sessionCount,
          source: input.source ?? 'shift_close',
        })
        .returning();
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Reja-snapshot yozilmadi'));
      return Ok(mapRow(row));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Reja-snapshotni yozishda xatolik'));
    }
  }

  async latestSnapshot(periodType: PlanSnapshotPeriod): Promise<Result<PlanSnapshotRow | null>> {
    try {
      const rows = await db
        .select()
        .from(ppPlanSnapshots)
        .where(and(eq(ppPlanSnapshots.periodType, periodType), isNull(ppPlanSnapshots.workCenterId)))
        .orderBy(desc(ppPlanSnapshots.capturedAt))
        .limit(1);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Oxirgi snapshotni o'qishda xatolik"));
    }
  }
}
