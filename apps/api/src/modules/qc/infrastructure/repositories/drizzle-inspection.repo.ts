/**
 * @module drizzle-inspection.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { eq, sql, SQL } from 'drizzle-orm';
import { db, qc_inspections } from '@shared/db';
import { AppErr, Err, Result } from '@common/result';
import { Inspection } from '../../domain/aggregates/inspection.aggregate';
import { IQcRepository, DrizzleExecutor } from '../../application/repositories/qc.repository';
import { InspectionStatus } from '../../domain/enums/inspection-status.enum';

type Row = Record<string, unknown>;

/**
 * Narrow shape of a Drizzle executor (db or tx). Restricted to the surface used
 * in this repo so we don't import `PgTransaction` types.
 */
type ExecLike = {
  select: typeof db.select;
  insert: typeof db.insert;
};

const asExec = (tx?: DrizzleExecutor): ExecLike => (tx ?? db) as unknown as ExecLike;

@Injectable()
export class DrizzleQcInspectionRepository implements IQcRepository {
  private readonly logger = new Logger(DrizzleQcInspectionRepository.name);

  /**
   * Persist a submitted inspection's result. submit-inspection always loads the row first
   * (findById), so this UPDATEs by id. Live qc_inspections.id / inspector_id are INTEGER while the
   * Drizzle schema drifted to uuid — the old Drizzle insert cast the aggregate uuid id + the uuid
   * inspector fallback into integer columns and a numeric orderId into the uuid reference_id, so it
   * crashed (22P02). Raw UPDATE on the existing integer id avoids every cast (same approach as
   * create-inspection.handler).
   */
  async save(inspection: Inspection, tx?: DrizzleExecutor): Promise<void> {
    const checked = Number(inspection.sampleSize) || 0;
    const failed = Number(inspection.defectsFoundCount) || 0;
    const passed = Math.max(0, checked - failed);
    // 'rework' is the inspector's third QC decision (Qabul/Rad/REWORK). The
    // live qc_inspections.status is varchar(50) with no CHECK constraint, so it
    // persists verbatim — see DB-proof. Mirror the decision into `result` so
    // downstream readers (dashboard, golden-thread) can distinguish rework.
    const validStatus = ['pending', 'in_progress', 'on_hold', 'passed', 'failed', 'rework'].includes(inspection.status)
      ? inspection.status
      : 'pending';
    const resultValue =
      validStatus === 'passed' ? 'pass' :
      validStatus === 'failed' ? 'fail' :
      validStatus === 'rework' ? 'rework' :
      null;
    const q = sql`
      UPDATE qc_inspections
      SET status = ${validStatus}, result = COALESCE(${resultValue}, result),
          items_checked = ${checked}, items_passed = ${passed},
          items_failed = ${failed}, updated_at = NOW()
      WHERE id = ${Number(inspection.id)}`;
    if (tx) {
      await (tx as unknown as { execute: (q: SQL) => Promise<unknown> }).execute(q);
    } else {
      await db.execute(q);
    }
  }

  async findById(id: string, tx?: DrizzleExecutor): Promise<Inspection | null> {
    try {
      const exec = asExec(tx);
      const rows = await exec.select().from(qc_inspections).where(eq(qc_inspections.id, id)).limit(1);
      const row = rows[0] as Row | undefined;
      if (!row) return null;
      const inspection = new Inspection(Number(row['order_id']), String(row['batch_id'] ?? ''), Number(row['inspector_id']), Number(row['sample_size']));
      inspection.id = String(row['id'] ?? '');
      inspection.status = String(row['status'] ?? 'pending') as InspectionStatus;
      inspection.defectsFoundCount = Number(row['defects_found_count'] ?? 0);
      return inspection;
    } catch (error: unknown) {
      this.logger.error('Failed to find inspection: ' + (error as Error).message);
      return null;
    }
  }

  async findByOrderId(orderId: number): Promise<Inspection[]> {
    const rows = await db.select().from(qc_inspections).where(eq(qc_inspections.reference_id, String(orderId)));
    return rows.map((row) => {
      const inspection = new Inspection(Number((row as Row)['order_id']), String((row as Row)['batch_id'] ?? ''), Number((row as Row)['inspector_id']), Number((row as Row)['sample_size']));
      inspection.id = String((row as Row)['id'] ?? '');
      inspection.status = String((row as Row)['status'] ?? 'pending') as InspectionStatus;
      inspection.defectsFoundCount = Number((row as Row)['defects_found_count'] ?? 0);
      return inspection;
    });
  }

  async delete(id: string): Promise<void> {
    await db.delete(qc_inspections).where(eq(qc_inspections.id, id));
  }

  async withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    try {
      return await db.transaction(async (tx) => work(tx as DrizzleExecutor));
    } catch (e: unknown) {
      this.logger.error('QC transaction failed');
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Tranzaksiya xatoligi'));
    }
  }
}
