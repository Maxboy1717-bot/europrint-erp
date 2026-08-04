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

/**
 * QC-birlashtirish (2026-07-02, APPROVED egasi): POST /qc/braks endi ReportDefectCommand
 * CQRS oqimi orqali qc_defects jadvaliga yozadi (createBrak bu faylda o'chirildi — pastga
 * qarang). Legacy qc_braks yozuvlari saqlanadi (Q-39/Q-46 — DROP TABLE yo'q), shuning uchun
 * barcha o'quvchi so'rovlar ikkala manbani ham UNION ALL bilan birlashtiradi, aks holda yangi
 * braklar (endi qc_defects'ga yoziladigan) dashboard/ro'yxatlarda ko'rinmay qoladi.
 *
 * Discovery sweep 2026-08-03 fix ("QC natijalari HR karta/GSD/razryadga avtomatik oqmaydi",
 * vision 09-qc.md #25 "Kirim braki (oldingi bosqich) avto smena+operator karta bog'lash"):
 * neither qc_braks (operator_id = a plain, unenforced employee id — no card link) nor
 * qc_defects (no operator column at all — ReportDefectCommand never captured who ran the
 * upstream production stage) exposed which KARTA/shift produced the now-defective material.
 * `production_sessions` already tracks exactly that (`operator_card_id` FK -> org_departments,
 * `shift_id`) per order — see MES module. A LEFT JOIN LATERAL resolves the nearest session for
 * the same papka_order_id (closest by time to the defect's own timestamp, matching the
 * inspector_card_id COALESCE-resolve convention in drizzle-inspection.repo.ts: read-time
 * resolution, no new column/table, Q-46 no reimplementation). This closes the auto
 * shift+operator-card linking half of the vision item.
 *
 * NOT built here (Q-40 fabrication ban, Q-34 owner-gated): the "GSD salbiy faqat inson (E1),
 * oylik siklda" half — a human-confirmed, monthly-cycle negative-GSD-entry workflow. That
 * needs the operation-type weighting formula (vision 09-qc.md #31, confirmed fully absent —
 * no owner-supplied weight values exist anywhere) and an owner decision on who the "inson"
 * approver is and the monthly cutoff mechanics. HR already has a human-entry path for this
 * (HrGsdService.recordGsdActual -> ckp_fact_values) — this fix makes the responsible card
 * visible on every defect record so that manual entry is now informed by real QC data instead
 * of requiring HR to reconstruct it by hand.
 */
const BRAK_UNION_SQL = sql`(
  SELECT b.id, b.papka_order_id, b.brak_date, b.stage, b.quantity::numeric AS quantity, b.unit, b.reason, b.description,
         b.equipment_id, b.operator_id, b.cost_impact, b.is_reworkable, b.reworked, b.created_by, b.created_at::timestamptz AS created_at,
         b.production_order_id, b.material_id, b.status,
         resp.operator_card_id AS responsible_operator_card_id, resp.shift_id AS responsible_shift_id
  FROM qc_braks b
  LEFT JOIN LATERAL (
    SELECT ps.operator_card_id, ps.shift_id
    FROM production_sessions ps
    WHERE ps.production_order_id = b.papka_order_id AND ps.deleted_at IS NULL
    ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(ps.ended_at, ps.started_at, now()) - COALESCE(b.created_at, now()))))
    LIMIT 1
  ) resp ON true
  UNION ALL
  SELECT d.id, d.papka_order_id, d.brak_date::text AS brak_date, d.stage, d.quantity::numeric AS quantity, d.unit, d.defect_code AS reason, d.description,
         NULL::integer AS equipment_id, NULL::integer AS operator_id, d.cost_impact, d.is_reworkable, d.reworked,
         CASE WHEN d.reported_by ~ '^[0-9]+$' THEN d.reported_by::integer ELSE NULL END AS created_by,
         d.created_at::timestamptz AS created_at, NULL::integer AS production_order_id, NULL::integer AS material_id, d.status,
         resp.operator_card_id AS responsible_operator_card_id, resp.shift_id AS responsible_shift_id
  FROM qc_defects d
  LEFT JOIN LATERAL (
    SELECT ps.operator_card_id, ps.shift_id
    FROM production_sessions ps
    WHERE ps.production_order_id = d.papka_order_id AND ps.deleted_at IS NULL
    ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(ps.ended_at, ps.started_at, now()) - COALESCE(d.created_at, now()))))
    LIMIT 1
  ) resp ON true
  WHERE d.papka_order_id IS NOT NULL OR d.brak_date IS NOT NULL OR d.stage IS NOT NULL
)`;

@Injectable()
export class QcDefectsExtendedRepository implements IQcDefectsExtendedRepo {
  async listBraks(sid: number | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      return sid !== null
        ? exec(sql`SELECT b.*, u.username AS reported_by_name FROM ${BRAK_UNION_SQL} b LEFT JOIN users u ON u.id = b.created_by WHERE b.papka_order_id = ${String(sid)} ORDER BY b.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT b.*, u.username AS reported_by_name FROM ${BRAK_UNION_SQL} b LEFT JOIN users u ON u.id = b.created_by ORDER BY b.created_at DESC LIMIT ${lim} OFFSET ${off}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBrakStats(from?: string, to?: string): Promise<Result<Row>>  {
  try {
      const rows = await exec(sql`SELECT COUNT(*)::int AS total_braks, COALESCE(SUM(quantity), 0)::int AS total_quantity, COUNT(*) FILTER (WHERE reworked = true)::int AS reworked, COUNT(*) FILTER (WHERE is_reworkable = false)::int AS scrapped FROM ${BRAK_UNION_SQL} b WHERE (${from ?? null}::date IS NULL OR b.created_at::date >= ${from ?? null}::date) AND (${to ?? null}::date IS NULL OR b.created_at::date <= ${to ?? null}::date)`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBrakCostImpact(papkaOrderId: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT b.*, b.cost_impact FROM ${BRAK_UNION_SQL} b WHERE b.papka_order_id = ${String(papkaOrderId)} ORDER BY b.created_at DESC`);  } catch (_e) {
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

      // qc_braks ∪ qc_defects(brak) → braks KPI
      const rBraks = await exec(sql`SELECT
        COUNT(*)::int                              AS count,
        COALESCE(SUM(b.quantity), 0)::int          AS total_qty,
        COALESCE(SUM(b.cost_impact), 0)::numeric   AS total_cost_impact
      FROM ${BRAK_UNION_SQL} b
      WHERE (${from ?? null}::date IS NULL OR b.created_at::date >= ${from ?? null}::date)
        AND (${to   ?? null}::date IS NULL OR b.created_at::date <= ${to   ?? null}::date)`);
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

}
