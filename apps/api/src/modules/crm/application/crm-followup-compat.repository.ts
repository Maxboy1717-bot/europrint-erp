/**
 * @module crm-followup-compat.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
// NOTE: crm_activities JOIN employees — LEFT JOIN alias bilan ORM qiyin
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class CrmFollowupCompatRepository {
  async list(lid: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      const rows = await (lid
        ? exec(sql`SELECT a.*, e.full_name AS assigned_to_name FROM crm_activities a LEFT JOIN employees e ON e.id = a.assigned_to WHERE a.lead_id = ${lid} ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT a.*, e.full_name AS assigned_to_name FROM crm_activities a LEFT JOIN employees e ON e.id = a.assigned_to ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC LIMIT ${lim} OFFSET ${off}`));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async today(): Promise<Result<Row[]>> {
    try {
      const rows = await exec(sql`SELECT a.*, e.full_name AS assigned_to_name FROM crm_activities a LEFT JOIN employees e ON e.id = a.assigned_to WHERE a.due_date::date = CURRENT_DATE AND a.status != 'completed' ORDER BY a.due_date ASC`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(body: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const rows = await exec(sql`
        INSERT INTO crm_activities (type, subject, note, due_date, entity_type, entity_id, assigned_to, status, created_at)
        VALUES (
          ${(body.type ?? body.activityType ?? 'call') as string},
          ${(body.subject ?? body.title ?? '') as string},
          ${(body.note ?? body.notes ?? null) as string | null},
          ${(body.dueDate ?? body.due_date ?? null) as string | null},
          ${(body.entityType ?? body.entity_type ?? 'lead') as string},
          ${(body.entityId ?? body.entity_id ?? null) as number | null},
          ${(body.assignedTo ?? body.assigned_to ?? null) as number | null},
          'pending',
          NOW()
        )
        RETURNING *
      `);
      return Ok(rows[0] ?? {});
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: number, body: Record<string, unknown>): Promise<Result<Row | null>> {
    try {
      const rows = await exec(sql`
        UPDATE crm_activities
        SET
          subject    = COALESCE(${(body.subject ?? null) as string | null}, subject),
          note       = COALESCE(${(body.note ?? body.notes ?? null) as string | null}, note),
          due_date   = COALESCE(${(body.dueDate ?? body.due_date ?? null) as string | null}, due_date),
          status     = COALESCE(${(body.isDone ? 'completed' : body.status ?? null) as string | null}, status),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return Ok(rows[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async delete(id: number): Promise<void> {
    await exec(sql`DELETE FROM crm_activities WHERE id = ${id}`);
  }
}
