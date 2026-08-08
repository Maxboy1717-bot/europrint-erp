/**
 * @module director-state.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { execSalesOrderSetVip } from '@common/database/queries-remaining';
import type {
  IDirectorStateRepo,
  WmsRentalData,
  CompanyStateHistoryData,
  IdealVsActualData,
} from '../../domain/repositories/i-director-state.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

// SB0369 (Hisobot/analitika audit, 2026-07-04): oldin bu 2 target hardcoded edi —
// endi `kpi_definitions` (owner-configurable, PATCH /director/dashboard/kpi-definitions
// orqali) dan o'qiladi; kod=PROFIT_WEEKLY/REVENUE_WEEKLY qatorlar hali seed qilinmagan
// bo'lsa shu default qiymatlarga fallback qiladi (xatti-harakat o'zgarmaydi, faqat
// endi owner DB orqali sozlashi mumkin — CompanyStateService bilan bir xil naqsh).
const PROFIT_TARGET_WEEKLY_DEFAULT = 25_000_000;
const REVENUE_TARGET_WEEKLY_DEFAULT = 200_000_000;

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

export type { WmsRentalData, CompanyStateHistoryData, IdealVsActualData };

type WRow = { warehouse_id: string; warehouse_name: string; warehouse_type: string; total_qty: string; total_value: string; item_count: string; rental_cost_monthly: string };
type WR = { week_label: string; week_start: string; revenue: string; profit: string };
type RR = Record<string, unknown>;

@Injectable()
export class DirectorStateRepository implements IDirectorStateRepo {
  async queryWmsRental(): Promise<Result<WmsRentalData>> {

    return safeCall(async () => {
      const now = _time.now();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysElapsed = now.getDate();
      // G9-3: kanonik warehouse_stock + material_cards.unit_price (avval 7-qatorli DEMO
      // stock_items jadvalidan si.cost_price bilan o'qir edi — jonli 37 qatorga o'tkazildi).
      const r = await castTo<WRow[]>(exec(sql`
        SELECT w.id::text AS warehouse_id, w.name AS warehouse_name, w.type AS warehouse_type,
               COALESCE(SUM(ws.quantity), 0) AS total_qty,
               COALESCE(SUM(ws.quantity * COALESCE(mc.unit_price, 0)), 0) AS total_value,
               COUNT(DISTINCT ws.id) AS item_count,
               COALESCE(w.monthly_rate, 0) AS rental_cost_monthly
        FROM warehouses w
        LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
        LEFT JOIN material_cards mc ON mc.id = ws.material_id
        WHERE w.is_active = true
        GROUP BY w.id, w.name, w.type, w.monthly_rate
        ORDER BY rental_cost_monthly DESC`));
      const rentalData = (Array.isArray(r) ? r : []).map(row => {
        const rentalCostMonthly = parseFloat(row.rental_cost_monthly) || 0;
        const rentalCostToDate = Math.round((rentalCostMonthly / daysInMonth) * daysElapsed);
        return { warehouseId: row.warehouse_id, warehouseName: row.warehouse_name ?? '', warehouseType: row.warehouse_type ?? '', totalQty: parseFloat(row.total_qty)||0, totalValue: parseFloat(row.total_value)||0, itemCount: parseInt(row.item_count,10)||0, rentalCostMonthly, rentalCostToDate };
      });
      const grandTotal = (Array.isArray(rentalData) ? rentalData : []).reduce((s, x) => s + x.rentalCostMonthly, 0);
      const grandTotalToDate = (Array.isArray(rentalData) ? rentalData : []).reduce((s, x) => s + x.rentalCostToDate, 0);
      return { rentalData, grandTotal, grandTotalToDate, daysElapsed, daysInMonth, month: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, generatedAt: now.toISOString() };
    }, 'DB_ERROR');
  }

  async queryCompanyStateHistory(): Promise<Result<CompanyStateHistoryData>> {

    return safeCall(async () => {
      // si/pi endi finance_invoices (invoice_type='sales'/'purchase') — kanonik invoice-manba,
      // OWNER QARORI 2026-07-02. Oldin sales_invoices/purchase_invoices (doim 0 satr) o'qirdi.
      const r = await castTo<WR[]>(exec(sql`SELECT TO_CHAR(DATE_TRUNC('week', si.created_at), 'DD.MM') AS week_label, DATE_TRUNC('week', si.created_at)::date::text AS week_start, COALESCE(SUM(si.total_amount) FILTER (WHERE si.payment_status = 'paid'), 0) AS revenue, COALESCE(SUM(si.total_amount) FILTER (WHERE si.payment_status = 'paid'), 0) - COALESCE((SELECT SUM(pi.total_amount) FROM finance_invoices pi WHERE pi.invoice_type = 'purchase' AND DATE_TRUNC('week', pi.created_at) = DATE_TRUNC('week', si.created_at) AND pi.payment_status IN ('paid','partial')), 0) AS profit FROM finance_invoices si WHERE si.invoice_type = 'sales' AND si.created_at >= NOW() - INTERVAL '8 weeks' GROUP BY DATE_TRUNC('week', si.created_at) ORDER BY week_start ASC`));
      const history = (Array.isArray(r) ? r : []).map(row => {
        const revenue = parseFloat(row.revenue)||0; const profit = parseFloat(row.profit)||0;
        const perfRatio = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
        let stateKey = 'inqiroz';
        if (profit >= 130_000_000 && revenue >= 1_000_000_000) stateKey = 'osish';
        else if (profit >= 100_000_000 && revenue >= 800_000_000) stateKey = 'normal';
        else if (profit >= 70_000_000 && revenue >= 600_000_000) stateKey = 'ehtiyot';
        else if (profit >= 40_000_000 || revenue >= 400_000_000) stateKey = 'xavf';
        return { week_label: row.week_label??'', week_start: row.week_start??'', revenue, profit, perf_ratio: perfRatio, state_key: stateKey };
      });
      return { history };
    }, 'DB_ERROR');
  }

  async queryIdealVsActual(): Promise<Result<IdealVsActualData>> {

    return safeCall(async () => {
      const weekStart = _time.now();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const [revRows, ordRows, targetRows] = await Promise.all([
        // finance_invoices (invoice_type='sales'/'purchase') — kanonik invoice-manba, OWNER QARORI 2026-07-02.
        castTo<RR[]>(exec(sql`SELECT COALESCE(SUM(total_amount) FILTER (WHERE payment_status='paid'), 0) AS revenue, COALESCE(SUM(total_amount) FILTER (WHERE payment_status='paid'), 0) - COALESCE((SELECT SUM(total_amount) FROM finance_invoices WHERE invoice_type = 'purchase' AND created_at >= ${weekStart} AND payment_status IN ('paid','partial')), 0) AS profit FROM finance_invoices WHERE invoice_type = 'sales' AND created_at >= ${weekStart}`)),
        castTo<RR[]>(exec(sql`SELECT COUNT(*) FILTER (WHERE status='completed') AS completed, COUNT(*) AS total FROM sales_orders WHERE created_at >= ${weekStart}`)),
        // SB0369: owner-configurable weekly targets (kpi_definitions.target_value),
        // gracefully falls back to the historical defaults when not seeded yet.
        castTo<RR[]>(exec(sql`SELECT kpi_code, target_value FROM kpi_definitions WHERE kpi_code IN ('PROFIT_WEEKLY', 'REVENUE_WEEKLY') AND is_active = TRUE`)),
      ]);
      const rv = (revRows[0]??{}) as RR; const ov = (ordRows[0]??{}) as RR;
      const targetByCode = new Map<string, number>();
      for (const row of targetRows) {
        const code = String((row as RR).kpi_code ?? '');
        const val = safeNum((row as RR).target_value ?? '0') || 0;
        if (code && val > 0) targetByCode.set(code, val);
      }
      const profitTarget = targetByCode.get('PROFIT_WEEKLY') ?? PROFIT_TARGET_WEEKLY_DEFAULT;
      const revenueTarget = targetByCode.get('REVENUE_WEEKLY') ?? REVENUE_TARGET_WEEKLY_DEFAULT;
      const profitActual = safeNum(rv.profit??'0')||0;
      const revenueActual = safeNum(rv.revenue??'0')||0;
      const profitPct = Math.round((profitActual / profitTarget) * 100);
      const revenuePct = Math.round((revenueActual / revenueTarget) * 100);
      const completed = parseInt(String(ov.completed??'0'),10)||0;
      const total = parseInt(String(ov.total??'0'),10)||0;
      return { week_start: weekStart.toISOString().slice(0,10), profit: { actual: profitActual, target: profitTarget, pct: profitPct, deviation_pct: profitPct-100, formatted_actual: fmt(profitActual), formatted_target: fmt(profitTarget) }, revenue: { actual: revenueActual, target: revenueTarget, pct: revenuePct, deviation_pct: revenuePct-100, formatted_actual: fmt(revenueActual), formatted_target: fmt(revenueTarget) }, orders: { completed, total, completion_pct: total>0?Math.round((completed/total)*100):0 } };
    }, 'DB_ERROR');
  }

  async executeMarkVip(orderId: number): Promise<Result<void>> {

    return safeCall(async () => {
      await execSalesOrderSetVip(orderId);
      // Item #100: sales_orders.is_vip was set (via the sd_sales_orders view, which
      // works), but PP's queue-priority logic (ProductionPriorityService.buildQueue,
      // used by GET /pp/queue and the operator-facing PPQueue.tsx "ZARUR" badge) only
      // reads production_orders.is_urgent — it never joins sales_orders, so a VIP
      // marking never surfaced in production at all. Reuses the existing ZARUR/
      // is_urgent mechanism (EP-PP-097) instead of inventing new VIP-specific queue
      // logic — one UPDATE makes VIP immediately visible in both existing PP views.
      await exec(sql`UPDATE production_orders SET is_urgent = true, updated_at = NOW()
                      WHERE sales_order_id = ${orderId} AND deleted_at IS NULL`);
    }, 'DB_ERROR');
  }
}
