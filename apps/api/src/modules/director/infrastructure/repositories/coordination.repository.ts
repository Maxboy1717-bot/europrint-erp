/**
 * @module coordination.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq, desc, and, isNull } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { dokla, rasporyazhenie } from '@shared/db';
import { hrEmployees } from '@shared/db';
import { appUsers } from '@shared/db';
import { alias } from 'drizzle-orm/pg-core';
import { safeCall, Result } from '@common/result';
import type { ICoordinationRepo, DoklaStats, RaspStats } from '../../domain/repositories/i-coordination.repo';

const toUserAlias = alias(appUsers, 'to_user_ref');

type Row = Record<string, unknown>;

export type { DoklaStats, RaspStats };

@Injectable()
export class CoordinationRepository implements ICoordinationRepo {
  async createDokla(userId: number, councilLevel: string | null, title: string, problem: string | null, result_: string | null, proposal: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(dokla).values({
        from_user_id: userId,
        from_name:    null,
        council_level: councilLevel ?? undefined,
        subject:      title,
        problem,
        result:       result_,
        proposal,
        status:       'sent',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async listDokla(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:           dokla.id,
        from_user_id: dokla.from_user_id,
        from_name:    sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${hrEmployees.first_name},'') || ' ' || COALESCE(${hrEmployees.last_name},'')), ''), NULLIF(TRIM(COALESCE(${appUsers.first_name},'') || ' ' || COALESCE(${appUsers.last_name},'')), ''), ${dokla.from_name}, '')`,
        council_level: dokla.council_level,
        subject:      dokla.subject,
        problem:      dokla.problem,
        result:       dokla.result,
        proposal:     dokla.proposal,
        status:       dokla.status,
        created_at:   dokla.created_at,
        updated_at:   dokla.updated_at,
      })
        .from(dokla)
        .leftJoin(hrEmployees, sql`${hrEmployees.id}::text = ${dokla.from_user_id}::text`)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${dokla.from_user_id}::text`)
        // Owner decision 2026-07-13 (chat) — soft-delete: hide soft-deleted dokla from the
        // normal list view (mirrors sd_customers list filter, VISION-3340 #63).
        .where(isNull(dokla.deleted_at))
        .orderBy(desc(dokla.created_at))
        .limit(100).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getDoklaById(id: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ id: dokla.id, from_user_id: dokla.from_user_id })
        .from(dokla).where(and(eq(dokla.id, id), isNull(dokla.deleted_at))).limit(1).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async updateDokla(id: number, status: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(dokla).set({
        status:     sql`COALESCE(${status}, ${dokla.status})`,
        updated_at: _time.now(),
      }).where(eq(dokla.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteDokla(id: number, deletedBy?: number): Promise<void> {
    // Owner decision 2026-07-13 (chat) — soft-delete + audit trail (was a real Drizzle
    // .delete() hard DELETE). Mirrors sd_customers softDelete shape (VISION-3340 #63,
    // commit 01daa468): deleted_at/deleted_by set together; every read path in this
    // file now filters deleted_at IS NULL so soft-deleted dokla disappear from normal
    // views exactly as a hard-delete would have, but the row is recoverable.
    await db.update(dokla)
      .set({ deleted_at: sql`NOW()`, deleted_by: deletedBy ?? null })
      .where(eq(dokla.id, id));
  }

  async createRasporyazhenie(userId: number, toUser: string | null, task: string, deadline: string | null, priority: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(rasporyazhenie).values({
        from_user_id: userId,
        to_user:      toUser ?? undefined,
        task,
        deadline:     deadline ?? undefined,
        priority,
        status:       'assigned',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  // Batch 5 Item 11 — dokla 'resolved' bo'lganda undan avto-rasporyazhenie. Raw parametrized SQL
  // (source_dokla_id/auto_generated migration-qo'shilgan ustunlar, Drizzle def'da yo'q — runtime parity).
  // Idempotent: qisman-unique index + INSERT ... WHERE NOT EXISTS. Proposal bo'sh bo'lsa subject ishlatiladi;
  // ikkalasi ham bo'lmasa yaratmaydi (Q-40 — fabrikatsiya yo'q).
  async createRaspFromDokla(doklaId: number, issuedBy: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const dk = (await runQuery<Row>(sql`
        SELECT id, from_user_id, subject, proposal FROM dokla WHERE id = ${doklaId} AND deleted_at IS NULL LIMIT 1`)).rows[0];
      if (!dk) return null;
      const task = ((dk.proposal as string) ?? '').trim() || ((dk.subject as string) ?? '').trim();
      if (!task) return null; // hech qanday bajariladigan matn yo'q
      const toUser = dk.from_user_id != null ? String(dk.from_user_id) : null;
      const ins = (await runQuery<Row>(sql`
        INSERT INTO rasporyazhenie (from_user_id, to_user, task, priority, status, source_dokla_id, auto_generated)
        SELECT ${issuedBy}, ${toUser}, ${task}, 'normal', 'assigned', ${doklaId}, true
        WHERE NOT EXISTS (SELECT 1 FROM rasporyazhenie WHERE source_dokla_id = ${doklaId})
        RETURNING id, task, to_user, source_dokla_id, auto_generated`)).rows[0];
      return ins ?? null; // null = allaqachon mavjud (idempotent)
    }, 'DB_ERROR');
  }

  async listRasporyazhenie(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:           rasporyazhenie.id,
        from_user_id: rasporyazhenie.from_user_id,
        to_user:      rasporyazhenie.to_user,
        task:         rasporyazhenie.task,
        deadline:     rasporyazhenie.deadline,
        priority:     rasporyazhenie.priority,
        status:       sql<string>`CASE WHEN ${rasporyazhenie.status} != 'done' AND ${rasporyazhenie.deadline} IS NOT NULL AND ${rasporyazhenie.deadline} < CURRENT_DATE THEN 'overdue' ELSE ${rasporyazhenie.status} END`,
        done_at:      rasporyazhenie.done_at,
        done_by:      rasporyazhenie.done_by,
        done_note:    rasporyazhenie.done_note,
        created_at:   rasporyazhenie.created_at,
        updated_at:   rasporyazhenie.updated_at,
        // Batch 5 Item 11 — avto-yaratilgan (dokladan) belgisi + manba-dokla (migration ustunlari; raw sql).
        auto_generated: sql<boolean>`COALESCE(auto_generated, false)`,
        source_dokla_id: sql<number | null>`source_dokla_id`,
        from_name:    sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${hrEmployees.first_name},'') || ' ' || COALESCE(${hrEmployees.last_name},'')), ''), NULLIF(TRIM(COALESCE(${appUsers.first_name},'') || ' ' || COALESCE(${appUsers.last_name},'')), ''), '')`,
        to_name:      sql<string>`NULLIF(TRIM(COALESCE(${toUserAlias.first_name},'') || ' ' || COALESCE(${toUserAlias.last_name},'')), '')`,
      })
        .from(rasporyazhenie)
        .leftJoin(hrEmployees, sql`${hrEmployees.id}::text = ${rasporyazhenie.from_user_id}::text`)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${rasporyazhenie.from_user_id}::text`)
        .leftJoin(toUserAlias, sql`${toUserAlias.id}::text = ${rasporyazhenie.to_user}`)
        // Owner decision 2026-07-13 (chat) — soft-delete: hide soft-deleted rasporyazhenie
        // from the normal list view (mirrors sd_customers list filter, VISION-3340 #63).
        .where(isNull(rasporyazhenie.deleted_at))
        .orderBy(
          sql`CASE WHEN ${rasporyazhenie.status} != 'done' AND ${rasporyazhenie.deadline} IS NOT NULL AND ${rasporyazhenie.deadline} < CURRENT_DATE THEN 0 WHEN ${rasporyazhenie.status} = 'in_progress' THEN 1 WHEN ${rasporyazhenie.status} = 'assigned' THEN 2 WHEN ${rasporyazhenie.status} = 'done' THEN 3 ELSE 4 END`,
          sql`${rasporyazhenie.deadline} ASC NULLS LAST`,
          desc(rasporyazhenie.created_at),
        )
        .limit(100).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getRaspById(id: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ id: rasporyazhenie.id, to_user: rasporyazhenie.to_user, from_user_id: rasporyazhenie.from_user_id })
        .from(rasporyazhenie).where(and(eq(rasporyazhenie.id, id), isNull(rasporyazhenie.deleted_at))).limit(1).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async markRaspDone(id: number, userId: number, note: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(rasporyazhenie).set({
        status:   'done',
        done_at:  _time.now(),
        done_by:  userId,
        done_note: note,
      }).where(eq(rasporyazhenie.id, id)).returning();
      return (rows[0] ?? { message: 'Bajarildi' }) as Row;
      }, 'DB_ERROR');
  }

  async updateRasp(id: number, status: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(rasporyazhenie).set({
        status:     sql`COALESCE(${status}, ${rasporyazhenie.status})`,
        updated_at: _time.now(),
      }).where(eq(rasporyazhenie.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteRasp(id: number, deletedBy?: number): Promise<void> {
    // Owner decision 2026-07-13 (chat) — soft-delete + audit trail (was a real Drizzle
    // .delete() hard DELETE). Mirrors sd_customers softDelete shape (VISION-3340 #63,
    // commit 01daa468): deleted_at/deleted_by set together; every read path in this
    // file now filters deleted_at IS NULL so soft-deleted rasporyazhenie disappear from
    // normal views exactly as a hard-delete would have, but the row is recoverable.
    await db.update(rasporyazhenie)
      .set({ deleted_at: sql`NOW()`, deleted_by: deletedBy ?? null })
      .where(eq(rasporyazhenie.id, id));
  }

  async getStatsDokla(): Promise<Result<DoklaStats>> {
    return safeCall(async () => {
      const r = await db.select({
        sent:     sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='sent')`,
        read:     sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='read')`,
        resolved: sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='resolved')`,
        total:    sql<number>`COUNT(*)`,
      }).from(dokla).where(sql`${dokla.created_at} >= NOW() - INTERVAL '7 days' AND ${dokla.deleted_at} IS NULL`);
      return r[0] ?? { total: 0, sent: 0, read: 0, resolved: 0 };
      }, 'DB_ERROR');
  }

  async listBaskets(): Promise<Result<Row[]>> {
    // NOTE: Raw SQL retained — director coordinator overview shows ALL baskets
    // (not per-user filtered), joined with users for from_name.
    // Drizzle cannot express priority-CASE ordering + LEFT JOIN in one clean builder call.
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT
          d.id::text                                                        AS id,
          d.subject                                                         AS title,
          d.basket_state                                                    AS basket,
          d.is_inbox_overdue                                                AS overdue,
          d.created_at::text                                                AS created_at,
          NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS from_name
        FROM cc_documents d
        LEFT JOIN users u ON u.id = d.sender_user_id
        WHERE d.archived_at IS NULL
        ORDER BY
          CASE d.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
          d.is_inbox_overdue DESC,
          d.basket_entered_at ASC NULLS LAST
        LIMIT 200
      `);
      return castTo<Row[]>(r.rows);
    }, 'DB_ERROR');
  }

  async getCouncilById(id: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const r = await db.execute(sql`
        SELECT id, chairperson_id FROM councils WHERE id = ${id} LIMIT 1
      `);
      return ((r as { rows?: unknown[] }).rows) ?? [];
    }, 'DB_ERROR');
  }

  async updateCouncil(
    id: number,
    chairpersonId: number | null,
    description: string | null,
    meetingSchedule: string | null,
    quorumNumerator: number | null,
    quorumDenominator: number | null,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      // Owner decision 2026-07-13 (chat) — per-council quorum override columns
      // (council-quorum-override-2026-07-13.sql). Same COALESCE(param, existing) convention as
      // the other three fields: NULL input leaves the stored value untouched.
      const r = await db.execute(sql`
        UPDATE councils
        SET
          chairperson_id     = COALESCE(${chairpersonId}, chairperson_id),
          description        = COALESCE(${description}, description),
          meeting_schedule   = COALESCE(${meetingSchedule}, meeting_schedule),
          quorum_numerator   = COALESCE(${quorumNumerator}, quorum_numerator),
          quorum_denominator = COALESCE(${quorumDenominator}, quorum_denominator)
        WHERE id = ${id}
        RETURNING
          id, name, council_type, description, is_active, created_at,
          chairperson_id, meeting_schedule, quorum_numerator, quorum_denominator
      `);
      const rows = ((r as { rows?: unknown[] }).rows) ?? [];
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
    }, 'DB_ERROR');
  }

  // Item #154 (CC audit tavsiya #33, Qoida 6): CoordinationController.getCouncils()
  // ichida to'g'ridan-to'g'ri SQL bo'lgan (controller = faqat transport qatlami) — repo/service'ga ko'chirildi.
  async listCouncils(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      // NOTE: councils.chairperson_id FK -> employees(id), NOT users(id).
      // Double JOIN: employees for name, then users for display fallback.
      const r = await db.execute(sql`
        SELECT c.id, c.name, c.council_type, c.description, c.is_active, c.created_at,
               c.chairperson_id,
               TRIM(COALESCE(emp.first_name,'') || ' ' || COALESCE(emp.last_name,'')) AS chairperson_name,
               c.meeting_schedule,
               c.quorum_numerator, c.quorum_denominator
        FROM councils c
        LEFT JOIN employees emp ON emp.id = c.chairperson_id
        LEFT JOIN users u ON u.id = emp.user_id
        WHERE c.is_active = true ORDER BY c.id
      `);
      return ((r as { rows?: unknown[] }).rows) ?? [];
    }, 'DB_ERROR');
  }

  // Item #154 (CC audit tavsiya #33, Qoida 6): CoordinationController.usersForSelect()
  // ichida to'g'ridan-to'g'ri SQL bo'lgan — repo/service'ga ko'chirildi.
  async listUsersForSelect(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      // NOTE: councils.chairperson_id FK -> employees(id).
      // Returns employees.id as `id` so FE can set chairperson_id correctly.
      // Also includes user_id and role for display context.
      const r = await db.execute(sql`
        SELECT
          e.id,
          u.id AS user_id,
          TRIM(COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'')) AS full_name,
          u.role
        FROM employees e
        JOIN users u ON u.id = e.user_id
        WHERE (u.is_active = true OR u.is_active IS NULL)
          AND e.deleted_at IS NULL
          AND TRIM(COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'')) <> ''
        ORDER BY e.first_name, e.last_name
        LIMIT 200
      `);
      return ((r as { rows?: unknown[] }).rows) ?? [];
    }, 'DB_ERROR');
  }

  async getStatsRasp(): Promise<Result<RaspStats>> {
    return safeCall(async () => {
      const r = await db.select({
        assigned:    sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='assigned')`,
        in_progress: sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='in_progress')`,
        done:        sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='done')`,
        overdue:     sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status} != 'done' AND ${rasporyazhenie.deadline} IS NOT NULL AND ${rasporyazhenie.deadline} < CURRENT_DATE)`,
        total:       sql<number>`COUNT(*)`,
      }).from(rasporyazhenie).where(sql`${rasporyazhenie.created_at} >= NOW() - INTERVAL '7 days' AND ${rasporyazhenie.deleted_at} IS NULL`);
      return r[0] ?? { total: 0, assigned: 0, in_progress: 0, done: 0, overdue: 0 };
      }, 'DB_ERROR');
  }
}
