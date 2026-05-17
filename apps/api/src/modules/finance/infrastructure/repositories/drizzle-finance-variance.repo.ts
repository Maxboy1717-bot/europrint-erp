/**
 * NOTE: Raw SQL retained intentionally — multi-table compatibility selects
 * (production_orders, boms, routings, mes_sessions, standard_cost, stock_movements,
 * stock_items, kaizen_suggestions) whose Drizzle schemas are not fully unified.
 * See ARCHITECTURE_RULES.md Rule 4.
 */

/**
 * @module drizzle-finance-variance.repo
 * @description Variance analysis sub-repo (P0-2). Extracted from drizzle-finance-costing.repo
 *              as part of Rule 13/16 split.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { VarianceOrderInputs, VarianceReportInput } from '../../domain/repositories/i-finance.repo';

type RawRow = Record<string, unknown>;
const toNum = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

@Injectable()
export class FinanceVarianceRepo {
  private readonly logger = new Logger(FinanceVarianceRepo.name);

  async fetchVarianceOrderInputs(orderId: number): Promise<VarianceOrderInputs> {
    const orderRes = await runQuery<RawRow>(sql`
      SELECT po.id                    AS id,
             po.order_number,
             p.name                  AS product_name,
             po.product_id,
             po.planned_quantity     AS planned_qty,
             po.actual_cost::numeric AS actual_cost_total,
             po.bom_id               AS bom_id,
             po.routing_id           AS routing_id
      FROM production_orders po
      LEFT JOIN products p ON p.id = po.product_id
      WHERE po.id = ${orderId}
      LIMIT 1
    `);
    const orderRow = orderRes.rows[0];
    if (!orderRow) {
      return {
        order: null,
        bomItemsJson: '[]', routingStepsJson: '[]',
        actualHours: 0, stdCost: null,
        actualMaterial: { actualMaterialQty: 0, actualUnitPrice: 0 },
      };
    }

    const order = {
      id:              Number(orderRow['id'] ?? 0),
      orderNumber:     String(orderRow['order_number'] ?? ''),
      productName:     String(orderRow['product_name'] ?? ''),
      productId:       orderRow['product_id']  ? Number(orderRow['product_id'])  : null,
      plannedQty:      toNum(orderRow['planned_qty'], 1),
      actualCostTotal: toNum(orderRow['actual_cost_total'], 0),
      bomId:           orderRow['bom_id']     ? Number(orderRow['bom_id'])     : null,
      routingId:       orderRow['routing_id'] ? Number(orderRow['routing_id']) : null,
    };

    const [bomRes, routingRes, mesRes, stdRes, movRes] = await Promise.all([
      order.bomId !== null
        ? runQuery<RawRow>(sql`SELECT items FROM boms WHERE id = ${order.bomId} LIMIT 1`)
            .catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
      order.routingId !== null
        ? runQuery<RawRow>(sql`SELECT steps FROM routings WHERE id = ${order.routingId} LIMIT 1`)
            .catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600.0), 0) AS ah
        FROM mes_sessions ms
        WHERE ms.production_order_id::text = ${String(orderId)}
          AND ms.status::text = 'completed'
      `).catch(() => ({ rows: [] as RawRow[] })),
      order.productId !== null
        ? runQuery<RawRow>(sql`
            SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                   std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
            FROM standard_cost
            WHERE product_id = ${order.productId}
            ORDER BY period DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] }))
        : runQuery<RawRow>(sql`
            SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                   std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
            FROM standard_cost
            WHERE product_name = ${order.productName}
            ORDER BY period DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(ABS(sm.quantity)), 0) AS actual_material_qty,
               COALESCE(AVG(si.cost_price::numeric), 0) AS actual_unit_price
        FROM stock_movements sm
        JOIN stock_items si ON si.id = sm.stock_item_id
        WHERE sm.reference_id::text = ${String(orderId)}
          AND sm.movement_type::text IN ('OUT', 'CONSUMPTION')
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    const stdRow = stdRes.rows[0];
    const stdCost = stdRow
      ? {
          stdMaterialUzs: toNum(stdRow['std_material_uzs'], 0),
          stdLaborUzs:    toNum(stdRow['std_labor_uzs'], 0),
          stdOverheadUzs: toNum(stdRow['std_overhead_uzs'], 0),
          stdTotal:       toNum(stdRow['std_total'], 0),
        }
      : null;

    return {
      order,
      bomItemsJson:     String(bomRes.rows[0]?.['items']  ?? '[]'),
      routingStepsJson: String(routingRes.rows[0]?.['steps'] ?? '[]'),
      actualHours:      toNum(mesRes.rows[0]?.['ah'], 0),
      stdCost,
      actualMaterial: {
        actualMaterialQty: toNum(movRes.rows[0]?.['actual_material_qty'], 0),
        actualUnitPrice:   toNum(movRes.rows[0]?.['actual_unit_price'], 0),
      },
    };
  }

  async saveVarianceReport(v: VarianceReportInput): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO variance_report (order_id, mpv, mqv, lrv, lev, ov, total_variance)
        VALUES (${v.orderId}, ${v.mpv}, ${v.mqv}, ${v.lrv}, ${v.lev}, ${v.ov}, ${v.totalVariance})
        ON CONFLICT (order_id) DO UPDATE
          SET mpv = EXCLUDED.mpv, mqv = EXCLUDED.mqv, lrv = EXCLUDED.lrv,
              lev = EXCLUDED.lev, ov = EXCLUDED.ov, total_variance = EXCLUDED.total_variance,
              calculated_at = now()
      `);
    } catch (err) {
      this.logger.warn(`VarianceReport saqlashda xato (skipped): ${String(err)}`);
    }
  }

  async createKaizenAuditTask(title: string, description: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO kaizen_suggestions (title, description, status, created_at)
      VALUES (${title}, ${description}, ${'open'}, now())
    `);
  }
}
