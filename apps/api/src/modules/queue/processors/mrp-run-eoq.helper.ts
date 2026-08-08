/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   SUM(ABS(quantity)) * (52.0 / GREATEST(COUNT(DISTINCT DATE_TRUNC('week', ...)))
 *   demand-velocity calc with distinct-week normalisation, CASE expression in
 *   SELECT for ABC-tier holding-cost percent, regex predicate ~ '^[0-9]+$' to
 *   filter integer-coerceable text product_id, INSERT ... ON CONFLICT DO UPDATE
 *   with EXCLUDED-column references for recommendation upsert, and EXTRACT(DAY
 *   FROM (actual_delivery_date - created_at))::numeric lead-time series queries.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * mrp-run-eoq.helper.ts — TZ-02: EOQ recalc helper (extracted from processor).
 */
import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { getConfigNumber } from '@common/config/business-config.helper';
import { EoqCalculatorService } from '../../wms/domain/services/eoq-calculator.service';
import type { PriceTier } from '../../wms/domain/services/eoq-calculator.service';

export async function runEoqRecalcAll(eoqSvc: EoqCalculatorService, logger: Logger): Promise<void> {
  // MN-3 (Magic-Numbers Independent Verification 2026-07-07, M9 config-schema gap):
  // this ABC-tiered scheme is intentionally NOT consolidated with eoq.constants.ts's flat
  // 150_000/0.20 (see that file's header comment) -- it's a distinct, more granular
  // methodology (per-segment holding cost), not a drifted duplicate. Both schemes are now
  // independently settings-table-tunable; reconciling which should be canonical remains a
  // real design decision for the owner, not something this pass decides.
  const orderingCost = await getConfigNumber('mrp_eoq_ordering_cost_uzs', 50_000);
  const holdingCostA = await getConfigNumber('mrp_eoq_holding_cost_pct_a', 0.20);
  const holdingCostB = await getConfigNumber('mrp_eoq_holding_cost_pct_b', 0.25);
  const holdingCostC = await getConfigNumber('mrp_eoq_holding_cost_pct_c', 0.30);

  // Uses only existing material_cards columns (no annual_demand/ordering_cost_uzs/holding_cost_percent).
  // Annual demand is derived from pos_inventory_movements (52-week look-back), falling back
  // to current_stock×12 when no movement data exists.
  const demandRows = await runQuery(sql`
    SELECT product_id::integer AS material_id,
           SUM(ABS(quantity))::numeric
             * (52.0 / GREATEST(COUNT(DISTINCT DATE_TRUNC('week', created_at)), 1)) AS annual_demand
    FROM pos_inventory_movements
    WHERE product_id ~ '^[0-9]+$'
      AND type IN ('OUT','ISSUE','CONSUMPTION','out','issue','consumption')
      AND created_at >= NOW() - INTERVAL '52 weeks'
    GROUP BY product_id::integer
  `).catch(() => ({ rows: [] as Record<string, unknown>[] }));

  const demandByMaterial = new Map<number, number>();
  for (const d of demandRows.rows ?? []) {
    demandByMaterial.set(Number(d['material_id']), Number(d['annual_demand']) || 0);
  }

  const matRows = await runQuery(sql`
    SELECT mc.id AS material_id,
           GREATEST(COALESCE(mc.current_stock, 0) * 12, 100)::numeric AS stock_based_demand,
           ${orderingCost}::numeric AS ordering_cost,
           CASE COALESCE(mc.abc_segment, 'C')
             WHEN 'A' THEN ${holdingCostA}::numeric
             WHEN 'B' THEN ${holdingCostB}::numeric
             ELSE ${holdingCostC}::numeric
           END AS holding_cost_pct,
           COALESCE(mc.last_purchase_price, mc.unit_price, 1000)::numeric AS unit_price,
           COALESCE(ip.lead_time_days, 7)::integer AS lead_time_days
    FROM material_cards mc
    LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
    WHERE mc.is_active = true
    LIMIT 2000
  `);

  const tierRows = await runQuery(sql`
    SELECT supplier_id::text AS supplier_id,
           material_id,
           COALESCE(min_qty, 0)::numeric AS min_qty,
           max_qty::numeric AS max_qty,
           unit_price::numeric AS unit_price
    FROM supplier_price_tiers
    ORDER BY material_id, min_qty
  `).catch((e: Error) => {
    logger.warn(`supplier_price_tiers query failed, proceeding without discount tiers: ${e.message}`);
    return { rows: [] };
  });

  const tiersByMaterial = new Map<number, PriceTier[]>();
  for (const tr of tierRows.rows ?? []) {
    const matId = Number(tr['material_id']);
    let bucket = tiersByMaterial.get(matId);
    if (!bucket) {
      bucket = [];
      tiersByMaterial.set(matId, bucket);
    }
    bucket.push({
      minQty: Number(tr['min_qty']) || 0,
      maxQty: tr['max_qty'] != null ? Number(tr['max_qty']) : undefined,
      unitPrice: Number(tr['unit_price']) || 0,
    });
  }

  let updated = 0;
  for (const r of matRows.rows ?? []) {
    const matId = Number(r['material_id']);
    const movementDemand = demandByMaterial.get(matId) ?? 0;
    const stockDemand = Number(r['stock_based_demand']) || 100;
    const D = movementDemand > 0 ? movementDemand : stockDemand;
    const S = Number(r['ordering_cost']) || 50000;
    const I = Number(r['holding_cost_pct']) || 0.25;
    const defaultPrice = Number(r['unit_price']) || 1000;

    const tiers: PriceTier[] = tiersByMaterial.get(matId) ?? [
      { minQty: 0, unitPrice: defaultPrice },
    ];

    const eoqResult = eoqSvc.calculateWithDiscounts({
      annualDemand: D,
      orderingCostUzs: S,
      holdingCostPercent: I,
      priceTiers: tiers,
    });

    if (!eoqResult.ok) {
      logger.warn(`[eoq-recalc] material_id=${matId}: ${eoqResult.error.message}`);
      continue;
    }

    const { eoqRounded, totalCost, orderFrequency, cycleTimeDays } = eoqResult.data;

    await runQuery(sql`
      INSERT INTO material_recommendation
        (material_id, eoq_qty, total_cost, order_frequency, cycle_time_days, calculated_at, lot_sizing_method, recommendation_type)
      VALUES
        (${matId}, ${eoqRounded}, ${totalCost}, ${orderFrequency}, ${cycleTimeDays}, NOW(), 'EOQ', 'EOQ')
      ON CONFLICT (material_id) DO UPDATE SET
        eoq_qty = EXCLUDED.eoq_qty,
        total_cost = EXCLUDED.total_cost,
        order_frequency = EXCLUDED.order_frequency,
        cycle_time_days = EXCLUDED.cycle_time_days,
        calculated_at = NOW(),
        lot_sizing_method = 'EOQ'
    `);

    await runQuery(sql`
      INSERT INTO inventory_policy (material_id, eoq, updated_at)
      VALUES (${matId}, ${eoqRounded}, NOW())
      ON CONFLICT (material_id) DO UPDATE SET
        eoq = EXCLUDED.eoq,
        updated_at = NOW()
    `);

    updated++;
  }

  logger.log(`[eoq-recalc] ${updated} material yangilandi`);
}
