/**
 * @module zno.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IZnoRepo } from '../../domain/repositories/i-zno.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class ZnoRepository implements IZnoRepo {
  async createZno(departmentId: number | null, submittedBy: number, submitterName: string | null, amount: number, purpose: string, paymentDate: string | null): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO zno (department_id, submitted_by, submitter_name, amount, purpose, payment_date, status) VALUES (${departmentId}, ${submittedBy}, ${submitterName}, ${amount}, ${purpose}, ${paymentDate}, 'pending') RETURNING *`);
      return Ok(r[0]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async listZno(status: string | null, departmentId: number | null, maxRows: number): Promise<Result<Row[]>> {
    try {
      const rows = status && departmentId
        ? await exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zno z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} AND z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${maxRows}`)
        : status
        ? await exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zno z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.status = ${status} ORDER BY z.created_at DESC LIMIT ${maxRows}`)
        : departmentId
        ? await exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zno z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by WHERE z.department_id = ${departmentId} ORDER BY z.created_at DESC LIMIT ${maxRows}`)
        : await exec(sql`SELECT z.*, d.name AS department_name, e.full_name AS submitted_by_name FROM zno z LEFT JOIN departments d ON d.id = z.department_id LEFT JOIN employees e ON e.id = z.submitted_by ORDER BY z.created_at DESC LIMIT ${maxRows}`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findById(id: number): Promise<Result<Row[]>> {
    try {
      const rows = await exec(sql`SELECT id, submitted_by FROM zno WHERE id = ${id} LIMIT 1`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async approveZno(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE zno SET status = 'approved', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment}, updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return Ok(r[0] ?? { message: 'Tasdiqlandi' });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async rejectZno(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE zno SET status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), comment = ${comment}, updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return Ok(r[0] ?? { message: 'Rad etildi' });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateZno(id: number, status: string | null, comment: string | null, userId: number): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE zno SET status = COALESCE(${status}, status), comment = COALESCE(${comment}, comment), reviewed_by = CASE WHEN ${status} IN ('approved', 'rejected') THEN ${userId} ELSE reviewed_by END, reviewed_at = CASE WHEN ${status} IN ('approved', 'rejected') THEN NOW() ELSE reviewed_at END, updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return Ok(r[0] ?? { message: 'Yangilandi' });
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
