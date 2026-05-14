/**
 * @module kaizen.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class KaizenRepository {
  async createSuggestion(title: string, description: string, category: string, expectedBenefit: string | null, submittedBy: number): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO kaizen_suggestions (title, description, expected_benefit, employee_id, status) VALUES (${title}, ${description}, ${expectedBenefit}, ${String(submittedBy)}, 'submitted') RETURNING *`);
      return Ok(r[0]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async listSuggestions(status: string | null, category: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      const rows = status
        ? await exec(sql`SELECT ks.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS submitted_by_name FROM kaizen_suggestions ks LEFT JOIN employees e ON e.id::text = ks.employee_id WHERE ks.status = ${status} ORDER BY ks.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : await exec(sql`SELECT ks.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS submitted_by_name FROM kaizen_suggestions ks LEFT JOIN employees e ON e.id::text = ks.employee_id ORDER BY ks.created_at DESC LIMIT ${lim} OFFSET ${off}`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getSuggestion(id: number): Promise<Result<Row[]>> {
    try {
      const rows = await exec(sql`SELECT ks.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS submitted_by_name FROM kaizen_suggestions ks LEFT JOIN employees e ON e.id::text = ks.employee_id WHERE ks.id = ${id}`);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateSuggestion(id: number, status: string | null, reviewComment: string | null, implementationNotes: string | null, reviewedBy: number): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE kaizen_suggestions SET status = COALESCE(${status}, status), review_comment = COALESCE(${reviewComment}, review_comment), implementation_notes = COALESCE(${implementationNotes}, implementation_notes), reviewed_by = CASE WHEN ${status}::text IS NOT NULL THEN ${reviewedBy} ELSE reviewed_by END, updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return Ok(r[0] ?? { message: 'Yangilandi' });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getStats(): Promise<Result<Row>> {
    try {
      const rows = await exec(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'submitted') AS submitted, COUNT(*) FILTER (WHERE status = 'review') AS in_review, COUNT(*) FILTER (WHERE status = 'approved') AS approved, COUNT(*) FILTER (WHERE status = 'implemented') AS implemented, COUNT(*) FILTER (WHERE status = 'rejected') AS rejected FROM kaizen_suggestions`);
      return Ok((rows[0] ?? {}) as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
