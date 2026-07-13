/**
 * @module demand-forecast.service
 * @description GET /ai/forecast/demand — real per-product demand forecast built on the
 *   existing, already-proven ForecastService (EMA + grid-search alpha, TZ-06 — same engine
 *   ForecastExtController's POST /forecast/:id/ema uses). Queries actual historical
 *   sales_orders/sales_order_items rows only — no synthetic/fake data, no hardcoded numbers.
 *
 *   The DB was reset 2026-07-11 and starts near-empty (owner decision, real-company-only
 *   data). Running a forecast model on 0-2 historical orders produces a flat/misleading
 *   line dressed up as a prediction, so a minimum-history gate runs BEFORE the algorithm:
 *   if fewer than `ai.forecast_min_orders` (business_settings, owner-tunable via the
 *   Business Settings CRUD screen — Q-40, never hardcoded/asked in chat) historical orders
 *   exist, the endpoint returns an explicit `insufficient_history` status instead of a
 *   fabricated result.
 * @layer Application Service (AI module)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';
import { clamp, roundTo, safeNum } from '@common/math/math-utils';
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import { ForecastService } from '../../forecast/forecast.service';

/** Monthly demand series lookback window fed into the forecaster. */
const FORECAST_LOOKBACK_MONTHS = 18;
/** Forecast horizon (months) requested from the EMA engine (1m + 3m cards on the FE). */
const FORECAST_HORIZON_MONTHS = 3;
/**
 * Owner-tunable via business_settings CRUD (setting_key='ai.forecast_min_orders'); this is
 * only the fallback used until a row exists / the owner changes it. 10 is a reasonable
 * starting default (not invented ad hoc — it mirrors the same order-of-magnitude used for
 * other "enough data to trust a metric" gates in this codebase, e.g. pp.small_order_threshold_units)
 * pending owner tuning. NEVER ask the owner for this number in chat (Q-40).
 */
const DEFAULT_MIN_FORECAST_ORDERS = 10;

export interface DemandForecastItem {
  productId: number;
  productName: string;
  unit: string;
  currentMonthDemand: number;
  forecastNext1Month: number;
  forecastNext3Months: number;
  confidence: number;
  trend: 'up' | 'down' | 'flat';
  modelName: string;
}

export interface DemandForecastOk {
  status: 'ok';
  items: DemandForecastItem[];
  minRequiredOrders: number;
  currentOrders: number;
}

export interface DemandForecastInsufficientHistory {
  status: 'insufficient_history';
  minRequiredOrders: number;
  currentOrders: number;
  message: string;
  items: [];
}

export type DemandForecastResponse = DemandForecastOk | DemandForecastInsufficientHistory;

interface MonthlySeriesRow {
  productId: number;
  productName: string;
  unit: string;
  ym: string;
  qty: string | number;
}

interface ProductSeries { name: string; unit: string; series: number[] }

@Injectable()
export class DemandForecastService {
  private readonly logger = new Logger(DemandForecastService.name);

  constructor(private readonly forecastSvc: ForecastService) {}

  async getDemandForecast(): Promise<Result<DemandForecastResponse>> {
    return safeCall<DemandForecastResponse>(async () => {
      const minRequiredOrders = await getBusinessSettingNumber('ai.forecast_min_orders', DEFAULT_MIN_FORECAST_ORDERS);
      const currentOrders = await this.countHistoricalOrders();

      if (currentOrders < minRequiredOrders) {
        this.logger.log(`Demand forecast skipped: insufficient history (${currentOrders}/${minRequiredOrders} orders)`);
        return {
          status: 'insufficient_history',
          minRequiredOrders,
          currentOrders,
          message: `Talab bashorati uchun kamida ${minRequiredOrders} ta tarixiy savdo buyurtmasi kerak (hozircha ${currentOrders} ta mavjud). Ko'proq buyurtma qo'shilgach bashorat avtomatik hisoblanadi.`,
          items: [],
        };
      }

      const rows = await this.fetchMonthlySeries();
      const items = await this.buildForecastItems(rows);
      return { status: 'ok', items, minRequiredOrders, currentOrders };
    });
  }

  /** Real count of non-deleted, non-cancelled historical sales orders (with ≥1 line item). */
  private async countHistoricalOrders(): Promise<number> {
    const r = await runQuery<{ cnt: string }>(sql`
      SELECT COUNT(DISTINCT so.id)::text AS cnt
      FROM sales_orders so
      JOIN sales_order_items soi ON soi.sales_order_id = so.id
      WHERE so.deleted_at IS NULL
        AND COALESCE(so.status, '') NOT ILIKE 'cancelled'
        AND so.created_at > NOW() - (${FORECAST_LOOKBACK_MONTHS} * INTERVAL '1 month')
    `);
    return Number(r.rows[0]?.cnt ?? 0);
  }

  /** Real monthly qty-per-product series from sales_order_items, joined to products for label/unit. */
  private async fetchMonthlySeries(): Promise<MonthlySeriesRow[]> {
    const r = await runQuery<MonthlySeriesRow>(sql`
      SELECT
        p.id AS "productId",
        p.name AS "productName",
        COALESCE(p.unit, 'dona') AS unit,
        to_char(date_trunc('month', so.created_at), 'YYYY-MM') AS ym,
        SUM(soi.order_quantity)::float AS qty
      FROM sales_order_items soi
      JOIN sales_orders so ON so.id = soi.sales_order_id
      JOIN products p ON p.id = soi.product_id
      WHERE so.deleted_at IS NULL
        AND COALESCE(so.status, '') NOT ILIKE 'cancelled'
        AND so.created_at > NOW() - (${FORECAST_LOOKBACK_MONTHS} * INTERVAL '1 month')
        AND soi.product_id IS NOT NULL
      GROUP BY p.id, p.name, p.unit, ym
      ORDER BY p.id, ym
    `);
    return Array.isArray(r.rows) ? r.rows : [];
  }

  /** Groups the flat monthly rows by product, then runs the EMA forecaster per product. */
  private async buildForecastItems(rows: MonthlySeriesRow[]): Promise<DemandForecastItem[]> {
    const byProduct = new Map<number, ProductSeries>();
    for (const row of Array.isArray(rows) ? rows : []) {
      const pid = Number(row.productId);
      const entry = byProduct.get(pid) ?? { name: row.productName, unit: row.unit, series: [] };
      entry.series.push(safeNum(row.qty));
      byProduct.set(pid, entry);
    }

    const items: DemandForecastItem[] = [];
    for (const [productId, { name, unit, series }] of byProduct) {
      const item = await this.forecastOneProduct(productId, name, unit, series);
      if (item) items.push(item);
    }
    return items.sort((a, b) => b.forecastNext3Months - a.forecastNext3Months);
  }

  /** ForecastService.forecastEma() requires ≥2 points — products below that are skipped
   *  (not enough of their own history yet), same "don't fake it" rule as the top-level gate. */
  private async forecastOneProduct(
    productId: number,
    productName: string,
    unit: string,
    series: number[],
  ): Promise<DemandForecastItem | null> {
    if (series.length < 2) return null;

    const emaR = await this.forecastSvc.forecastEma(series, FORECAST_HORIZON_MONTHS);
    if (!emaR.ok) return null;

    const { predicted, metrics } = emaR.data;
    const currentMonthDemand = series[series.length - 1] ?? 0;
    const forecastNext1Month = predicted[0] ?? 0;
    const forecastNext3Months = predicted.reduce((s, v) => s + v, 0);
    // MAPE-derived confidence (0-100%), clamped to a sane display band.
    const confidence = roundTo(clamp(100 - safeNum(metrics.mape), 5, 95), 0);
    const EPS = 0.01;
    const trend: 'up' | 'down' | 'flat' =
      forecastNext1Month > currentMonthDemand * (1 + EPS) ? 'up' :
      forecastNext1Month < currentMonthDemand * (1 - EPS) ? 'down' : 'flat';

    return {
      productId,
      productName,
      unit,
      currentMonthDemand: roundTo(currentMonthDemand, 2),
      forecastNext1Month: roundTo(forecastNext1Month, 2),
      forecastNext3Months: roundTo(forecastNext3Months, 2),
      confidence,
      trend,
      modelName: 'EMA (α grid-search, TZ-06)',
    };
  }
}
