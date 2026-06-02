/**
 * @module wms-catalog/dashboard.service
 * @description Dashboard KPI, movements, alerts, stats sub-reports.
 */

import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class WmsCatalogDashboardService {
  async getStatsTotal() {
    try {
      const r = await rawSql(sql`
        SELECT COUNT(DISTINCT w.id)::int AS total_warehouses,
               COUNT(DISTINCT ws.material_id)::int AS total_materials,
               COALESCE(SUM(ws.quantity),0)::numeric AS total_quantity
        FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        WHERE w.deleted_at IS NULL
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        totalWarehouses: Number(row.total_warehouses ?? 0),
        totalMaterials: Number(row.total_materials ?? 0),
        totalQuantity: Number(row.total_quantity ?? 0),
        totalBins: 0, utilization: 0,
      };
    } catch {
      return { totalWarehouses: 0, totalBins: 0, utilization: 0 };
    }
  }

  async getDashboardKpis() {
    try {
      const [mcRows, grRows, stRows, lsRows] = await Promise.all([
        rawSql(sql`
          SELECT
            COUNT(DISTINCT mc.id)::int AS total_materials,
            COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
          FROM material_cards mc
          LEFT JOIN warehouse_stock ws ON ws.material_id = mc.id
          WHERE mc.is_active IS NOT FALSE
        `).catch(() => ({ rows: [{}] })),
        rawSql(sql`SELECT COUNT(*)::int AS cnt FROM goods_receipts WHERE status IN ('pending','draft')`).catch(() => ({ rows: [{ cnt: 0 }] })),
        rawSql(sql`SELECT COUNT(*)::int AS cnt FROM warehouse_transfers WHERE status IN ('pending','in_transit')`).catch(async () =>
          rawSql(sql`SELECT COUNT(*)::int AS cnt FROM stock_transfers WHERE status = 'pending'`).catch(() => ({ rows: [{ cnt: 0 }] }))
        ),
        rawSql(sql`
          SELECT COUNT(DISTINCT ws.material_id)::int AS cnt
          FROM warehouse_stock ws
          JOIN material_cards mc ON mc.id = ws.material_id
          WHERE mc.min_stock > 0 AND ws.quantity < mc.min_stock AND mc.is_active IS NOT FALSE
        `).catch(() => ({ rows: [{ cnt: 0 }] })),
      ]);
      const mc = (mcRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const gr = (grRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const st = (stRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const ls = (lsRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        totalMaterials: Number(mc.total_materials ?? 0),
        totalValue: Number(mc.total_value ?? 0),
        lowStockCount: Number(ls.cnt ?? 0),
        pendingReceipts: Number(gr.cnt ?? 0),
        pendingTransfers: Number(st.cnt ?? 0),
        overdueReservations: 0,
      };
    } catch {
      return { totalMaterials: 0, totalValue: 0, lowStockCount: 0, pendingReceipts: 0, pendingTransfers: 0, overdueReservations: 0 };
    }
  }

  async getMovementSummary(period?: string) {
    try {
      const isWeek = period === 'week';
      const r = await rawSql(sql`
        SELECT
          COALESCE(SUM(CASE WHEN transaction_type IN ('receipt','goods_receipt','in','inbound') THEN quantity ELSE 0 END), 0)::numeric AS total_in,
          COALESCE(SUM(CASE WHEN transaction_type IN ('issue','goods_issue','out','outbound') THEN quantity ELSE 0 END), 0)::numeric AS total_out,
          COUNT(*)::int AS transaction_count
        FROM warehouse_transactions
        WHERE created_at >= ${isWeek ? sql`NOW() - INTERVAL '7 days'` : sql`CURRENT_DATE`}
      `).catch(() => null);
      if (r) {
        const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
        const totalIn = Number(row.total_in ?? 0);
        const totalOut = Number(row.total_out ?? 0);
        return { totalIn, totalOut, netChange: totalIn - totalOut, transactionCount: Number(row.transaction_count ?? 0) };
      }
    } catch { /* fallback below */ }
    return { totalIn: 0, totalOut: 0, netChange: 0, transactionCount: 0 };
  }

  async getDashboardAlerts() {
    try {
      const [lowStockRows, expiryRows] = await Promise.all([
        rawSql(sql`
          SELECT mc.id, COALESCE(mc.xom_ashyo, mc.kod) AS name, mc.kod,
                 COALESCE(SUM(ws.quantity), 0)::numeric AS current_stock,
                 mc.min_stock::numeric AS min_stock
          FROM material_cards mc
          LEFT JOIN warehouse_stock ws ON ws.material_id = mc.id
          WHERE mc.min_stock > 0 AND mc.is_active IS NOT FALSE
          GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.min_stock
          HAVING COALESCE(SUM(ws.quantity), 0) < mc.min_stock
          ORDER BY (COALESCE(SUM(ws.quantity), 0) / NULLIF(mc.min_stock, 0)) ASC
          LIMIT 10
        `).catch(() => ({ rows: [] })),
        rawSql(sql`
          SELECT COUNT(*)::int AS cnt FROM batch_lots
          WHERE expiry_date IS NOT NULL
            AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
            AND is_active = true
        `).catch(() => ({ rows: [{ cnt: 0 }] })),
      ]);
      const lowStock = ((lowStockRows as { rows?: Record<string, unknown>[] }).rows ?? []).map(r => ({
        id: Number(r.id), name: String(r.name ?? '—'), kod: String(r.kod ?? ''),
        currentStock: Number(r.current_stock ?? 0), minStock: Number(r.min_stock ?? 0),
      }));
      const expiryCount = Number(((expiryRows as { rows?: Record<string, unknown>[] }).rows)?.[0]?.cnt ?? 0);
      return {
        lowStock, lowStockCount: lowStock.length, pendingQC: 0,
        expiringBatches: expiryCount, overdueTasks: 0,
      };
    } catch {
      return { lowStock: [], lowStockCount: 0, pendingQC: 0, expiringBatches: 0, overdueTasks: 0 };
    }
  }
}
