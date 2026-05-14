/**
 * @module crm-activities.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_activities } from '@shared/db';
import { hrEmployees } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmActivitiesRepository {
  async list(lid: number | null, did: number | null, uid: number | null, type: string | undefined, status: string | undefined, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:               crm_activities.id,
        type:             crm_activities.type,
        subject:          crm_activities.subject,
        lead_id:          crm_activities.lead_id,
        deal_id:          crm_activities.deal_id,
        assigned_to:      crm_activities.assigned_to,
        due_date:         crm_activities.due_date,
        notes:            crm_activities.notes,
        status:           crm_activities.status,
        completed_at:     crm_activities.completed_at,
        created_at:       crm_activities.created_at,
        updated_at:       crm_activities.updated_at,
        assigned_to_name: sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(crm_activities)
        .leftJoin(hrEmployees, eq(hrEmployees.id, crm_activities.assigned_to))
        .where(sql`
          (${lid}::int IS NULL OR ${crm_activities.lead_id} = ${lid}) AND
          (${did}::int IS NULL OR ${crm_activities.deal_id} = ${did}) AND
          (${uid}::int IS NULL OR ${crm_activities.assigned_to} = ${uid}) AND
          (${type ?? null}::text IS NULL OR ${crm_activities.type} = ${type ?? null}) AND
          (${status ?? null}::text IS NULL OR ${crm_activities.status} = ${status ?? null})
        `)
        .orderBy(sql`${crm_activities.due_date} ASC NULLS LAST`, sql`${crm_activities.created_at} DESC`)
        .limit(lim)
        .offset(off).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async today(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:               crm_activities.id,
        type:             crm_activities.type,
        subject:          crm_activities.subject,
        lead_id:          crm_activities.lead_id,
        deal_id:          crm_activities.deal_id,
        assigned_to:      crm_activities.assigned_to,
        due_date:         crm_activities.due_date,
        notes:            crm_activities.notes,
        status:           crm_activities.status,
        assigned_to_name: sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(crm_activities)
        .leftJoin(hrEmployees, eq(hrEmployees.id, crm_activities.assigned_to))
        .where(sql`${crm_activities.due_date}::date = CURRENT_DATE AND ${crm_activities.status} != 'completed'`)
        .orderBy(crm_activities.due_date).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getById(aid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               crm_activities.id,
        type:             crm_activities.type,
        subject:          crm_activities.subject,
        lead_id:          crm_activities.lead_id,
        deal_id:          crm_activities.deal_id,
        assigned_to:      crm_activities.assigned_to,
        due_date:         crm_activities.due_date,
        notes:            crm_activities.notes,
        status:           crm_activities.status,
        outcome:          crm_activities.outcome,
        completed_at:     crm_activities.completed_at,
        created_at:       crm_activities.created_at,
        assigned_to_name: sql<string>`COALESCE(${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}, '')`,
      })
        .from(crm_activities)
        .leftJoin(hrEmployees, eq(hrEmployees.id, crm_activities.assigned_to))
        .where(eq(crm_activities.id, aid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async create(type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown, assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_activities).values({
        type:        type as string,
        subject:     subject as string,
        lead_id:     lead_id as number ?? undefined,
        deal_id:     deal_id as number ?? undefined,
        assigned_to: assigned_to as number ?? undefined,
        due_date:    due_date ? new Date(due_date as string) : undefined,
        notes:       notes as string ?? undefined,
        status:      (status as string) ?? 'pending',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async update(aid: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const { type, subject, assigned_to, due_date, notes, status } = body;
      const rows = await db.update(crm_activities).set({
        type:        sql`COALESCE(${type ?? null}, ${crm_activities.type})`,
        subject:     sql`COALESCE(${subject ?? null}, ${crm_activities.subject})`,
        assigned_to: sql`COALESCE(${assigned_to ?? null}, ${crm_activities.assigned_to})`,
        due_date:    sql`COALESCE(${due_date ?? null}, ${crm_activities.due_date})`,
        notes:       sql`COALESCE(${notes ?? null}, ${crm_activities.notes})`,
        status:      sql`COALESCE(${status ?? null}, ${crm_activities.status})`,
        updated_at:  _time.now(),
      }).where(eq(crm_activities.id, aid)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async complete(aid: number, outcome: unknown): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_activities).set({
        status:       'completed',
        outcome:      (outcome as string) ?? null,
        completed_at: _time.now(),
        updated_at:   _time.now(),
      }).where(eq(crm_activities.id, aid)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async delete(aid: number): Promise<void> {
    await db.delete(crm_activities).where(eq(crm_activities.id, aid));
  }
}
