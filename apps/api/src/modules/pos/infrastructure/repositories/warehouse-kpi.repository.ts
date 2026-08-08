/**
 * @module warehouse-kpi.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import type { WarehouseKpi } from '../../application/services/warehouse-kpi.service';

@Injectable()
export class WarehouseKpiRepository {
  async getWarehouseKpisBase(): Promise<WarehouseKpi[]> {
    return typedExecute<WarehouseKpi>(sql`
      WITH wh_stock AS (
        SELECT
          w.id, w.code, w.name, w.type,
          COUNT(DISTINCT ws.material_id)::int AS material_count,
          COALESCE(SUM(ws.available_quantity), 0)::numeric AS total_qty,
          COALESCE(SUM(ws.available_quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value,
          COUNT(DISTINCT CASE WHEN ws.available_quantity < COALESCE(mc.min_stock, 0)
                               AND ws.available_quantity > 0
                             THEN ws.material_id END)::int AS low_count,
          COUNT(DISTINCT CASE WHEN COALESCE(ws.available_quantity, 0) <= 0
                             THEN mc.id END)::int AS out_count
        FROM warehouses w
        LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        LEFT JOIN material_cards mc ON mc.id = ws.material_id
        WHERE w.is_active = true
        GROUP BY w.id, w.code, w.name, w.type
      ),
      wh_movements AS (
        SELECT
          COALESCE(from_warehouse_id, to_warehouse_id) AS wh_id,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today_count,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS week_count,
          COUNT(*) FILTER (WHERE status IN ('pending','draft','qc_pending','karantin','qc_review')) AS pending_count
        FROM pos_movements
        WHERE deleted_at IS NULL
        GROUP BY COALESCE(from_warehouse_id, to_warehouse_id)
      ),
      wh_employees AS (
        SELECT warehouse_id, COUNT(*)::int AS emp_count
        FROM warehouse_employees
        WHERE removed_at IS NULL
        GROUP BY warehouse_id
      )
      SELECT
        s.id                          AS "warehouseId",
        s.code                        AS "warehouseCode",
        s.name                        AS "warehouseName",
        UPPER(COALESCE(s.type, 'MAIN')) AS "warehouseType",
        s.material_count              AS "totalMaterials",
        s.total_qty                   AS "totalQuantity",
        s.total_value                 AS "totalValue",
        s.low_count                   AS "lowStockCount",
        s.out_count                   AS "outOfStockCount",
        COALESCE(m.today_count, 0)    AS "movementsToday",
        COALESCE(m.week_count, 0)     AS "movementsThisWeek",
        COALESCE(m.pending_count, 0)  AS "pendingApprovals",
        COALESCE(e.emp_count, 0)      AS "employeeCount"
      FROM wh_stock s
      LEFT JOIN wh_movements m ON m.wh_id = s.id
      LEFT JOIN wh_employees e ON e.warehouse_id = s.id
      ORDER BY s.code
    `);
  }

  async getUnitBreakdown(warehouseId: number): Promise<Array<{ unit: string; count: number; quantity: number }>> {
    const rows = await typedExecute<{ unit: string; count: number; quantity: string | number }>(sql`
      SELECT
        COALESCE(mc.unit_of_measure, '—') AS unit,
        COUNT(DISTINCT mc.id)::int        AS count,
        COALESCE(SUM(ws.available_quantity), 0)::numeric AS quantity
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      WHERE ws.warehouse_id = ${warehouseId}
        AND ws.available_quantity > 0
      GROUP BY mc.unit_of_measure
      ORDER BY count DESC
    `);
    return rows.map(u => ({ unit: u.unit, count: Number(u.count), quantity: Number(u.quantity) }));
  }

  async getSystemKpiBase(): Promise<Record<string, string | number>> {
    const rows = await typedExecute<Record<string, string | number>>(sql`
      SELECT
        (SELECT COUNT(*) FROM warehouses WHERE is_active = true)::int AS total_warehouses,
        (SELECT COUNT(*) FROM material_cards WHERE is_active = true)::int AS total_materials,
        (SELECT COALESCE(SUM(available_quantity * COALESCE(mc.unit_price, 0)), 0)::numeric
           FROM warehouse_stock ws
           LEFT JOIN material_cards mc ON mc.id = ws.material_id) AS total_stock_value,
        (SELECT COUNT(*) FROM low_stock_alerts WHERE is_resolved = false)::int AS low_stock_alerts,
        (SELECT COUNT(*) FROM pos_movements WHERE status IN ('pending','draft') AND deleted_at IS NULL)::int AS pending_movements,
        -- 'karantin'/'qc_review' — real/ulangan karantin-QC oqimida ishlatiladigan statuslar
        -- ('qc_pending' faqat muqobil qo'lda-yuborish yo'lida ishlatiladi); ikkalasi ham
        -- "QC kutmoqda" hisobiga kirishi kerak, aks holda dashboard karantindagi kirimlarni ko'rsatmaydi.
        (SELECT COUNT(*) FROM pos_movements WHERE status IN ('qc_pending','karantin','qc_review') AND deleted_at IS NULL)::int AS qc_pending,
        (SELECT COUNT(*) FROM pos_movements WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL)::int AS today_movements,
        (SELECT COUNT(*) FROM pos_movements WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL)::int AS weekly_movements,
        (SELECT COUNT(*) FROM pos_movements WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL)::int AS monthly_movements
    `);
    return rows[0] ?? {};
  }

  async getTopWarehouses(): Promise<Array<{ code: string; name: string; value: string | number }>> {
    return typedExecute<{ code: string; name: string; value: string | number }>(sql`
      SELECT w.code, w.name,
             COALESCE(SUM(ws.available_quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS value
      FROM warehouses w
      LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
      LEFT JOIN material_cards mc ON mc.id = ws.material_id
      WHERE w.is_active = true
      GROUP BY w.id, w.code, w.name
      ORDER BY value DESC
      LIMIT 5
    `);
  }

  async getMovementsByType(): Promise<Array<{ type: string; count: number }>> {
    return typedExecute<{ type: string; count: number }>(sql`
      SELECT movement_type AS type, COUNT(*)::int AS count
      FROM pos_movements
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND deleted_at IS NULL
      GROUP BY movement_type
      ORDER BY count DESC
    `);
  }
}
