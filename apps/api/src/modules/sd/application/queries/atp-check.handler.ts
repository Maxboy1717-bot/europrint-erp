/**
 * @module atp-check.handler
 * @description CQRS query handler: SD order-entry ATP (Available-To-Promise) check.
 *
 * Vision: EP-PP-066 / EP-PP-024 / CHAT-TARIXI line 25 — at order entry the salesperson
 * sees, in real time, whether the ordered finished goods are in stock and an estimated
 * availability date ("yetmasa qizil + taxminiy sana"). This is the DETERMINISTIC, NON-AI
 * part of the planning vision: stock only. No AI key, no owner-gated number.
 *
 * Orders bind to finished-good products (sales_order_items.product_id — owner 2026-06-05),
 * not raw materialCards — see i-sales-order.repo.ts SalesOrderLineInput. Finished goods are
 * made-to-order via production rather than replenished from a supplier, so there is no
 * per-product lead time master data; every short/unknown line uses the same conservative
 * ATP_DEFAULT_LEAD_TIME_DAYS default (EP-PP-065) used elsewhere when a lead time is unknown.
 *
 * Logic (per line):
 *   demand     = ordered quantity
 *   available  = products.stock_quantity for the product
 *   shortage   = max(0, demand - available)
 *   leadDays   = ATP_DEFAULT_LEAD_TIME_DAYS (no per-product lead-time master data)
 *   status     = in_stock (shortage == 0) | short (shortage > 0) | unknown_product (no card)
 *   availableOn= today                  when in_stock
 *              = today + leadDays (days) when short
 * Order-level:
 *   overallStatus  = unknown_product > short > in_stock (worst line wins)
 *   estimatedReady = latest availableOn across lines (max)
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
import {
  ATP_DEFAULT_LEAD_TIME_DAYS,
  ATP_IN_STOCK_DAYS,
} from '@common/constants/business.constants';
import {
  DrizzleSdAtpRepository,
  AtpDemandLine,
  AtpSupplyRow,
} from '../../infrastructure/repositories/drizzle-sd-atp.repo';
import { AtpLine } from '../../presentation/dto/atp-check.dto';

export type AtpLineStatus = 'in_stock' | 'short' | 'unknown_product';

export interface AtpLineResult {
  productId: number;
  productName: string | null;
  unit: string | null;
  demand: number;
  available: number;
  shortage: number;
  leadTimeDays: number;
  leadTimeIsDefault: boolean;
  status: AtpLineStatus;
  /** ISO date (yyyy-mm-dd) when this line can be promised. */
  availableOn: string;
}

export interface AtpCheckResult {
  orderId: number | null;
  overallStatus: AtpLineStatus;
  /** Latest availableOn across all lines (ISO yyyy-mm-dd). The order's estimated ready date. */
  estimatedReadyDate: string;
  /** Whole calendar days from today to estimatedReadyDate (0 = ready today). */
  estimatedReadyInDays: number;
  allInStock: boolean;
  lines: AtpLineResult[];
}

export class AtpCheckQuery {
  constructor(
    public readonly orderId: number | null,
    public readonly items: AtpLine[] | null,
  ) {}
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@QueryHandler(AtpCheckQuery)
export class AtpCheckHandler implements IQueryHandler<AtpCheckQuery> {
  private readonly logger = new Logger(AtpCheckHandler.name);

  constructor(
    private readonly atpRepo: DrizzleSdAtpRepository,
    private readonly time: TashkentTimeService,
  ) {}

  async execute(query: AtpCheckQuery): Promise<Result<AtpCheckResult>> {
    // 1) Resolve demand lines — either from the saved order or the inline preview body.
    let demand: AtpDemandLine[];
    if (query.orderId != null) {
      const linesRes = await this.atpRepo.findOrderDemandLines(query.orderId);
      if (!linesRes.ok) return Err(linesRes.error);
      if (linesRes.data.length === 0) {
        return Err(AppErr('NOT_FOUND', 'Order has no product-bound lines to check'));
      }
      demand = linesRes.data;
    } else {
      demand = (query.items ?? []).map((it) => ({ productId: it.productId, quantity: it.quantity }));
      if (demand.length === 0) {
        return Err(AppErr('VALIDATION', 'No lines supplied for ATP check'));
      }
    }

    // 2) Aggregate demand per product (same product may appear on multiple lines).
    const demandByProduct = new Map<number, number>();
    for (const d of demand) {
      demandByProduct.set(d.productId, (demandByProduct.get(d.productId) ?? 0) + d.quantity);
    }

    // 3) Read real supply facts in one query.
    const supplyRes = await this.atpRepo.findSupply([...demandByProduct.keys()]);
    if (!supplyRes.ok) return Err(supplyRes.error);
    const supplyByProduct = new Map<number, AtpSupplyRow>();
    for (const s of supplyRes.data) supplyByProduct.set(s.productId, s);

    // 4) Compute per-line ATP.
    const today = this.time.today();
    const lines: AtpLineResult[] = [];
    for (const [productId, totalDemand] of demandByProduct.entries()) {
      const supply = supplyByProduct.get(productId);
      const available = supply?.available ?? 0;
      const shortage = Math.max(0, totalDemand - available);
      const productExists = supply?.productExists ?? false;

      // Finished goods have no per-product lead-time master data (made-to-order via
      // production, not supplier-replenished) — always fall back to the conservative default.
      const leadTimeIsDefault = true;
      const leadTimeDays = ATP_DEFAULT_LEAD_TIME_DAYS;

      let status: AtpLineStatus;
      if (!productExists) status = 'unknown_product';
      else if (shortage > 0) status = 'short';
      else status = 'in_stock';

      // In-stock ⇒ today; short or unknown ⇒ today + lead time (must be produced).
      const daysOut = status === 'in_stock' ? ATP_IN_STOCK_DAYS : leadTimeDays;
      const availableOn = this.time.addDays(today, daysOut);

      lines.push({
        productId,
        productName: supply?.productName ?? null,
        unit: supply?.unit ?? null,
        demand: totalDemand,
        available,
        shortage,
        leadTimeDays,
        leadTimeIsDefault,
        status,
        availableOn: isoDate(availableOn),
      });
    }

    // 5) Order-level rollup: worst status, latest date.
    const hasUnknown = lines.some((l) => l.status === 'unknown_product');
    const hasShort = lines.some((l) => l.status === 'short');
    const overallStatus: AtpLineStatus = hasUnknown ? 'unknown_product' : hasShort ? 'short' : 'in_stock';

    let estimatedReady = today;
    for (const l of lines) {
      const d = new Date(`${l.availableOn}T00:00:00.000Z`);
      if (d.getTime() > estimatedReady.getTime()) estimatedReady = d;
    }
    const estimatedReadyInDays = Math.max(
      0,
      Math.round((this.time.startOfDay(estimatedReady).getTime() - today.getTime()) / 86_400_000),
    );

    this.logger.debug({
      msg: 'ATP check computed',
      orderId: query.orderId,
      overallStatus,
      lines: lines.length,
    });

    return Ok({
      orderId: query.orderId ?? null,
      overallStatus,
      estimatedReadyDate: isoDate(estimatedReady),
      estimatedReadyInDays,
      allInStock: overallStatus === 'in_stock',
      lines,
    });
  }
}
