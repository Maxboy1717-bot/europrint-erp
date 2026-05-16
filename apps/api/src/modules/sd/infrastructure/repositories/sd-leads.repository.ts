/**
 * @module sd-leads.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (SD)
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
import { db , runQuery } from '@shared/db';
import { execSdLeadDelete, execSdLeadConvert } from '@common/database/queries-sd';
import { sql } from 'drizzle-orm';
import { ISdLeadsRepo } from '../../domain/repositories/i-sd-leads.repo';

type Row = Record<string, unknown>;

@Injectable()
export class SdLeadsRepository implements ISdLeadsRepo {
  async list(status: string | undefined, uid: number | null, pat: string | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`
        SELECT l.*, e.full_name AS assigned_to_name, c.name AS customer_name
        FROM sd_leads l
        LEFT JOIN employees e ON e.id = l.assigned_to
        LEFT JOIN sd_customers c ON c.id = l.customer_id
        WHERE (${status ?? null}::text IS NULL OR l.status = ${status ?? null})
          AND (${uid}::int IS NULL OR l.assigned_to = ${uid})
          AND (${pat}::text IS NULL OR l.title ILIKE ${pat} OR c.name ILIKE ${pat})
        ORDER BY l.created_at DESC LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getStats(): Promise<Result<Row>>  {
  try {
      const rows = await runQuery<Row>(sql`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'new')::int AS new_leads,
               COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
               COUNT(*) FILTER (WHERE status = 'converted')::int AS converted,
               COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week
        FROM sd_leads
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async exportLeads(from?: string, to?: string, status?: string): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`
        SELECT l.*, e.full_name AS assigned_to_name, c.name AS customer_name
        FROM sd_leads l
        LEFT JOIN employees e ON e.id = l.assigned_to
        LEFT JOIN sd_customers c ON c.id = l.customer_id
        WHERE (${from ?? null}::text IS NULL OR l.created_at::date >= ${from ?? null}::date)
          AND (${to ?? null}::text IS NULL OR l.created_at::date <= ${to ?? null}::date)
          AND (${status ?? null}::text IS NULL OR l.status = ${status ?? null})
        ORDER BY l.created_at DESC LIMIT ${MAX_EXPORT_LIMIT}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getById(lid: number): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`
        SELECT l.*, e.full_name AS assigned_to_name, c.name AS customer_name
        FROM sd_leads l
        LEFT JOIN employees e ON e.id = l.assigned_to
        LEFT JOIN sd_customers c ON c.id = l.customer_id
        WHERE l.id = ${lid} AND l.deleted_at IS NULL
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(body: Row): Promise<Result<Row>>  {
  try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO sd_leads (title, customer_id, assigned_to, expected_amount, notes, source, status)
        VALUES (${body.title}, ${body.customer_id ?? null}, ${body.assigned_to ?? null}, ${body.expected_amount ?? 0}, ${body.notes ?? null}, ${body.source ?? 'manual'}, 'new')
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(lid: number, body: Row): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`
        UPDATE sd_leads
        SET title = COALESCE(${body.title ?? null}, title),
            assigned_to = COALESCE(${body.assigned_to ?? null}, assigned_to),
            expected_amount = COALESCE(${body.expected_amount ?? null}, expected_amount),
            notes = COALESCE(${body.notes ?? null}, notes),
            status = COALESCE(${body.status ?? null}, status),
            updated_at = NOW()
        WHERE id = ${lid} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateStatus(lid: number, status: string): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`UPDATE sd_leads SET status = ${status}, updated_at = NOW() WHERE id = ${lid} RETURNING *`);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async delete(lid: number): Promise<Result<void>>  {
  try {
      await execSdLeadDelete(lid);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLeadForConvert(lid: number): Promise<Result<Row | null>>  {
  try {
      const rows = await runQuery<Row>(sql`SELECT * FROM sd_leads WHERE id = ${lid} AND deleted_at IS NULL`);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insertOrderFromLead(customer_id: unknown, expected_amount: unknown, lid: number, notes: unknown): Promise<Result<Row>>  {
  try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO sales_orders (customer_id, total_amount, status, sd_lead_id, notes)
        VALUES (${customer_id ?? null}, ${expected_amount ?? 0}, 'draft', ${lid}, ${notes ?? null})
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async markConverted(lid: number): Promise<Result<void>>  {
  try {
      await execSdLeadConvert(lid);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  /**
   * Atomic lead-to-order conversion: inserts a sales_orders row AND marks the lead
   * as 'converted' in a single transaction. Without this, a failure between the two
   * writes leaves an orphaned order while the lead can be re-converted (duplicate orders).
   */
  async convertLeadToOrderAtomic(
    customer_id: unknown,
    expected_amount: unknown,
    lid: number,
    notes: unknown,
  ): Promise<Result<Row>> {
    try {
      const order = await db.transaction(async (tx) => {
        const res = await tx.execute(sql`
          INSERT INTO sales_orders (customer_id, total_amount, status, sd_lead_id, notes)
          VALUES (${customer_id ?? null}, ${expected_amount ?? 0}, 'draft', ${lid}, ${notes ?? null})
          RETURNING *
        `);
        const inserted = (res.rows?.[0] ?? {}) as Row;
        await tx.execute(sql`
          UPDATE sd_leads SET status = 'converted', updated_at = NOW() WHERE id = ${lid}
        `);
        return inserted;
      });
      return Ok(order);
    } catch (e) {
      return Err(String(e));
    }
  }

  async addActivity(lid: number, type: unknown, subject: unknown, notes: unknown, employee_id: unknown): Promise<Result<Row>>  {
  try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO sd_lead_activities (lead_id, type, subject, notes, employee_id)
        VALUES (${lid}, ${type}, ${subject}, ${notes ?? null}, ${employee_id ?? null})
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? {}) as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getActivities(lid: number): Promise<Result<Row[]>>  {
  try {
      const rows = await runQuery<Row>(sql`
        SELECT a.*, e.full_name AS employee_name
        FROM sd_lead_activities a
        LEFT JOIN employees e ON e.id = a.employee_id
        WHERE a.lead_id = ${lid} ORDER BY a.created_at DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
