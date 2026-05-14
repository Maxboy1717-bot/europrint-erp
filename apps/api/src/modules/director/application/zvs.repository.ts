/**
 * @module zvs.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ZvsRepository {
  async createZvs(departmentId: number | null, submittedBy: number, submitterName: string | null, amount: number, purpose: string, priority: string, weekDate: string, level: number): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO zvs (department_id, submitted_by, submitter_name, amount, purpose, priority, week_date, level, status) VALUES (${departmentId}, ${submittedBy}, ${submitterName}, ${amount}, ${purpose}, ${priority}, ${weekDate}, ${level}, 'pending') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listZvs(status: string | null, weekDate: string | null, departmentId: number | null): Promise<Result<Row[]>>  {
  try {  
      return status && weekDate && departmentId
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.week_date = ${weekDate}::date AND z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status && weekDate
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.week_date = ${weekDate}::date ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status && departmentId
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : status
        ? exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zvs z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by ORDER BY z.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findById(id: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM zvs WHERE id = ${id} LIMIT 1`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async approveZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE zvs SET status = 'approved', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { message: 'Tasdiqlandi' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async rejectZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE zvs SET status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { message: 'Rad etildi' }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
