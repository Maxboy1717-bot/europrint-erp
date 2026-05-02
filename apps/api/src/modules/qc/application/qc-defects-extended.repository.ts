import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql, SQL } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class QcDefectsExtendedRepository {
  async listBraks(sid: number | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {  
      return sid !== null
        ? exec(sql`SELECT b.*, u.username AS reported_by_name FROM qc_braks b LEFT JOIN users u ON u.id = b.created_by WHERE b.papka_order_id = ${String(sid)} ORDER BY b.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT b.*, u.username AS reported_by_name FROM qc_braks b LEFT JOIN users u ON u.id = b.created_by ORDER BY b.created_at DESC LIMIT ${lim} OFFSET ${off}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBrakStats(from?: string, to?: string): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(*)::int AS total_braks, COALESCE(SUM(quantity), 0)::int AS total_quantity, COUNT(*) FILTER (WHERE reworked = true)::int AS reworked, COUNT(*) FILTER (WHERE is_reworkable = false)::int AS scrapped FROM qc_braks WHERE (${from ?? null}::date IS NULL OR created_at::date >= ${from ?? null}::date) AND (${to ?? null}::date IS NULL OR created_at::date <= ${to ?? null}::date)`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBrakCostImpact(papkaOrderId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT b.*, b.cost_impact FROM qc_braks b WHERE b.papka_order_id = ${String(papkaOrderId)} ORDER BY b.created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createBrak(session_id: number | null, material_id: number | null, quantity: number, reason: string | null, root_cause_id: number | null, reported_by: number | null, papka_order_id: number | null): Promise<Result<Row>>  {
  try {  
      const brak_date = new Date().toISOString().slice(0, 10);
      const r = await exec(sql`INSERT INTO qc_braks (papka_order_id, quantity, reason, created_by, brak_date, stage) VALUES (${papka_order_id !== null ? String(papka_order_id) : null}, ${quantity}, ${reason ?? 'other'}, ${reported_by ?? null}, ${brak_date}, 'production') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listSupplierQuality(vid: number | null, lim: number): Promise<Result<Row[]>>  {
  try {  
      return vid !== null
        ? exec(sql`SELECT sq.* FROM qc_supplier_quality sq WHERE sq.supplier_id = ${String(vid)} ORDER BY sq.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT sq.* FROM qc_supplier_quality sq ORDER BY sq.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createSupplierQuality(vendor_id: number, receipt_id: number | null, material_id: number | null, batch_number: string | null, sample_size: number, defects_found: number, notes: string | null, status: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO qc_supplier_quality (supplier_id, material_card_id, total_quantity, rejected_quantity, notes, delivery_date) VALUES (${String(vendor_id)}, ${material_id ? String(material_id) : null}, ${sample_size}, ${defects_found}, ${notes ?? null}, NOW()::date::text) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDashboardStats(from?: string, to?: string): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(DISTINCT fi.id) FILTER (WHERE fi.result = 'passed')::int AS passed_inspections, COUNT(DISTINCT fi.id) FILTER (WHERE fi.result = 'failed')::int AS failed_inspections, (SELECT COUNT(*) FROM qc_defects WHERE status != 'resolved')::int AS open_defects, (SELECT COALESCE(SUM(quantity), 0) FROM qc_braks WHERE (${from ?? null}::date IS NULL OR created_at::date >= ${from ?? null}::date) AND (${to ?? null}::date IS NULL OR created_at::date <= ${to ?? null}::date))::int AS total_scrap FROM qc_final_inspections fi WHERE (${from ?? null}::date IS NULL OR fi.inspected_at::date >= ${from ?? null}::date) AND (${to ?? null}::date IS NULL OR fi.inspected_at::date <= ${to ?? null}::date)`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDashboardFlow(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT fi.result AS status, COUNT(*)::int AS count FROM qc_final_inspections fi WHERE fi.inspected_at >= NOW() - INTERVAL '30 days' GROUP BY fi.result`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listApprovals(type?: string, status?: string): Promise<Result<Row[]>>  {
  try {  
      const conds: SQL[] = [];
      if (type) conds.push(sql`type = ${type}`);
      if (status) conds.push(sql`status = ${status}`);
      return exec(conds.length > 0
        ? sql`SELECT * FROM qc_approvals WHERE ${sql.join(conds, sql` AND `)} ORDER BY created_at DESC LIMIT 100`
        : sql`SELECT * FROM qc_approvals ORDER BY created_at DESC LIMIT 100`
      );  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createApproval(type: string, reference_id: number, approver_id: number | null, notes: string | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO qc_approvals (type, reference_id, approver_id, notes, status) VALUES (${type}, ${reference_id}, ${approver_id ?? null}, ${notes ?? null}, 'pending') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateApproval(id: number, status: string, notes: string | null): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`UPDATE qc_approvals SET status = ${status}, notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateReclamation(id: number, status: string | null, resolution: string | null, root_cause_id: number | null): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`UPDATE qc_reclamations SET status = COALESCE(${status ?? null}, status), resolution = COALESCE(${resolution ?? null}, resolution), root_cause_id = COALESCE(${root_cause_id ?? null}, root_cause_id), updated_at = NOW() WHERE id = ${id} RETURNING *`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
