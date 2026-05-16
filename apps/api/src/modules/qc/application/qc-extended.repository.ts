/**
 * @module qc-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * TODO PA1-9: Migrate to infrastructure layer with IQcExtendedRepo interface +
 *   QC_EXTENDED_REPO Symbol token. Skipped in this wave (216 lines, many CRUD
 *   methods spanning standards / specs / calibrations / certifications).
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class QcExtendedRepository {
  async listStandards(category: string | undefined, lim: number, off: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT * FROM qc_standards
        WHERE (${category ?? null}::text IS NULL OR category = ${category ?? null})
        ORDER BY name LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getStandard(id: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`SELECT * FROM qc_standards WHERE id = ${id}`);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createStandard(name: string, category: string | null, description: string | null, parameters: Record<string, unknown> | null, is_active: boolean | null): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_standards (name, category, description, parameters, is_active)
        VALUES (${name}, ${category ?? null}, ${description ?? null}, ${parameters ? JSON.stringify(parameters) : null}::jsonb, ${is_active ?? true})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateStandard(id: number, name: string | null, category: string | null, description: string | null, is_active: boolean | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        UPDATE qc_standards
        SET name = COALESCE(${name ?? null}, name),
            category = COALESCE(${category ?? null}, category),
            description = COALESCE(${description ?? null}, description),
            is_active = COALESCE(${is_active ?? null}, is_active),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listFinalInspections(status: string | undefined, oid: number | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      // NOTE: qc_final_inspections schema uses `result` (not status), `papka_order_id` (not order_id),
      // `inspected_by` (FK to users, not employees). `inspector_name` is best-effort from users table.
      const rows = await runQuery<Row>(sql`
        SELECT fi.*, fi.result AS status, fi.papka_order_id, u.username AS inspector_name
        FROM qc_final_inspections fi
        LEFT JOIN users u ON u.id = fi.inspected_by
        WHERE (${status ?? null}::text IS NULL OR fi.result = ${status ?? null})
          AND (${oid}::int IS NULL OR fi.papka_order_id::text = ${oid}::text)
        ORDER BY fi.created_at DESC LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createFinalInspection(order_id: number | null, inspector_id: number | null, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_final_inspections (order_id, inspector_id, status, notes, passed)
        VALUES (${order_id ?? null}, ${inspector_id ?? null}, ${status ?? 'pending'}, ${notes ?? null}, ${passed ?? false})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        UPDATE qc_final_inspections
        SET status = COALESCE(${status ?? null}, status),
            notes = COALESCE(${notes ?? null}, notes),
            passed = COALESCE(${passed ?? null}, passed),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getFinalOrders(lim: number): Promise<Result<Row[]>>  {
  try {
      // NOTE: sales_orders columns — document_number (not order_number),
      // master_status (not status), customer_id (FK; customer name joined from crm_companies).
      // qc_final_inspections links via papka_order_id, not sales_orders.id — so the inspection
      // join is best-effort and may be null until orders cross to papka workflow.
      const rows = await runQuery<Row>(sql`
        SELECT so.id, so.document_number AS order_number, so.master_status AS status,
               COALESCE(cc.name, so.sold_to_party) AS customer_name,
               NULL::text AS inspection_status, NULL::int AS inspection_id
        FROM sales_orders so
        LEFT JOIN crm_companies cc ON cc.id = so.customer_id
        WHERE so.master_status IN ('pending_qc_final', 'in_production', 'qc_failed', 'rework')
        ORDER BY so.created_at DESC LIMIT ${lim}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean): Promise<Result<Row[]>>  {
  try {  
      const status = passed ? 'passed' : 'failed';
      const rows = await runQuery<Row>(sql`
        UPDATE qc_final_inspections
        SET status = ${status}, result = ${inspResult ?? null},
            notes = COALESCE(${notes ?? null}, notes), defect_count = ${defect_count},
            completed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listInProcess(sid: number | null, status: string | undefined, lim: number): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT ip.*, CONCAT(e.first_name, ' ', e.last_name) AS inspector_name
        FROM qc_in_process_inspections ip
        LEFT JOIN employees e ON e.id = ip.inspector_id
        WHERE (${sid}::int IS NULL OR ip.session_id = ${sid})
          AND (${status ?? null}::text IS NULL OR ip.status = ${status ?? null})
        ORDER BY ip.created_at DESC LIMIT ${lim}
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, status: string, notes: string | null): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_in_process_inspections (session_id, inspector_id, check_point, sample_size, defects_found, status, notes)
        VALUES (${session_id}, ${inspector_id ?? null}, ${check_point ?? null}, ${total}, ${defects}, ${status}, ${notes ?? null})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listRootCauses(): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`SELECT * FROM qc_root_causes ORDER BY name`);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createRootCause(name: string, description?: string, category?: string): Promise<Result<Row>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_root_causes (name, description, category)
        VALUES (${name}, ${description ?? null}, ${category ?? null}) RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateRootCause(id: number, name: string | null, description: string | null, category: string | null): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        UPDATE qc_root_causes
        SET name = COALESCE(${name ?? null}, name),
            description = COALESCE(${description ?? null}, description),
            category = COALESCE(${category ?? null}, category),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
