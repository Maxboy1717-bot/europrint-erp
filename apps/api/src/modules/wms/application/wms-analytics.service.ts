import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';

export interface TurnoverItem {
  materialId: number;
  materialName: string;
  unitOfMeasure: string;
  cogs: number;
  avgInventory: number;
  inventoryTurnover: number;
  daysInventoryOutstanding: number;
  category: string;
  abcClass: string;
}

export interface DeadStockItem {
  materialId: number;
  materialName: string;
  unitOfMeasure: string;
  currentStock: number;
  unitCost: number;
  totalValue: number;
  lastMovementDate: string | null;
  daysSinceMovement: number;
}

export interface RopAlert {
  materialId: number;
  materialCode: string;
  materialName: string;
  unitOfMeasure: string;
  currentStock: number;
  reorderPoint: number;
  deficit: number;
  hasOpenRequisition: boolean;
  requisitionId: number | null;
  requisitionStatus: string | null;
}

const DEAD_STOCK_THRESHOLD_DAYS = 180;

@Injectable()
export class WmsAnalyticsService {
  async getInventoryTurnover(): Promise<Result<TurnoverItem[], AppError>> {
    try {
      const rows = await runQuery(sql`
        WITH movements_12m AS (
          SELECT pim.product_id::integer AS mat_id,
                 -- COGS: cost of actual outflows (negative quantity = issued/consumed)
                 SUM(GREATEST(0, -COALESCE(pim.quantity, 0)) * COALESCE(mc.unit_price, 0)) AS cogs_12m,
                 -- Net movement: positive = net inflow, negative = net outflow
                 SUM(COALESCE(pim.quantity, 0)) AS net_qty_12m
          FROM pos_inventory_movements pim
          JOIN material_cards mc ON mc.id::varchar = pim.product_id
          WHERE pim.product_id ~ '^[0-9]+$'
            AND pim.created_at >= NOW() - INTERVAL '1 year'
          GROUP BY pim.product_id::integer
        )
        SELECT mc.id AS material_id,
               COALESCE(mc.xom_ashyo, mc.xom_ashyo_ru, 'N/A') AS material_name,
               COALESCE(mc.unit_of_measure, 'EA') AS unit_of_measure,
               -- Use actual issued COGS; fall back to estimated cost if no movement data
               COALESCE(NULLIF(m.cogs_12m, 0),
                 GREATEST(mc.current_stock, 0) * COALESCE(mc.unit_price, 0),
                 0)::numeric AS annual_cogs,
               -- 12-month average inventory = (beginning + ending) / 2
               -- beginning stock = current_stock - net_movement_12m
               (
                 GREATEST(0,
                   GREATEST(mc.current_stock, 0) - COALESCE(m.net_qty_12m, 0)
                 ) * COALESCE(mc.unit_price, 0)
                 + GREATEST(mc.current_stock, 0) * COALESCE(mc.unit_price, 0)
               ) / 2.0 AS avg_inventory_value,
               COALESCE(mc.category, 'Uncategorized') AS category,
               COALESCE(mc.abc_segment, 'C') AS abc_segment
        FROM material_cards mc
        LEFT JOIN movements_12m m ON m.mat_id = mc.id
        WHERE mc.is_active = true
          AND GREATEST(mc.current_stock, 0) > 0
        ORDER BY annual_cogs DESC NULLS LAST
        LIMIT 200
      `);

      const items: TurnoverItem[] = (rows.rows ?? []).map((r) => {
        const cogs = safeNum(r['annual_cogs']);
        const inv = safeNum(r['avg_inventory_value']);
        const inventoryTurnover = inv > 0 ? safeDiv(cogs, inv) : 0;
        const daysInventoryOutstanding = inventoryTurnover > 0 ? safeDiv(365, inventoryTurnover) : 365;
        return {
          materialId: safeNum(r['material_id']),
          materialName: String(r['material_name'] ?? ''),
          unitOfMeasure: String(r['unit_of_measure'] ?? 'EA'),
          cogs,
          avgInventory: inv,
          inventoryTurnover,
          daysInventoryOutstanding,
          category: String(r['category'] ?? 'Uncategorized'),
          abcClass: String(r['abc_segment'] ?? 'C'),
        };
      });

      return Ok(items);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async getDeadStock(): Promise<Result<DeadStockItem[], AppError>> {
    try {
      const rows = await runQuery(sql`
        WITH last_move AS (
          SELECT product_id::integer AS mat_id,
                 MAX(created_at) AS last_at
          FROM pos_inventory_movements
          WHERE product_id ~ '^[0-9]+$'
          GROUP BY product_id::integer
        )
        SELECT mc.id AS material_id,
               COALESCE(mc.xom_ashyo, mc.xom_ashyo_ru, 'N/A') AS material_name,
               COALESCE(mc.unit_of_measure, 'EA') AS unit_of_measure,
               GREATEST(mc.current_stock, 0) AS qty_on_hand,
               COALESCE(mc.unit_price, 0)::numeric AS unit_cost,
               GREATEST(mc.current_stock, 0) * COALESCE(mc.unit_price, 0)::numeric AS total_value,
               lm.last_at::text AS last_movement_date,
               EXTRACT(DAY FROM NOW() - COALESCE(lm.last_at, mc.updated_at, mc.created_at))::integer AS days_since
        FROM material_cards mc
        LEFT JOIN last_move lm ON lm.mat_id = mc.id
        WHERE mc.is_active = true
          AND GREATEST(mc.current_stock, 0) > 0
          AND (
            lm.last_at < NOW() - (INTERVAL '1 day' * ${DEAD_STOCK_THRESHOLD_DAYS})
            OR lm.last_at IS NULL
          )
        ORDER BY days_since DESC NULLS FIRST, total_value DESC
        LIMIT 100
      `);

      const items: DeadStockItem[] = (rows.rows ?? []).map((r) => ({
        materialId: safeNum(r['material_id']),
        materialName: String(r['material_name'] ?? ''),
        unitOfMeasure: String(r['unit_of_measure'] ?? 'EA'),
        currentStock: safeNum(r['qty_on_hand']),
        unitCost: safeNum(r['unit_cost']),
        totalValue: safeNum(r['total_value']),
        lastMovementDate: r['last_movement_date'] ? String(r['last_movement_date']) : null,
        daysSinceMovement: safeNum(r['days_since'], DEAD_STOCK_THRESHOLD_DAYS),
      }));

      return Ok(items);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async getRopAlerts(): Promise<Result<RopAlert[], AppError>> {
    try {
      const rows = await runQuery(sql`
        SELECT mc.id AS material_id,
               COALESCE(mc.kod, '') AS material_code,
               COALESCE(mc.xom_ashyo, mc.xom_ashyo_ru, 'N/A') AS material_name,
               COALESCE(mc.unit_of_measure, 'EA') AS unit_of_measure,
               GREATEST(mc.current_stock, 0)::numeric AS on_hand,
               COALESCE(ip.reorder_point, mc.reorder_point, 0)::numeric AS rop,
               GREATEST(0, COALESCE(ip.reorder_point, mc.reorder_point, 0) - GREATEST(mc.current_stock, 0))::numeric AS shortage,
               EXISTS (
                 SELECT 1 FROM mm_purchase_requisition_items pri
                 JOIN mm_purchase_requisitions pr ON pr.id = pri.requisition_id
                 WHERE pri.material_id = mc.id
                   AND pr.status IN ('pending', 'approved')
                   AND pr.created_at > NOW() - INTERVAL '48 hours'
               ) AS has_open_requisition,
               (
                 SELECT pr.id FROM mm_purchase_requisition_items pri
                 JOIN mm_purchase_requisitions pr ON pr.id = pri.requisition_id
                 WHERE pri.material_id = mc.id
                   AND pr.status IN ('pending', 'approved')
                   AND pr.created_at > NOW() - INTERVAL '48 hours'
                 ORDER BY pr.created_at DESC LIMIT 1
               ) AS requisition_id,
               (
                 SELECT pr.status FROM mm_purchase_requisition_items pri
                 JOIN mm_purchase_requisitions pr ON pr.id = pri.requisition_id
                 WHERE pri.material_id = mc.id
                   AND pr.status IN ('pending', 'approved')
                   AND pr.created_at > NOW() - INTERVAL '48 hours'
                 ORDER BY pr.created_at DESC LIMIT 1
               ) AS requisition_status
        FROM material_cards mc
        LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
        WHERE mc.is_active = true
          AND COALESCE(ip.reorder_point, mc.reorder_point, 0) > 0
          AND GREATEST(mc.current_stock, 0) <= COALESCE(ip.reorder_point, mc.reorder_point, 0)
        ORDER BY shortage DESC NULLS LAST
        LIMIT 50
      `);

      const alerts: RopAlert[] = (rows.rows ?? []).map((r) => ({
        materialId: safeNum(r['material_id']),
        materialCode: String(r['material_code'] ?? ''),
        materialName: String(r['material_name'] ?? ''),
        unitOfMeasure: String(r['unit_of_measure'] ?? 'EA'),
        currentStock: safeNum(r['on_hand']),
        reorderPoint: safeNum(r['rop']),
        deficit: safeNum(r['shortage']),
        hasOpenRequisition: Boolean(r['has_open_requisition']),
        requisitionId: r['requisition_id'] != null ? safeNum(r['requisition_id']) : null,
        requisitionStatus: r['requisition_status'] != null ? String(r['requisition_status']) : null,
      }));

      return Ok(alerts);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
