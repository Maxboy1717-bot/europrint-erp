/**
 * @module qc-dispatch-conclusion.repository
 * @description Repository / data-access layer. Wraps Drizzle raw parametrised SQL; returns Result<T>.
 * Vision 09-qc #26 — yakuniy sifat xulosasi (per-dispatch + yakuniy, N+1). Repo owns DB (Qoida 15).
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';

type Row = Record<string, unknown>;

export interface QcOrderAggregate {
  inspectionCount: number;
  totalInspected: number;
  totalPassed: number;
  totalDefects: number;
}

export interface InsertConclusionInput {
  productionOrderId: number;
  deliveryId: number | null;
  conclusionType: 'dispatch' | 'final';
  totalInspected: number;
  totalPassed: number;
  totalDefects: number;
  defectRate: number | null;
  verdict: string;
  summary: unknown;
  concludedBy: number | null;
}

@Injectable()
export class QcDispatchConclusionRepository {
  /**
   * Aggregate the QC inspection results recorded for one production order
   * (golden-thread inspections: qc_inspections.order_id + reference_type='production_order').
   * items_checked / items_passed / items_failed are live-verified columns not present in the
   * reachable Drizzle barrel, so parametrised raw SQL is used per this module's established pattern.
   */
  async aggregateOrderQc(productionOrderId: number): Promise<Result<QcOrderAggregate>> {
    try {
      const r = await db.execute(sql`
        SELECT
          COUNT(*)::int                        AS inspection_count,
          COALESCE(SUM(items_checked), 0)::int AS total_inspected,
          COALESCE(SUM(items_passed), 0)::int  AS total_passed,
          COALESCE(SUM(items_failed), 0)::int  AS total_defects
        FROM qc_inspections
        WHERE order_id = ${productionOrderId}
          AND reference_type = 'production_order'
      `);
      const row = (((r as { rows?: Row[] }).rows) ?? [])[0] ?? {};
      return Ok({
        inspectionCount: Number(row['inspection_count'] ?? 0),
        totalInspected: Number(row['total_inspected'] ?? 0),
        totalPassed: Number(row['total_passed'] ?? 0),
        totalDefects: Number(row['total_defects'] ?? 0),
      });
    } catch (e) {
      return Err(AppErr('DB_ERROR', `QC agregatsiya oqishda xato: ${String(e)}`));
    }
  }

  /**
   * Insert one conclusion row. The DB partial-unique indexes enforce the N+1 shape:
   *   - at most one 'final' (delivery_id IS NULL) per production order,
   *   - at most one conclusion per (production_order_id, delivery_id).
   * A 23505 unique violation therefore means the conclusion already exists → CONFLICT.
   */
  async insertConclusion(data: InsertConclusionInput): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        INSERT INTO qc_dispatch_conclusions
          (production_order_id, delivery_id, conclusion_type,
           total_inspected, total_passed, total_defects, defect_rate, verdict, summary, concluded_by)
        VALUES
          (${data.productionOrderId}, ${data.deliveryId}, ${data.conclusionType},
           ${data.totalInspected}, ${data.totalPassed}, ${data.totalDefects},
           ${data.defectRate}, ${data.verdict},
           ${JSON.stringify(data.summary ?? {})}::jsonb, ${data.concludedBy})
        RETURNING id, production_order_id, delivery_id, conclusion_type, total_inspected,
                  total_passed, total_defects, defect_rate, verdict, summary, concluded_by,
                  concluded_at, created_at
      `);
      const row = (((r as { rows?: Row[] }).rows) ?? [])[0];
      if (!row) return Err(AppErr('DB_ERROR', "Xulosa yozib bo'lmadi"));
      return Ok(row);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === '23505') {
        return Err(AppErr('CONFLICT', data.conclusionType === 'final'
          ? `Buyurtma ${data.productionOrderId} uchun yakuniy xulosa allaqachon mavjud`
          : `Buyurtma ${data.productionOrderId} / dispatch ${String(data.deliveryId)} uchun xulosa allaqachon mavjud`));
      }
      if (code === '23514') return Err(AppErr('VALIDATION', 'conclusion_type va delivery_id mos kelmaydi'));
      if (code === '23503') return Err(AppErr('NOT_FOUND', 'production_order yoki delivery topilmadi'));
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  /** All conclusions for one production order (N dispatch rows + the final, final last). */
  async findByProductionOrder(productionOrderId: number): Promise<Result<Row[]>> {
    try {
      const r = await db.execute(sql`
        SELECT id, production_order_id, delivery_id, conclusion_type, total_inspected,
               total_passed, total_defects, defect_rate, verdict, summary, concluded_by,
               concluded_at, created_at
        FROM qc_dispatch_conclusions
        WHERE production_order_id = ${productionOrderId}
        ORDER BY delivery_id NULLS LAST, id
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return Ok(rows);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
