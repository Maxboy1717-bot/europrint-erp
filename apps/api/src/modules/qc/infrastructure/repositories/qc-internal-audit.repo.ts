/**
 * @module qc-internal-audit.repo
 * @description 09-qc #22 — Davriy ichki sifat auditi (qc_internal_audits) data-access.
 *   Result<T>, parametrlangan sql (runQuery). Choraklik idempotent scheduling: period
 *   (masalan '2026-Q3') kaliti bo'yicha ON CONFLICT DO NOTHING — cron takror ishga tushsa
 *   dublikat yozilmaydi. FABRIKATSIYA YO'Q (Q-40): auditor/topilma/kalendar/protokol
 *   runtime'da to'ladi (egasi-data kerak emas); cron faqat 'scheduled' qatorini yaratadi.
 * @layer Infrastructure (QC)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall, AppErr } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface ScheduleAuditInput {
  /** Idempotentlik kaliti, masalan '2026-Q3' (uq_qc_internal_audits_period). */
  period: string;
  /** Rejalashtirilgan sana 'YYYY-MM-DD' (odatda chorak boshi). */
  scheduledFor: string;
  /** Audit qamrovi; NULL bo'lsa DB default 'full_quality_system'. */
  scope?: string | null;
}

@Injectable()
export class QcInternalAuditRepository {
  /**
   * Davriy auditni idempotent rejalashtiradi. period allaqachon mavjud bo'lsa ON CONFLICT
   * DO NOTHING → 0 qator → null (cron dublikat yozmaydi). Aks holda yangi 'scheduled' qator.
   */
  async scheduleAudit(i: ScheduleAuditInput): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_internal_audits (period, scheduled_for, scope, status, created_at)
        VALUES (${i.period}, ${i.scheduledFor}::date, ${i.scope ?? 'full_quality_system'}, 'scheduled', NOW())
        ON CONFLICT (period) DO NOTHING
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  /** Rejalashtirilgan/jarayondagi auditlar (kelgusi ishlar oynasi). */
  async listUpcoming(limit = 50): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT id, period, scheduled_for, scope, auditor_id, status, calendar_event_id, protocol_id, created_at
        FROM qc_internal_audits
        WHERE status IN ('scheduled', 'in_progress')
        ORDER BY scheduled_for ASC
        LIMIT ${limit}
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  /**
   * Audit topilmalarini yozadi + holatni yangilaydi. status='completed' bo'lsa completed_at=NOW().
   * Topilmasa NOT_FOUND (Qoida 11). findings = jsonb (topilmalar / no-conformite ro'yxati).
   */
  async recordFindings(id: number, findings: unknown, status: string): Promise<Result<Row>> {
    const r = await safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        UPDATE qc_internal_audits
        SET findings     = ${JSON.stringify(findings ?? null)}::jsonb,
            status       = ${status},
            completed_at = CASE WHEN ${status} = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = ${id}
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Ichki audit topilmadi: ${id}`));
    return Ok(r.data);
  }
}
