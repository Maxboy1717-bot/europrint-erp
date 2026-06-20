/**
 * @module qc-defects-extended.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (QC)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { IQcDefectsExtendedRepo } from '../../domain/repositories/i-qc-defects-extended.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class QcDefectsExtendedRepository implements IQcDefectsExtendedRepo {
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

  async createBrak(_session_id: number | null, _material_id: number | null, quantity: number, reason: string | null, _root_cause_id: number | null, reported_by: number | null, papka_order_id: number | null, brak_date: string | null, stage: string | null, description: string | null): Promise<Result<Row>>  {
  try {
      const effectiveBrakDate = brak_date ?? new Date().toISOString().slice(0, 10);
      const effectiveStage = stage ?? 'production';
      const r = await exec(sql`INSERT INTO qc_braks (papka_order_id, quantity, reason, created_by, brak_date, stage, description) VALUES (${papka_order_id !== null ? String(papka_order_id) : null}, ${quantity}, ${reason ?? 'other'}, ${reported_by ?? null}, ${effectiveBrakDate}, ${effectiveStage}, ${description ?? null}) RETURNING *`);
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

  async createSupplierQuality(vendor_id: number | null, supplier_name: string, _receipt_id: number | null, material_id: number | null, _batch_number: string | null, sample_size: number, defects_found: number, quality_score: number | null, notes: string | null, _status: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO qc_supplier_quality (supplier_id, supplier_name, material_id, total_quantity, rejected_quantity, quality_score, notes, delivery_date, sample_size, defects_found, status) VALUES (${vendor_id ?? null}, ${supplier_name}, ${material_id ?? null}, ${sample_size}, ${defects_found}, ${quality_score ?? null}, ${notes ?? null}, NOW()::date::text, ${sample_size}, ${defects_found}, ${_status ?? 'pending'}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDashboardStats(from?: string, to?: string): Promise<Result<Row>>  {
  try {
      // qc_inspections → tests KPI
      const rTests = await exec(sql`SELECT
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE result = 'passed')::int            AS passed,
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE result = 'passed') / COUNT(*))
        END::int                                                   AS pass_rate
      FROM qc_inspections
      WHERE (${from ?? null}::date IS NULL OR created_at::date >= ${from ?? null}::date)
        AND (${to   ?? null}::date IS NULL OR created_at::date <= ${to   ?? null}::date)`);
      if (!rTests.ok) return Err(rTests.error);
      const tests = rTests.data[0] ?? {};

      // qc_braks → braks KPI
      const rBraks = await exec(sql`SELECT
        COUNT(*)::int                              AS count,
        COALESCE(SUM(quantity), 0)::int            AS total_qty,
        COALESCE(SUM(cost_impact), 0)::numeric     AS total_cost_impact
      FROM qc_braks
      WHERE (${from ?? null}::date IS NULL OR created_at::date >= ${from ?? null}::date)
        AND (${to   ?? null}::date IS NULL OR created_at::date <= ${to   ?? null}::date)`);
      if (!rBraks.ok) return Err(rBraks.error);
      const braksRow = rBraks.data[0] ?? {};

      // qc_reclamations → reclamations KPI (status field is 'resolved' for closed)
      const rRec = await exec(sql`SELECT
        COUNT(*)::int                                        AS total,
        COUNT(*) FILTER (WHERE status != 'resolved')::int   AS open
      FROM qc_reclamations`);
      if (!rRec.ok) return Err(rRec.error);
      const recRow = rRec.data[0] ?? {};

      // qc_supplier_quality → distinct supplier count
      const rSup = await exec(sql`SELECT COUNT(DISTINCT COALESCE(supplier_id, vendor_id))::int AS suppliers FROM qc_supplier_quality`);
      if (!rSup.ok) return Err(rSup.error);
      const supRow = rSup.data[0] ?? {};

      // qc_final_inspections → total count
      const rFinal = await exec(sql`SELECT COUNT(*)::int AS final_inspections FROM qc_final_inspections`);
      if (!rFinal.ok) return Err(rFinal.error);
      const finalRow = rFinal.data[0] ?? {};

      // open RCA = open reclamations without resolution (same as open reclamations)
      const openRca = Number(recRow['open'] ?? 0);

      const shaped: Row = {
        tests: {
          total:    Number(tests['total']     ?? 0),
          passed:   Number(tests['passed']    ?? 0),
          passRate: Number(tests['pass_rate'] ?? 0),
        },
        braks: {
          count:           Number(braksRow['count']             ?? 0),
          totalQty:        Number(braksRow['total_qty']         ?? 0),
          totalCostImpact: Number(braksRow['total_cost_impact'] ?? 0),
        },
        reclamations: {
          total: Number(recRow['total'] ?? 0),
          open:  Number(recRow['open']  ?? 0),
        },
        suppliers:        Number(supRow['suppliers']        ?? 0),
        finalInspections: Number(finalRow['final_inspections'] ?? 0),
        openRca,
      };
      return Ok(shaped);
  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDashboardFlow(): Promise<Result<Row>>  {
  try {
      // 4 parallel queries — one per QC flow stream
      const [rIncoming, rInline, rFinal, rRec] = await Promise.all([
        // a) incoming: qc_supplier_quality — total entries + low-quality count (score < 70)
        exec(sql`
          SELECT
            COUNT(*)::int                                           AS total,
            COUNT(*) FILTER (WHERE quality_score < 70)::int        AS low_quality
          FROM qc_supplier_quality
        `),
        // b) inline: qc_in_process_inspections — active (not closed) inspections
        exec(sql`
          SELECT
            COUNT(*) FILTER (WHERE status IS DISTINCT FROM 'closed')::int AS in_production
          FROM qc_in_process_inspections
        `),
        // c) finalInspection: qc_final_inspections — pending + GROUP BY result
        exec(sql`
          SELECT
            COUNT(*) FILTER (WHERE result IS NULL OR status = 'pending')::int AS pending_orders,
            COUNT(*) FILTER (WHERE result = 'passed')::int                    AS cnt_passed,
            COUNT(*) FILTER (WHERE result = 'conditional_pass')::int          AS cnt_conditional_pass,
            COUNT(*) FILTER (WHERE result = 'rework_required')::int           AS cnt_rework_required,
            COUNT(*) FILTER (WHERE result = 'failed')::int                    AS cnt_failed
          FROM qc_final_inspections
        `),
        // d) reclamation: qc_reclamations — open (new) + investigating
        exec(sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'new')::int            AS open,
            COUNT(*) FILTER (WHERE status = 'investigating')::int  AS investigating
          FROM qc_reclamations
        `),
      ]);

      if (!rIncoming.ok) return Err(rIncoming.error);
      if (!rInline.ok)   return Err(rInline.error);
      if (!rFinal.ok)    return Err(rFinal.error);
      if (!rRec.ok)      return Err(rRec.error);

      const inc  = rIncoming.data[0] ?? {};
      const inl  = rInline.data[0]   ?? {};
      const fin  = rFinal.data[0]    ?? {};
      const rec  = rRec.data[0]      ?? {};

      const totalIncoming  = Number(inc['total']        ?? 0);
      const lowQuality     = Number(inc['low_quality']  ?? 0);
      const inProduction   = Number(inl['in_production'] ?? 0);
      const pendingOrders  = Number(fin['pending_orders'] ?? 0);
      const recOpen        = Number(rec['open']          ?? 0);
      const recInvest      = Number(rec['investigating'] ?? 0);

      const shaped: Row = {
        streams: {
          incoming: {
            total:      totalIncoming,
            lowQuality: lowQuality,
            status:     lowQuality > 0 ? 'warning' : 'ok',
          },
          inline: {
            inProduction: inProduction,
            status:       inProduction > 0 ? 'active' : 'ok',
          },
          finalInspection: {
            pendingOrders: pendingOrders,
            resultCounts: {
              passed:           Number(fin['cnt_passed']           ?? 0),
              conditional_pass: Number(fin['cnt_conditional_pass'] ?? 0),
              rework_required:  Number(fin['cnt_rework_required']  ?? 0),
              failed:           Number(fin['cnt_failed']           ?? 0),
            },
            status: pendingOrders > 0 ? 'needs_attention' : 'ok',
          },
          reclamation: {
            open:         recOpen,
            investigating: recInvest,
            status:       recOpen > 0 ? 'needs_attention' : 'ok',
          },
        },
        rca: { open: recOpen },
      };

      return Ok(shaped);
  } catch (_e) {
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
