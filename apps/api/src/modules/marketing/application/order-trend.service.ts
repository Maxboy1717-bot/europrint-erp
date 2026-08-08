/**
 * @module order-trend.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Vision 14-marketing #12 (dup #55/#63) — "Kichiklashgan buyurtma" signali. Surfaces
 * customers whose RECENT order money-value has dropped below their own HISTORICAL
 * average, keyed strictly on money value (sales_orders.total_amount), not size or
 * quantity. The base signal (recent-avg < historical-avg) needs no threshold; an
 * OPTIONAL owner-tunable minimum decline-% is read from marketing_settings KV
 * (key 'marketing.order_trend.min_decline_pct', default 0).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { DrizzleMarketingExtRepository } from '../infrastructure/repositories/drizzle-marketing-ext.repo';

/** Compare only the single most-recent order against prior-order history. */
const RECENT_WINDOW = 1;
/** Minimum total orders before a per-customer money-value trend is meaningful. */
const MIN_ORDERS_FOR_TREND = 3;

/** One flagged customer whose order money-value is shrinking. */
export interface OrderTrendSignalRow {
  customerId: number;
  customerName: string;
  orderCount: number;
  recentAvg: number;
  historicalAvg: number;
  /** (historicalAvg - recentAvg) / historicalAvg * 100, one decimal. */
  declinePct: number;
}

export interface OrderTrendSignal {
  signals: OrderTrendSignalRow[];
  /** Owner-tunable minimum decline-% applied (marketing_settings, default 0). */
  minDeclinePct: number;
  total: number;
  /** True when NO customer has shrinking order value — honest empty, not fabricated. */
  empty: boolean;
}

@Injectable()
export class OrderTrendService {
  private readonly logger = new Logger(OrderTrendService.name);

  constructor(private readonly repo: DrizzleMarketingExtRepository) {}

  /**
   * "Kichiklashgan buyurtma" — customers whose latest order value dropped below their
   * historical average. The repo returns every shrinking customer; the OPTIONAL
   * marketing_settings threshold filters out drops smaller than the owner-set percent
   * (default 0 = show all real drops). Honest-empty when none qualify.
   */
  async getOrderValueTrend(): Promise<Result<OrderTrendSignal>> {
    const thrRes = await this.repo.getOrderTrendMinDeclinePct();
    if (!thrRes.ok) return Err(thrRes.error);
    const minDeclinePct = thrRes.data;

    const trendRes = await this.repo.getOrderValueTrend(RECENT_WINDOW, MIN_ORDERS_FOR_TREND);
    if (!trendRes.ok) return Err(trendRes.error);

    const signals = trendRes.data.filter((r) => r.declinePct >= minDeclinePct);

    return Ok<OrderTrendSignal>({
      signals,
      minDeclinePct,
      total: signals.length,
      empty: signals.length === 0,
    });
  }
}
