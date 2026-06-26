/**
 * @module razryad-history.repository
 * @description Razryad o'sish/pasayish EXECUTION data-access (razryad_history + razryad_requests).
 *   FAZA-03 (EP-ORG-010..013/091). Result<T>, parametrlangan sql (Qoida 4).
 *   Atomik: razryad o'zgarishi = org_departments UPDATE + razryad_history INSERT bir tranzaksiyada.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { db, runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface RazryadRequestInput {
  cardId: number;
  targetRazryadId: number;
  requestType: 'increase' | 'decrease';
  examScore?: number | null;
  reason?: string | null;
  requestedBy?: number | null;
  aiSuggested?: boolean;
}

export interface ApplyChangeInput {
  cardId: number;
  employeeId: number | null;
  oldRazryadId: number | null;
  newRazryadId: number;
  changeType: 'increase' | 'decrease' | 'initial';
  reason?: string | null;
  examScore?: number | null;
  certificateNumber?: string | null;
  requestedBy?: number | null;
  hrApprovedBy?: number | null;
  managerApprovedBy?: number | null;
  aiSuggested?: boolean;
}

@Injectable()
export class RazryadHistoryRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /** Kartaning razryad tarixi (yangidan eskiga). */
  async historyByCard(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT h.*, ro.name AS old_name, ro.level AS old_level, rn.name AS new_name, rn.level AS new_level
      FROM razryad_history h
      LEFT JOIN razryad_levels ro ON ro.id = h.old_razryad_id
      LEFT JOIN razryad_levels rn ON rn.id = h.new_razryad_id
      WHERE h.card_id = ${cardId}
      ORDER BY h.effective_at DESC, h.id DESC
    `);
  }

  /** Oxirgi razryad o'zgarish sanasi (3-oy guard manbai). NULL = hech qachon. */
  async lastChangeAt(cardId: number): Promise<Result<Date | null>> {
    const r = await this.exec(sql`SELECT MAX(effective_at) AS last_at FROM razryad_history WHERE card_id = ${cardId}`);
    if (!r.ok) return Err(r.error);
    const v = r.data[0]?.last_at;
    return Ok(v ? new Date(String(v)) : null);
  }

  /** Kartaning aktiv egasi (employee_id) — employee_cards'dan. NULL = vakant. */
  async cardOccupant(cardId: number): Promise<Result<number | null>> {
    const r = await this.exec(sql`
      SELECT employee_id FROM employee_cards
      WHERE card_id = ${cardId} AND is_active = true AND COALESCE(is_acting, false) = false
      ORDER BY is_primary DESC NULLS LAST, id ASC LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    const v = r.data[0]?.employee_id;
    return Ok(v == null ? null : Number(v));
  }

  /** Razryad master qatori (coefficient/min_months/exam_pass_threshold o'qish). */
  async razryadLevel(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM razryad_levels WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Kartaning joriy razryad_level_id. */
  async cardRazryad(cardId: number): Promise<Result<{ razryadLevelId: number | null } | null>> {
    const r = await this.exec(sql`SELECT razryad_level_id FROM org_departments WHERE id = ${cardId}`);
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Ok(null);
    return Ok({ razryadLevelId: row.razryad_level_id == null ? null : Number(row.razryad_level_id) });
  }

  /** O'sish/pasayish so'rovi yaratish (pending). */
  async createRequest(dto: RazryadRequestInput, currentRazryadId: number | null, employeeId: number | null): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO razryad_requests
          (card_id, employee_id, target_razryad_id, current_razryad_id, request_type,
           exam_score, reason, status, requested_by, ai_suggested, created_at, updated_at)
        VALUES
          (${dto.cardId}, ${employeeId}, ${dto.targetRazryadId}, ${currentRazryadId}, ${dto.requestType},
           ${dto.examScore ?? null}, ${dto.reason ?? null}, 'pending', ${dto.requestedBy ?? null},
           ${dto.aiSuggested ?? false}, NOW(), NOW())
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async findRequest(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM razryad_requests WHERE id = ${id}`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * Gap #2 (T20-A1) — IMTIHON→RAZRYAD avto-zanjir uchun KARTA resolveri.
   * Imtihon → kurs (lms_exams.course_id) → karta (courses.card_id). NULL = karta biriktirilmagan
   * imtihon (FABRIKATSIYA yo'q: chaqiruvchi xodimning birlamchi kartasiga tushadi).
   */
  async cardIdForExam(examId: number): Promise<Result<number | null>> {
    const r = await this.exec(sql`
      SELECT c.card_id FROM lms_exams e
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.id = ${examId} LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    const v = r.data[0]?.card_id;
    return Ok(v == null ? null : Number(v));
  }

  /**
   * users.id → xodimning birlamchi AKTIV kartasi (org_departments.id) + employees.id.
   * employee_org_departments (aktiv, ended_at IS NULL) — birlamchi tartibda. NULL = karta yo'q.
   */
  async primaryCardForUser(userId: number): Promise<Result<{ cardId: number; employeeId: number | null } | null>> {
    const r = await this.exec(sql`
      SELECT eod.org_department_id AS card_id, e.id AS employee_id
      FROM employee_org_departments eod
      LEFT JOIN employees e ON e.user_id = eod.user_id OR e.id = eod.employee_id
      WHERE (eod.user_id = ${userId})
        AND eod.is_active = true AND eod.ended_at IS NULL AND eod.org_department_id IS NOT NULL
      ORDER BY eod.is_primary DESC NULLS LAST, eod.id ASC
      LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row || row.card_id == null) return Ok(null);
    return Ok({ cardId: Number(row.card_id), employeeId: row.employee_id == null ? null : Number(row.employee_id) });
  }

  /**
   * Kartaning JORIY razryadidan navbatdagi (level+1) razryad_levels.id ni qaytaradi.
   * Karta razryadsiz (NULL) → eng past faol razryad (boshlang'ich o'sish nishoni).
   * Eng yuqori razryadda (keyingisi yo'q) → NULL (o'sish nishoni yo'q; chaqiruvchi skip qiladi).
   */
  async nextRazryadIdForCard(cardId: number): Promise<Result<number | null>> {
    const cur = await this.exec(sql`SELECT razryad_level_id FROM org_departments WHERE id = ${cardId} LIMIT 1`);
    if (!cur.ok) return Err(cur.error);
    if (cur.data.length === 0) return Ok(null);
    const curRlId = cur.data[0]?.razryad_level_id;

    if (curRlId == null) {
      // razryadsiz karta → eng past faol razryad (boshlang'ich nishon).
      const lo = await this.exec(sql`
        SELECT id FROM razryad_levels WHERE COALESCE(is_active, true) = true ORDER BY level ASC LIMIT 1
      `);
      if (!lo.ok) return Err(lo.error);
      const v = lo.data[0]?.id;
      return Ok(v == null ? null : Number(v));
    }

    const next = await this.exec(sql`
      SELECT nl.id FROM razryad_levels cl
      JOIN razryad_levels nl ON nl.level > cl.level AND COALESCE(nl.is_active, true) = true
      WHERE cl.id = ${Number(curRlId)}
      ORDER BY nl.level ASC LIMIT 1
    `);
    if (!next.ok) return Err(next.error);
    const v = next.data[0]?.id;
    return Ok(v == null ? null : Number(v));
  }

  async listRequestsByCard(cardId: number): Promise<Result<Row[]>> {
    return this.exec(sql`SELECT * FROM razryad_requests WHERE card_id = ${cardId} ORDER BY created_at DESC, id DESC`);
  }

  async listPendingRequests(): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT rq.*, c.name AS card_name FROM razryad_requests rq
      LEFT JOIN org_departments c ON c.id = rq.card_id
      WHERE rq.status IN ('pending','hr_approved') ORDER BY rq.created_at ASC
    `);
  }

  /** HR imzosi (1-imzo). status pending -> hr_approved. */
  async markHrApproved(id: number, hrUserId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE razryad_requests SET status = 'hr_approved', hr_approved_by = ${hrUserId}, hr_approved_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND status = 'pending' RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async markRejected(id: number, userId: number, reason: string): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE razryad_requests SET status = 'rejected', rejected_by = ${userId}, reject_reason = ${reason}, updated_at = NOW()
      WHERE id = ${id} AND status IN ('pending','hr_approved') RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /**
   * ATOMIK razryad o'zgarishi: org_departments.razryad_level_id UPDATE + razryad_history INSERT +
   * razryad_requests status='approved' (requestId berilgan bo'lsa). Bir tranzaksiyada — yarim holat YO'Q (Q-40).
   * org_departments'da updated_at yo'q (FAZA-00) — UPDATE'dan tushirildi.
   */
  async applyChange(input: ApplyChangeInput, requestId: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      return await db.transaction(async (tx) => {
        await tx.execute(sql`UPDATE org_departments SET razryad_level_id = ${input.newRazryadId} WHERE id = ${input.cardId}`);
        const histRes = await tx.execute(sql`
          INSERT INTO razryad_history
            (card_id, employee_id, old_razryad_id, new_razryad_id, change_type, reason,
             exam_score, certificate_number, requested_by, hr_approved_by, manager_approved_by,
             ai_suggested, effective_at, created_at)
          VALUES
            (${input.cardId}, ${input.employeeId}, ${input.oldRazryadId}, ${input.newRazryadId},
             ${input.changeType}, ${input.reason ?? null}, ${input.examScore ?? null},
             ${input.certificateNumber ?? null}, ${input.requestedBy ?? null}, ${input.hrApprovedBy ?? null},
             ${input.managerApprovedBy ?? null}, ${input.aiSuggested ?? false}, NOW(), NOW())
          RETURNING *
        `);
        if (requestId != null) {
          await tx.execute(sql`
            UPDATE razryad_requests SET status = 'approved', manager_approved_by = ${input.managerApprovedBy ?? null},
              manager_approved_at = NOW(), updated_at = NOW() WHERE id = ${requestId}
          `);
        }
        // tx.execute natija-tipi noaniq (Qoida 16) — RETURNING qatorini olish uchun yagona chora.
        const row = (histRes as unknown as { rows: Row[] }).rows?.[0] ?? {};
        return row as Row;
      });
    }, 'DB_ERROR');
  }
}
