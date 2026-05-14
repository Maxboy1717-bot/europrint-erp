/**
 * @module coordination.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq, desc } from 'drizzle-orm';
import { db } from '@shared/db';
import { dokla, rasporyazhenie } from '@shared/db';
import { hrEmployees } from '@shared/db';
import { appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface DoklaStats { sent: number; read: number; resolved: number; total: number }
export interface RaspStats { assigned: number; in_progress: number; done: number; overdue: number; total: number }

@Injectable()
export class CoordinationRepository {
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
        from_name:    dokla.from_name,
        council_level: dokla.council_level,
        subject:      dokla.subject,
        problem:      dokla.problem,
        result:       dokla.result,
        proposal:     dokla.proposal,
        status:       dokla.status,
        created_at:   dokla.created_at,
        updated_at:   dokla.updated_at,
        author_name:  sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${hrEmployees.first_name},'') || ' ' || COALESCE(${hrEmployees.last_name},'')), ''), NULLIF(TRIM(COALESCE(${appUsers.first_name},'') || ' ' || COALESCE(${appUsers.last_name},'')), ''), ${dokla.from_name}, '')`,
      })
        .from(dokla)
        .leftJoin(hrEmployees, sql`${hrEmployees.id}::text = ${dokla.from_user_id}::text`)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${dokla.from_user_id}::text`)
        .orderBy(desc(dokla.created_at))
        .limit(100).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getDoklaById(id: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ id: dokla.id, from_user_id: dokla.from_user_id })
        .from(dokla).where(eq(dokla.id, id)).limit(1).then(r => castTo<unknown[]>(r));
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

  async deleteDokla(id: number): Promise<void> {
    await db.delete(dokla).where(eq(dokla.id, id));
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

  async listRasporyazhenie(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:           rasporyazhenie.id,
        from_user_id: rasporyazhenie.from_user_id,
        to_user:      rasporyazhenie.to_user,
        task:         rasporyazhenie.task,
        deadline:     rasporyazhenie.deadline,
        priority:     rasporyazhenie.priority,
        status:       rasporyazhenie.status,
        done_at:      rasporyazhenie.done_at,
        done_by:      rasporyazhenie.done_by,
        done_note:    rasporyazhenie.done_note,
        created_at:   rasporyazhenie.created_at,
        updated_at:   rasporyazhenie.updated_at,
        issued_by_name: sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${hrEmployees.first_name},'') || ' ' || COALESCE(${hrEmployees.last_name},'')), ''), NULLIF(TRIM(COALESCE(${appUsers.first_name},'') || ' ' || COALESCE(${appUsers.last_name},'')), ''), '')`,
      })
        .from(rasporyazhenie)
        .leftJoin(hrEmployees, sql`${hrEmployees.id}::text = ${rasporyazhenie.from_user_id}::text`)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${rasporyazhenie.from_user_id}::text`)
        .orderBy(
          sql`CASE ${rasporyazhenie.status} WHEN 'overdue' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'assigned' THEN 2 WHEN 'done' THEN 3 ELSE 4 END`,
          sql`${rasporyazhenie.deadline} ASC NULLS LAST`,
          desc(rasporyazhenie.created_at),
        )
        .limit(100).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getRaspById(id: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ id: rasporyazhenie.id, to_user: rasporyazhenie.to_user, from_user_id: rasporyazhenie.from_user_id })
        .from(rasporyazhenie).where(eq(rasporyazhenie.id, id)).limit(1).then(r => castTo<unknown[]>(r));
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

  async deleteRasp(id: number): Promise<void> {
    await db.delete(rasporyazhenie).where(eq(rasporyazhenie.id, id));
  }

  async getStatsDokla(): Promise<Result<DoklaStats>> {
    return safeCall(async () => {
      const r = await db.select({
        sent:     sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='sent')`,
        read:     sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='read')`,
        resolved: sql<number>`COUNT(*) FILTER (WHERE ${dokla.status}='resolved')`,
        total:    sql<number>`COUNT(*)`,
      }).from(dokla).where(sql`${dokla.created_at} >= NOW() - INTERVAL '7 days'`);
      return r[0] ?? { total: 0, sent: 0, read: 0, resolved: 0 };
      }, 'DB_ERROR');
  }

  async listBaskets(): Promise<Result<Row[]>> {
    // WHY: stub — returns empty until the basket UI is wired (Sprint H deferred).
    return safeCall(async () => [], 'DB_ERROR');
  }

  async getStatsRasp(): Promise<Result<RaspStats>> {
    return safeCall(async () => {
      const r = await db.select({
        assigned:    sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='assigned')`,
        in_progress: sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='in_progress')`,
        done:        sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='done')`,
        overdue:     sql<number>`COUNT(*) FILTER (WHERE ${rasporyazhenie.status}='overdue')`,
        total:       sql<number>`COUNT(*)`,
      }).from(rasporyazhenie).where(sql`${rasporyazhenie.created_at} >= NOW() - INTERVAL '7 days'`);
      return r[0] ?? { total: 0, assigned: 0, in_progress: 0, done: 0, overdue: 0 };
      }, 'DB_ERROR');
  }
}
