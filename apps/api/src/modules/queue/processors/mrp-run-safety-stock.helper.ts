/**
 * NOTE: Raw SQL retained intentionally — see mrp-run-eoq.helper.ts notes.
 */
/**
 * mrp-run-safety-stock.helper.ts — TZ-04: Safety Stock refresh helper.
 */
import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { SafetyStockService } from '../../wms/domain/services/safety-stock.service';
import type { AbcClass } from '../../wms/domain/services/safety-stock.service';

export async function runSafetyStockRefresh(ssSvc: SafetyStockService, logger: Logger): Promise<void> {
  const matRows = await runQuery(sql`
    SELECT mc.id AS material_id,
           COALESCE(ip.abc_class, 'C') AS abc_class,
           COALESCE(ip.lead_time_days, 7)::integer AS lead_time_days
    FROM material_cards mc
    LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
    WHERE mc.is_active = true
    LIMIT 2000
  `);

  let updated = 0;
  for (const r of matRows.rows ?? []) {
    const matId = Number(r['material_id']);
    const abcClass = (String(r['abc_class'] ?? 'C').toUpperCase().slice(0, 1)) as AbcClass;
    const leadTimeDays = Number(r['lead_time_days']) || 7;

    // 365-day daily-demand basis from goods movements (spec requirement)
    const demandRows = await runQuery(sql`
      SELECT COALESCE(SUM(ABS(quantity)), 0)::numeric AS daily_demand
      FROM pos_inventory_movements
      WHERE product_id ~ '^[0-9]+$'
        AND product_id::integer = ${matId}
        AND type IN ('OUT', 'ISSUE', 'CONSUMPTION', 'out', 'issue', 'consumption')
        AND created_at >= NOW() - INTERVAL '1 year'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
      LIMIT 365
    `).catch((e: Error) => {
      logger.warn(`Demand history query failed for material ${matId}: ${e.message}`);
      return { rows: [] };
    });

    const dailyDemands = (Array.isArray(demandRows.rows) ? demandRows.rows : []).map((d: Record<string, unknown>) => Number(d['daily_demand']) || 0);

    if (dailyDemands.length < 2) continue;

    const ltRows = await runQuery(sql`
      SELECT EXTRACT(DAY FROM (po.actual_delivery_date - po.created_at))::numeric AS actual_lead_days
      FROM mm_purchase_orders po
      JOIN mm_purchase_order_items poi ON poi.purchase_order_id = po.id
      WHERE poi.material_id = ${matId}
        AND po.actual_delivery_date IS NOT NULL
        AND po.created_at >= NOW() - INTERVAL '12 months'
      ORDER BY po.created_at DESC
      LIMIT 12
    `).catch((e: Error) => {
      logger.warn(`Lead-time history query failed for material ${matId}: ${e.message}`);
      return { rows: [] };
    });

    const leadTimeSeries = (Array.isArray(ltRows.rows) ? ltRows.rows : []).map((row: Record<string, unknown>) => Math.max(0, Number(row['actual_lead_days']) || 0))
      .filter((d: number) => d > 0);

    const ssResult = ssSvc.calculate({
      dailyDemandSeries: dailyDemands,
      leadTimeDays,
      ...(leadTimeSeries.length >= 3 ? { leadTimeSeries } : {}),
      abcClass: ['A', 'B', 'C'].includes(abcClass) ? abcClass : 'C',
      useEwm: true,
    });

    if (!ssResult.ok) {
      logger.warn(`[safety-stock] material_id=${matId}: ${ssResult.error.message}`);
      continue;
    }

    const { safetyStock, avgDailyDemand } = ssResult.data;
    const rop = avgDailyDemand * leadTimeDays + safetyStock;

    await runQuery(sql`
      INSERT INTO inventory_policy (material_id, safety_stock, reorder_point, updated_at)
      VALUES (${matId}, ${safetyStock}, ${rop}, NOW())
      ON CONFLICT (material_id) DO UPDATE SET
        safety_stock = EXCLUDED.safety_stock,
        reorder_point = EXCLUDED.reorder_point,
        updated_at = NOW()
    `);

    updated++;
  }

  logger.log(`[safety-stock-refresh] ${updated} material yangilandi`);
}
