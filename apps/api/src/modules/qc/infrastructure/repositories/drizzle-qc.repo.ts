/**
 * @module drizzle-qc.repo
 * @description Drizzle implementation of `IQcComputeRepository` — the
 *   data-access surface for QC compute services (SPC, DPMO, spoilage,
 *   ink consumption, imposition). Keeps the domain layer DB-free.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, qc_spc_data, rawSql, runQuery } from '@shared/db';
import { eq, desc, sql } from 'drizzle-orm';
import { safeNum } from '@common/math/math-utils';
import {
  IQcComputeRepository,
  SpcReading,
  ProcessDpmoData,
  JobSpoilageRow,
  JobCostRow,
  InkInventoryRow,
  ImpositionLayoutInsert,
} from '../../domain/repositories/i-qc.repo';

@Injectable()
export class DrizzleQcComputeRepository implements IQcComputeRepository {
  private readonly logger = new Logger(DrizzleQcComputeRepository.name);

  async findSpcReadings(parameterId: number, lastN: number): Promise<SpcReading[]> {
    const rows = await db
      .select({ value: qc_spc_data.value, measuredAt: qc_spc_data.measuredAt })
      .from(qc_spc_data)
      .where(eq(qc_spc_data.parameterId, parameterId))
      .orderBy(desc(qc_spc_data.measuredAt))
      .limit(lastN);

    return (rows as { value: string | number; measuredAt: Date | string }[]).map(r => ({
      value:      safeNum(r.value),
      measuredAt: r.measuredAt,
    }));
  }

  async findProcessDpmoData(processId: string): Promise<ProcessDpmoData> {
    // GOLDEN-THREAD FIX (2026-06-22): real qc_inspections rows link to the production
    // order via the INTEGER `order_id` column (writers — mes-completed.listener,
    // create-inspection.handler — set order_id and leave the uuid `reference_id` NULL
    // to avoid an int→uuid cast error). The previous filter
    // `reference_id::text = processId AND reference_type = 'production_order'` therefore
    // matched ZERO real rows, so this returned the empty fallback (defects=0, checked=1)
    // for every real production order — a silent Q-40 fail. Match on order_id (the column
    // real rows actually use); keep backward-compat with reference_id when present. Both
    // columns are cast to text so a uuid-shaped processId can't crash the order_id branch
    // with "invalid input syntax for integer".
    const rows = await runQuery<{ defects: number; items_checked: number }>(sql`
      SELECT
        COALESCE(SUM(i.items_failed), 0)::int AS defects,
        COALESCE(SUM(i.items_checked), 1)::int AS items_checked
      FROM qc_inspections i
      WHERE i.order_id::text = ${processId}
         OR i.reference_id::text = ${processId}
    `);
    return {
      defects:      safeNum(rows[0]?.defects ?? 0),
      itemsChecked: Math.max(safeNum(rows[0]?.items_checked ?? 1), 1),
    };
  }

  async findJobSpoilageRow(jobId: string): Promise<JobSpoilageRow> {
    // GOLDEN-THREAD FIX (2026-06-22): same mismatch as findProcessDpmoData — real rows link
    // the job via the INTEGER `order_id` (reference_id uuid is left NULL by every writer),
    // so the old `reference_id::text = jobId AND reference_type IN (...)` filter matched zero
    // real rows and spoilage was silently empty. Match on order_id (the column real rows use);
    // keep backward-compat with reference_id when present. Both cast to text so a uuid-shaped
    // jobId can't crash the order_id branch.
    const rows = await runQuery<{ defective_sheets: number; total_sheets: number }>(sql`
      SELECT
        COALESCE(SUM(i.items_failed), 0)::int  AS defective_sheets,
        COALESCE(SUM(i.items_checked), 1)::int AS total_sheets
      FROM qc_inspections i
      WHERE i.order_id::text = ${jobId}
         OR i.reference_id::text = ${jobId}
    `);
    const row = rows[0] ?? { defective_sheets: 0, total_sheets: 1 };
    return {
      defectiveSheets: safeNum(row.defective_sheets),
      totalSheets:     Math.max(safeNum(row.total_sheets), 1),
    };
  }

  async findJobCostRow(jobId: string): Promise<JobCostRow | null> {
    /* Defensive: columns may differ across deployments. Graceful degradation
       on schema mismatch — service falls back to 0 / default print type. */
    try {
      const rows = await runQuery<{ unit_cost: number; product_name: string | null }>(sql`
        SELECT
          COALESCE(
            NULLIF(po.actual_cost,  0),
            NULLIF(po.planned_cost, 0),
            0
          ) / GREATEST(COALESCE(po.confirmed_quantity, po.planned_quantity, 1), 1) AS unit_cost,
          mc.xom_ashyo AS product_name
        FROM production_orders po
        LEFT JOIN material_cards mc ON mc.id = po.product_id
        WHERE po.order_number = ${jobId} OR po.id::text = ${jobId}
        LIMIT 1
      `);
      if (!rows[0]) return null;
      return {
        unitCost:    safeNum(rows[0].unit_cost ?? 0),
        productName: rows[0].product_name ?? '',
      };
    } catch (e) {
      this.logger.warn(`findJobCostRow soft-fail for jobId=${jobId}: ${String(e)}`);
      return null;
    }
  }

  async findInkInventory(): Promise<InkInventoryRow[]> {
    type MaterialRow = { channel: string; quantity_grams: number };
    const rows = await runQuery<MaterialRow>(sql`
      SELECT
        CASE
          WHEN LOWER(material_code) LIKE 'ink_c%' OR LOWER(name) LIKE '%cyan%'    THEN 'c'
          WHEN LOWER(material_code) LIKE 'ink_m%' OR LOWER(name) LIKE '%magenta%' THEN 'm'
          WHEN LOWER(material_code) LIKE 'ink_y%' OR LOWER(name) LIKE '%yellow%'  THEN 'y'
          WHEN LOWER(material_code) LIKE 'ink_k%' OR LOWER(name) LIKE '%black%'   THEN 'k'
        END AS channel,
        COALESCE(SUM(wm.quantity * 1000), 0)::numeric AS quantity_grams
      FROM warehouse_materials wm
      WHERE wm.unit IN ('kg','litre','l')
        AND (
          LOWER(wm.material_code) LIKE 'ink_%'
          OR LOWER(wm.name) LIKE '%ink%'
          OR LOWER(wm.name) LIKE '%siyoh%'
        )
      GROUP BY 1
    `).catch(() => [] as MaterialRow[]);

    return rows.map(r => ({
      channel:       r.channel ?? '',
      quantityGrams: safeNum(r.quantity_grams),
    }));
  }

  async saveImpositionLayout(layout: ImpositionLayoutInsert): Promise<void> {
    await rawSql(sql`
      INSERT INTO imposition_layouts
        (sheet_width, sheet_height, product_count, sheet_count, utilization,
         placed_count, unplaced_count, layout_json)
      VALUES
        (${layout.sheetWidth}, ${layout.sheetHeight}, ${layout.productCount},
         ${layout.sheetCount}, ${layout.utilization},
         ${layout.placedCount}, ${layout.unplacedCount},
         ${layout.layoutJson}::jsonb)
    `);
  }
}
