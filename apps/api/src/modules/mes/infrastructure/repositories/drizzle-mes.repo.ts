/**
 * @module drizzle-mes.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok } from '@common/result';
import { Result } from '@common/result';
import { ProductionSession, ChecklistStatus } from '../../domain/aggregates/production-session.aggregate';
import { IMesRepository, DrizzleExecutor } from '../../domain/repositories/mes.repository';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
type Row = Record<string, unknown>;

/**
 * Narrow surface of a Drizzle executor (db or tx) — just `execute()` for raw SQL.
 */
type ExecLike = { execute: (q: SQL | SQLWrapper) => Promise<{ rows: Row[] }> };

const exec = async (q: SQL | SQLWrapper, tx?: DrizzleExecutor): Promise<Row[]> => {
  if (tx) {
    const txExec = tx as unknown as ExecLike;
    const r = await txExec.execute(q);
    return (r.rows ?? []) as Row[];
  }
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleMesRepository implements IMesRepository {
  private readonly logger = new Logger(DrizzleMesRepository.name);

  /**
   * Persist a session's state change (start → running, complete → sent_to_qc). Both callers load an
   * existing row via getSession first, so this UPDATEs by id — the old code INSERTed into columns that
   * don't exist (pp_id/certification_required/completed_at), so it crashed AND would have duplicated the
   * row. Canonical columns: status / started_at / ended_at (mes_production_sessions is a VIEW over this).
   */
  async saveSession(session: ProductionSession, tx?: DrizzleExecutor): Promise<Result<number>> {
    try {
      const startedAt = session.getStartedAt();
      const endedAt = session.getCompletedAt();
      const r = await exec(sql`
        UPDATE production_sessions
        SET status = ${session.getStatus()},
            started_at = COALESCE(${startedAt}, started_at),
            ended_at = COALESCE(${endedAt}, ended_at),
            updated_at = NOW()
        WHERE id = ${session.getId()}
        RETURNING id`, tx);
      if (!r[0]) return Err('Sessiya topilmadi');
      return Ok(Number(r[0].id ?? 0));
    } catch {
      this.logger.error('Failed to save production session');
      return Err('Sessiya saqlashda xatolik');
    }
  }

  /**
   * Rebuild the aggregate from a production_sessions row using the canonical columns
   * (production_order_id / equipment_id / worker_id). certification_required has no column on this
   * table, so it defaults to false — the start-handler cert gate stays opt-in via LMS, not this flag.
   *
   * Rehydrates the REAL persisted stage (status + started_at/ended_at) via
   * ProductionSession.rehydrate, NOT a hardcoded READY: the previous `new ProductionSession(...)`
   * always rebuilt sessions in READY, so the staged guard `complete()` (requires RUNNING/PAUSED)
   * failed for every running/in_progress/paused session — silently blocking the golden-thread
   * MES→QC hop for all real orders. The DB-status→MesStatus map normalizes synonyms
   * ('pending'→READY, 'in_progress'→RUNNING).
   */
  private toSession(row: Row): ProductionSession {
    const startedAt = row.started_at ? new Date(String(row.started_at)) : null;
    const endedAt = row.ended_at ? new Date(String(row.ended_at)) : null;
    return ProductionSession.rehydrate(
      Number(row.id),
      Number(row.production_order_id),
      Number(row.equipment_id),
      Number(row.worker_id),
      false,
      row.status as string | null,
      startedAt,
      endedAt,
    );
  }

  async getSession(id: number, tx?: DrizzleExecutor): Promise<Result<ProductionSession>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE id = ${id} LIMIT 1`, tx);
      if (!r[0]) return Err('Sessiya topilmadi');
      const row = r[0];
      return Ok(this.toSession(row));
    } catch {
      this.logger.error('Failed to get session');
      return Err('Oqish xatoligi');
    }
  }

  async withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    try {
      return await db.transaction(async (tx) => work(tx as DrizzleExecutor));
    } catch (e: unknown) {
      this.logger.error('MES transaction failed');
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Tranzaksiya xatoligi'));
    }
  }

  async getSessionByPpId(ppId: number): Promise<Result<ProductionSession>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE production_order_id = ${ppId} LIMIT 1`);
      if (!r[0]) return Err('Sessiya topilmadi');
      const row = r[0];
      return Ok(this.toSession(row));
    } catch {
      this.logger.error('Failed to get session by PP');
      return Err('Oqish xatoligi');
    }
  }

  async getAllSessionsByStatus(status: string): Promise<Result<ProductionSession[]>> {
    try {
      const r = await exec(sql`SELECT * FROM production_sessions WHERE status = ${status}`);
      return Ok(r.map((row) => this.toSession(row)));
    } catch {
      this.logger.error('Failed to get sessions');
      return Err('Oqish xatoligi');
    }
  }

  /**
   * Reads the session's TB-safety / smena-readiness checklist from the canonical
   * `setup_checklists` (one row per session) → `checklist_items` tables. Returns
   * only REQUIRED items: total count + titles of those not yet completed. The
   * production-session aggregate uses this to BLOCK start when readiness is unmet
   * (Q-40 — no silent status flip). session_id is a varchar column, so the integer
   * id is cast to text for the match.
   */
  async getChecklistStatus(sessionId: number, tx?: DrizzleExecutor): Promise<Result<ChecklistStatus>> {
    try {
      const rows = await exec(sql`
        SELECT ci.title AS title,
               COALESCE(ci.is_completed, false) AS is_completed
        FROM checklist_items ci
        JOIN setup_checklists sc ON sc.id = ci.checklist_id
        WHERE sc.session_id = ${String(sessionId)}
          AND COALESCE(ci.is_required, true) = true`, tx);
      const requiredIncomplete = rows
        .filter((r) => r.is_completed !== true)
        .map((r) => String(r.title ?? 'Nomsiz band'));
      return Ok({ requiredTotal: rows.length, requiredIncomplete });
    } catch {
      this.logger.error('Failed to load checklist status');
      return Err('Chek-list holatini o\'qishda xatolik');
    }
  }

  async checkOperatorCertification(operatorId: number, courseId: number): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT * FROM operator_certifications WHERE operator_id = ${operatorId} AND course_id = ${courseId} LIMIT 1`);
      const cert = r[0];
      if (!cert) {
        return { ok: true as const, data: { valid: false, courseName: 'Unknown Course', expiresAt: null } };
      }
      const now = _time.now();
      const valid = cert.expires_at ? new Date(String(cert.expires_at)) > now : false;
      return { ok: true as const, data: { valid, courseName: cert.course_name, expiresAt: cert.expires_at } };
    } catch {
      this.logger.error('Failed to check certification');
      return Err('Sertifikat tekshirishda xatolik');
    }
  }
}
