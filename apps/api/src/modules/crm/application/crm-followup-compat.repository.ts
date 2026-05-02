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
}
