/**
 * @module hr-mentorship-pairings.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Backs the real mentor<->mentee PAIRING model for the "Mentorlik" sidebar page
 * (Mentorship.tsx), reading/writing the `mentorships` table (schema-misc-app-b.ts:
 * mentor_id, mentee_id, course_id, status, start_date, end_date, deadline,
 * bonus_percentage, goals, notes, created_at, updated_at) — an exact-shape match for
 * the FE form (mentorId/menteeId/courseId/deadline/bonusPercentage/status/notes).
 * This table already had read-only consumers (integration-employee.repo.ts
 * findMentorshipsAsMentor/-Mentee/findAllMentorships under
 * /api/integration/employee-mentorships*) but no write path anywhere — this service
 * adds the first one.
 *
 * SOFT DELETE WITHOUT A SCHEMA CHANGE: `mentorships` has no `deleted_at` column, and
 * adding one needs an owner-approved migration (Q-35). Instead, `remove()` sets
 * status='deleted' (the column is a plain VARCHAR with no CHECK constraint) and
 * `list()` excludes status='deleted' rows by default — giving soft-delete semantics
 * on the existing schema. If the owner later wants a real deleted_at column (e.g. to
 * keep 'deleted' out of the status dropdown's semantic space), that is a 1-line
 * migration + swapping this filter for `deleted_at IS NULL`.
 *
 * NOT built here (flagged for owner): accept/reject workflow + "3-strikes" cap
 * mentioned in the HR/Org vision docs. The current FE (MentorshipDialogs.tsx) only
 * exposes a status dropdown with active/paused/completed — no accept/reject buttons,
 * no strikes counter UI. Extending `status` to pending/accepted/rejected is trivial
 * (no CHECK constraint blocks it), but the strikes-counter + auto-suspend rule would
 * need a new column (owner-approved migration) and new FE surface — out of scope for
 * fixing the create-always-400 bug this task targets.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface CreateMentorshipPairingDto {
  mentorId: string | number;
  menteeId: string | number;
  courseId: string | number;
  deadline: string;
  bonusPercentage?: number;
  status?: string;
  notes?: string;
}

export interface UpdateMentorshipPairingDto {
  status?: string;
  deadline?: string;
  bonusPercentage?: number;
  notes?: string;
}

const DEFAULT_STATUS = 'active';
const DELETED_STATUS = 'deleted';

/** Maps a joined DB row (snake_case + mentor/mentee/course join columns) to the FE's MentorshipRecord shape. */
function toMentorshipRecord(row: Row): Row {
  return {
    id: String(row['id']),
    mentorId: row['mentor_id'] != null ? String(row['mentor_id']) : '',
    menteeId: row['mentee_id'] != null ? String(row['mentee_id']) : '',
    courseId: row['course_id'] != null ? String(row['course_id']) : '',
    deadline: row['deadline'] ?? '',
    bonusPercentage: row['bonus_percentage'] != null ? Number(row['bonus_percentage']) : 0,
    status: row['status'] ?? DEFAULT_STATUS,
    notes: row['notes'] ?? undefined,
    mentorName: row['mentor_name'] ?? undefined,
    mentorEmployeeId: row['mentor_employee_code'] ?? undefined,
    menteeName: row['mentee_name'] ?? undefined,
    menteeEmployeeId: row['mentee_employee_code'] ?? undefined,
    courseTitle: row['course_title'] ?? undefined,
  };
}

const ENRICHED_SELECT = sql`
  SELECT m.*,
         (mentor.first_name || ' ' || mentor.last_name) AS mentor_name,
         mentor.employee_code AS mentor_employee_code,
         (mentee.first_name || ' ' || mentee.last_name) AS mentee_name,
         mentee.employee_code AS mentee_employee_code,
         c.title AS course_title
  FROM mentorships m
  LEFT JOIN employees mentor ON mentor.id = m.mentor_id
  LEFT JOIN employees mentee ON mentee.id = m.mentee_id
  LEFT JOIN courses c ON c.id = m.course_id
`;

@Injectable()
export class HrMentorshipPairingsService {
  async list(filter: { mentorId?: string; menteeId?: string; status?: string }): Promise<Result<Row[]>> {
    try {
      const mentorId = filter.mentorId ? Number(filter.mentorId) : null;
      const menteeId = filter.menteeId ? Number(filter.menteeId) : null;
      const mentorFilter = mentorId != null && Number.isFinite(mentorId) ? sql`AND m.mentor_id = ${mentorId}` : sql``;
      const menteeFilter = menteeId != null && Number.isFinite(menteeId) ? sql`AND m.mentee_id = ${menteeId}` : sql``;
      // Explicit ?status= (including 'deleted') is respected as-is; with no filter,
      // soft-deleted rows are excluded by default (see module header).
      const statusFilter = filter.status
        ? sql`AND m.status = ${filter.status}`
        : sql`AND m.status <> ${DELETED_STATUS}`;
      const rows = await runQuery<Row>(sql`
        ${ENRICHED_SELECT}
        WHERE 1=1 ${mentorFilter} ${menteeFilter} ${statusFilter}
        ORDER BY m.created_at DESC
        LIMIT 200
      `);
      return Ok(rows.rows.map(toMentorshipRecord));
    } catch (e) {
      return Err(String(e));
    }
  }

  async create(dto: CreateMentorshipPairingDto): Promise<Result<Row>> {
    try {
      const mentorId = Number(dto.mentorId);
      const menteeId = Number(dto.menteeId);
      const courseId = Number(dto.courseId);
      if (!Number.isFinite(mentorId) || !Number.isFinite(menteeId) || !Number.isFinite(courseId)) {
        return Err('mentorId, menteeId va courseId — yaroqli ID bo\'lishi shart');
      }
      if (mentorId === menteeId) {
        return Err('Mentor va mentee bir xil xodim bo\'lishi mumkin emas');
      }
      const today = new Date().toISOString().slice(0, 10);
      const inserted = await runQuery<Row>(sql`
        INSERT INTO mentorships (
          mentor_id, mentee_id, course_id, status, deadline, bonus_percentage,
          notes, start_date, created_at, updated_at
        )
        VALUES (
          ${mentorId}, ${menteeId}, ${courseId}, ${dto.status ?? DEFAULT_STATUS}, ${dto.deadline},
          ${dto.bonusPercentage ?? 0}, ${dto.notes ?? null}, ${today}, NOW(), NOW()
        )
        RETURNING id
      `);
      const newId = inserted.rows[0]?.['id'];
      if (newId == null) return Err('mentorships insert failed');

      const enriched = await runQuery<Row>(sql`${ENRICHED_SELECT} WHERE m.id = ${newId}`);
      const row = enriched.rows[0];
      if (!row) return Err('mentorships row not found after insert');
      return Ok(toMentorshipRecord(row));
    } catch (e) {
      return Err(String(e));
    }
  }

  async update(id: number, dto: UpdateMentorshipPairingDto): Promise<Result<Row>> {
    try {
      const updated = await runQuery<Row>(sql`
        UPDATE mentorships
        SET status            = COALESCE(${dto.status ?? null}, status),
            deadline           = COALESCE(${dto.deadline ?? null}, deadline),
            bonus_percentage   = COALESCE(${dto.bonusPercentage ?? null}, bonus_percentage),
            notes              = COALESCE(${dto.notes ?? null}, notes),
            updated_at         = NOW()
        WHERE id = ${id}
        RETURNING id
      `);
      if (!updated.rows[0]) return Err('Mentorlik yozuvi topilmadi');

      const enriched = await runQuery<Row>(sql`${ENRICHED_SELECT} WHERE m.id = ${id}`);
      const row = enriched.rows[0];
      if (!row) return Err('mentorships row not found after update');
      return Ok(toMentorshipRecord(row));
    } catch (e) {
      return Err(String(e));
    }
  }

  /** Soft-delete: sets status='deleted' (no deleted_at column exists yet — see module header). */
  async remove(id: number): Promise<Result<{ id: string; deleted: boolean }>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE mentorships
        SET status = ${DELETED_STATUS}, updated_at = NOW()
        WHERE id = ${id} AND status <> ${DELETED_STATUS}
        RETURNING id
      `);
      if (!rows.rows[0]) return Err('Mentorlik yozuvi topilmadi');
      return Ok({ id: String(id), deleted: true });
    } catch (e) {
      return Err(String(e));
    }
  }
}
