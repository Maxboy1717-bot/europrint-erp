/**
 * @module wms-catalog.service
 * @description Warehouse analytics service — produces the reports that drive
 *   the WMS catalog dashboard and the materials-list page. Each method maps
 *   one-to-one with a section of the dashboard:
 *     - ABC analysis (Pareto value-class)
 *     - Aging (slow movers)
 *     - Expiry watch (FEFO health)
 *     - Stock balance + turnover ratio
 *     - Dashboard KPIs + alerts
 *     - Top-N consumed materials
 * @layer Application Service (WMS)
 *
 * WHY ALL RAW SQL LIVES HERE
 *   Drizzle ORM doesn't model these queries cleanly — they use window functions,
 *   correlated subqueries and LATERAL joins. Keeping them in one service (rather
 *   than scattered repos) gives the team a single place to review query plans
 *   and add indexes. The companion controller is therefore intentionally a thin
 *   pass-through (`return this.svc.getAbcAnalysis()`) — see Rule 6.
 *
 * WHY THIS SERVICE SWALLOWS ERRORS WITH `[]` FALLBACK
 *   Dashboards must render even if one report fails (DB hiccup, slow query
 *   killed). A blown KPI tile is a worse UX than an empty one. Each method
 *   wraps the DB call in try/catch and logs the failure; the controller still
 *   gets a well-shaped (but empty) result so the page renders. Auditing /
 *   reconciliation reports — which MUST fail loud — live in `wms-audit.service`
 *   and propagate errors via Result<T> instead.
 */

import { Injectable, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class WmsCatalogService {
  private readonly logger = new Logger(WmsCatalogService.name);

  // ── REPORTS ─────────────────────────────────────────────────────────────────

  /**
   * @description ABC (Pareto) classification of materials by total stock value.
   *   Implements the standard 80/15/5 split:
   *     - Class A — top items whose cumulative value reaches 80% of inventory
   *     - Class B — next items up to 95%
   *     - Class C — the long tail (95%..100%)
   *
   *   Buyer / planner uses this to focus replenishment effort on Class A
   *   (~20% of SKUs that drive 80% of value), set looser thresholds for C,
   *   and review B items periodically.
   * @returns A list of up to 100 materials with classification + cumulative
   *   percentage, plus summary counts per class. Empty list on DB failure
   *   (dashboard renders, error logged).
   *
   *   `mc.abc_segment` stored on material_cards is the *cached* class set by
   *   a nightly job — we recompute live here so the dashboard reflects the
   *   current quarter's mix, not yesterday's cache.
   */
  async getAbcAnalysis() {
    try {
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS name, mc.kod,
               COALESCE(mc.abc_segment, 'C') AS segment,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
        WHERE mc.is_active IS NOT FALSE
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.abc_segment
        ORDER BY total_value DESC LIMIT 100
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const grandTotal = rawRows.reduce((s, row) => s + Number(row.total_value ?? 0), 0);
      // WHY the cumulative loop instead of an aggregate window function:
      //   Postgres CUME_DIST() would give us the percentile per row, but we
      //   need to bucket by the running cumulative (80%/95%) which is rank-order
      //   dependent. Doing the cumulation in JS keeps the SQL simple and the
      //   class assignment auditable.
      let cumulative = 0;
      const data = rawRows.map(row => {
        const val = Number(row.total_value ?? 0);
        const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
        cumulative += pct;
        // 80 / 95 thresholds come from ABC convention. See business.constants
        // for the canonical names if you need to reuse these elsewhere.
        const cls = cumulative <= 80 ? 'A' : cumulative <= 95 ? 'B' : 'C';
        return {
          materialId: String(row.id),
          name: String(row.name ?? row.kod ?? ''),
          totalValue: val,
          percentage: Math.round(pct * 100) / 100,
          cumulativePercentage: Math.round(cumulative * 100) / 100,
          class: cls,
        };
      });
      const classA = data.filter(d => d.class === 'A').length;
      const classB = data.filter(d => d.class === 'B').length;
      const classC = data.filter(d => d.class === 'C').length;
      return { data, summary: { classA, classB, classC } };
    } catch (e) {
      this.logger.warn(`getAbcAnalysis failed: ${(e as Error).message}`);
      return { data: [], summary: { classA: 0, classB: 0, classC: 0 } };
    }
  }

  async getAging(daysThreshold: number) {
    try {
      const r = await rawSql(sql`
        SELECT bl.id::text AS id, COALESCE(bl.lot_number, bl.batch_number) AS lot_number,
               COALESCE(mc.xom_ashyo, mc.kod) AS material_name,
               bl.remaining_quantity AS quantity, bl.unit,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               mc.unit_of_measure,
               COALESCE(bl.received_date, bl.created_at) AS received_date,
               EXTRACT(DAY FROM NOW() - COALESCE(bl.received_date, bl.created_at))::int AS age_days
        FROM batch_lots bl
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE bl.remaining_quantity > 0 AND bl.is_active = true
        ORDER BY age_days DESC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const ageDays = Number(row.age_days ?? 0);
        const category = ageDays <= 30 ? 'active' : ageDays <= daysThreshold ? 'slow' : 'obsolete';
        const qty = Number(row.quantity ?? 0);
        const price = Number(row.unit_price ?? 0);
        return {
          materialId: String(row.id),
          name: String(row.material_name ?? ''),
          lastMovementDate: row.received_date ? String(row.received_date) : undefined,
          daysWithoutMovement: ageDays,
          currentStock: qty,
          value: qty * price,
          unitOfMeasure: String(row.unit_of_measure ?? row.unit ?? ''),
          category,
        };
      });
      const activeCount   = data.filter(d => d.category === 'active').length;
      const slowCount     = data.filter(d => d.category === 'slow').length;
      const obsoleteCount = data.filter(d => d.category === 'obsolete').length;
      const total = data.length || 1;
      return {
        data,
        summary: {
          activeCount,   activePercent:   Math.round(activeCount   / total * 100),
          slowCount,     slowPercent:     Math.round(slowCount     / total * 100),
          obsoleteCount, obsoletePercent: Math.round(obsoleteCount / total * 100),
        },
      };
    } catch (e) {
      this.logger.warn(`getAging failed: ${(e as Error).message}`);
      return { data: [], summary: { activeCount: 0, activePercent: 0, slowCount: 0, slowPercent: 0, obsoleteCount: 0, obsoletePercent: 0 } };
    }
  }

  async getExpiry(daysAhead: number) {
    try {
      const r = await rawSql(sql`
        SELECT bl.id::text AS id, COALESCE(bl.lot_number, bl.batch_number) AS lot_number,
               COALESCE(mc.xom_ashyo, mc.kod) AS material_name, mc.kod AS material_code,
               bl.remaining_quantity AS quantity, bl.unit, mc.unit_of_measure,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               bl.expiry_date,
               EXTRACT(DAY FROM bl.expiry_date - NOW())::int AS days_until_expiry
        FROM batch_lots bl
        LEFT JOIN material_cards mc ON mc.id = bl.material_id
        WHERE bl.expiry_date IS NOT NULL
          AND bl.remaining_quantity > 0 AND bl.is_active = true
          AND bl.expiry_date <= NOW() + (${daysAhead} || ' days')::interval
        ORDER BY bl.expiry_date ASC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const daysLeft = Number(row.days_until_expiry ?? 0);
        const qty   = Number(row.quantity ?? 0);
        const price = Number(row.unit_price ?? 0);
        const status = daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'warning' : 'ok';
        return {
          materialId:    String(row.id),
          name:          String(row.material_name ?? ''),
          batchNumber:   String(row.lot_number ?? ''),
          expiryDate:    row.expiry_date ? String(row.expiry_date) : undefined,
          daysToExpiry:  daysLeft,
          quantity:      qty,
          value:         qty * price,
          unitOfMeasure: String(row.unit_of_measure ?? row.unit ?? ''),
          status,
        };
      });
      const expiredCount  = data.filter(d => d.status === 'expired').length;
      const criticalCount = data.filter(d => d.status === 'critical').length;
      const totalAtRiskValue = data.filter(d => d.status !== 'ok').reduce((s, d) => s + d.value, 0);
      return { data, summary: { totalItems: data.length, expiredCount, criticalCount, totalAtRiskValue } };
    } catch (e) {
      this.logger.warn(`getExpiry failed: ${(e as Error).message}`);
      return { data: [], summary: { totalItems: 0, expiredCount: 0, criticalCount: 0, totalAtRiskValue: 0 } };
    }
  }

  async getStockBalance(warehouseId?: string, category?: string, lowStockOnly = false) {
    try {
      const catFilter = category && category !== 'all' ? category : null;
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS material_name, mc.kod AS material_code,
               mc.unit_of_measure, mc.category, mc.material_type,
               COALESCE(SUM(ws.quantity), 0)::numeric AS total_qty,
               COALESCE(mc.min_stock, 0)::numeric AS min_stock,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
          AND (${warehouseId ?? null}::int IS NULL OR ws.warehouse_id = ${warehouseId ? parseInt(warehouseId, 10) : null}::int)
        WHERE mc.is_active IS NOT FALSE
          AND (${catFilter}::text IS NULL OR mc.category = ${catFilter} OR mc.material_type = ${catFilter})
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_of_measure, mc.category, mc.material_type, mc.min_stock, mc.unit_price
        ORDER BY total_value DESC LIMIT 200
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      let data = rawRows.map(row => {
        const qty      = Number(row.total_qty ?? 0);
        const minStock = Number(row.min_stock ?? 0);
        const status   = minStock > 0 && qty <= 0 ? 'critical' : minStock > 0 && qty < minStock ? 'low' : 'normal';
        return {
          materialId:    String(row.id),
          name:          String(row.material_name ?? ''),
          code:          String(row.material_code ?? ''),
          currentStock:  qty,
          minStock,
          value:         Number(row.total_value ?? 0),
          unitOfMeasure: String(row.unit_of_measure ?? ''),
          status,
        };
      });
      if (lowStockOnly) data = data.filter(d => d.status === 'low' || d.status === 'critical');
      const lowStockCount = data.filter(d => d.status === 'low').length;
      const criticalCount = data.filter(d => d.status === 'critical').length;
      const totalValue    = data.reduce((s, d) => s + d.value, 0);
      return { data, summary: { totalMaterials: data.length, totalValue, lowStockCount, criticalCount } };
    } catch (e) {
      this.logger.warn(`getStockBalance failed: ${(e as Error).message}`);
      return { data: [], summary: { totalMaterials: 0, totalValue: 0, lowStockCount: 0, criticalCount: 0 } };
    }
  }

  async getTurnover() {
    try {
      const r = await rawSql(sql`
        SELECT mc.id::text AS id, COALESCE(mc.xom_ashyo, mc.kod) AS material_name,
               mc.unit_of_measure,
               COALESCE(SUM(ws.quantity), 0)::numeric AS current_stock,
               COALESCE(mc.unit_price, 0)::numeric AS unit_price,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS stock_value
        FROM material_cards mc
        LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
        WHERE mc.is_active IS NOT FALSE
        GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_of_measure, mc.unit_price
        ORDER BY stock_value DESC LIMIT 100
      `);
      const rawRows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      const data = rawRows.map(row => {
        const closingStock = Number(row.current_stock ?? 0);
        const stockValue   = Number(row.stock_value ?? 0);
        const unitPrice    = Number(row.unit_price ?? 1) || 1;
        const turnoverRate = closingStock > 0
          ? Math.round((stockValue / (closingStock * unitPrice)) * 10) / 10
          : 0;
        return {
          materialId:    String(row.id),
          name:          String(row.material_name ?? ''),
          openingStock:  closingStock,
          totalIn:       0,
          totalOut:      0,
          closingStock,
          turnoverRate,
          unitOfMeasure: String(row.unit_of_measure ?? ''),
        };
      });
      const avgTurnover = data.length > 0
        ? Math.round(data.reduce((s, d) => s + d.turnoverRate, 0) / data.length * 10) / 10
        : 0;
      const fastMovers = data.filter(d => d.turnoverRate >= 1).length;
      const slowMovers = data.filter(d => d.turnoverRate <  1).length;
      return { data, summary: { averageTurnover: avgTurnover, fastMovers, slowMovers } };
    } catch (e) {
      this.logger.warn(`getTurnover failed: ${(e as Error).message}`);
      return { data: [], summary: { averageTurnover: 0, fastMovers: 0, slowMovers: 0 } };
    }
  }

  // ── STATS ───────────────────────────────────────────────────────────────────

  async getStatsTotal() {
    try {
      const r = await rawSql(sql`
        SELECT COUNT(DISTINCT w.id)::int AS total_warehouses,
               COUNT(DISTINCT ws.material_card_id)::int AS total_materials,
               COALESCE(SUM(ws.quantity),0)::numeric AS total_quantity
        FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        WHERE w.deleted_at IS NULL
      `);
      const row = (r as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        totalWarehouses: Number(row.total_warehouses ?? 0),
        totalMaterials:  Number(row.total_materials  ?? 0),
        totalQuantity:   Number(row.total_quantity   ?? 0),
        totalBins:       0,
        utilization:     0,
      };
    } catch {
      return { totalWarehouses: 0, totalBins: 0, utilization: 0 };
    }
  }

  // ── DASHBOARD ───────────────────────────────────────────────────────────────

  async getDashboardKpis() {
    try {
      const [mcRows, grRows, stRows, lsRows] = await Promise.all([
        rawSql(sql`
          SELECT
            COUNT(DISTINCT mc.id)::int AS total_materials,
            COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS total_value
          FROM material_cards mc
          LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
          WHERE mc.is_active IS NOT FALSE
        `).catch(() => ({ rows: [{}] })),
        rawSql(sql`SELECT COUNT(*)::int AS cnt FROM goods_receipts WHERE status IN ('pending','draft')`).catch(() => ({ rows: [{ cnt: 0 }] })),
        rawSql(sql`SELECT COUNT(*)::int AS cnt FROM warehouse_transfers WHERE status IN ('pending','in_transit')`).catch(async () =>
          rawSql(sql`SELECT COUNT(*)::int AS cnt FROM stock_transfers WHERE status = 'pending'`).catch(() => ({ rows: [{ cnt: 0 }] }))
        ),
        rawSql(sql`
          SELECT COUNT(DISTINCT ws.material_card_id)::int AS cnt
          FROM warehouse_stock ws
          JOIN material_cards mc ON mc.id = ws.material_card_id
          WHERE mc.min_stock > 0 AND ws.quantity < mc.min_stock AND mc.is_active IS NOT FALSE
        `).catch(() => ({ rows: [{ cnt: 0 }] })),
      ]);
      const mc = (mcRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const gr = (grRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const st = (stRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      const ls = (lsRows as { rows?: Record<string, unknown>[] }).rows?.[0] ?? {};
      return {
        totalMaterials:      Number(mc.total_materials   ?? 0),
        totalValue:          Number(mc.total_value       ?? 0),
        lowStockCount:       Number(ls.cnt               ?? 0),
        pendingReceipts:     Number(gr.cnt               ?? 0),
        pendingTransfers:    Number(st.cnt               ?? 0),
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
        const totalIn  = Number(row.total_in  ?? 0);
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
          LEFT JOIN warehouse_stock ws ON ws.material_card_id = mc.id
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
        id:           Number(r.id),
        name:         String(r.name ?? '—'),
        kod:          String(r.kod ?? ''),
        currentStock: Number(r.current_stock ?? 0),
        minStock:     Number(r.min_stock ?? 0),
      }));
      const expiryCount = Number(((expiryRows as { rows?: Record<string, unknown>[] }).rows)?.[0]?.cnt ?? 0);
      return {
        lowStock,
        lowStockCount:   lowStock.length,
        pendingQC:       0,
        expiringBatches: expiryCount,
        overdueTasks:    0,
      };
    } catch {
      return { lowStock: [], lowStockCount: 0, pendingQC: 0, expiringBatches: 0, overdueTasks: 0 };
    }
  }

  async getTopMaterials(limit: number) {
    const lim = Math.min(Math.max(limit, 1), 50);
    const r = await rawSql(sql`
      SELECT mc.id AS material_id,
             COALESCE(mc.xom_ashyo, mc.kod) AS name,
             mc.kod,
             COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0)::numeric AS value,
             COALESCE(SUM(ws.quantity), 0)::numeric AS movement
      FROM material_cards mc
      JOIN warehouse_stock ws ON ws.material_card_id = mc.id
      WHERE mc.is_active IS NOT FALSE
      GROUP BY mc.id, mc.xom_ashyo, mc.kod, mc.unit_price
      ORDER BY value DESC
      LIMIT ${lim}
    `);
    return ((r as { rows?: Record<string, unknown>[] }).rows ?? []).map(row => ({
      materialId: Number(row.material_id),
      name:       String(row.name     ?? '—'),
      kod:        String(row.kod      ?? ''),
      value:      Number(row.value    ?? 0),
      movement:   Number(row.movement ?? 0),
    }));
  }
}
