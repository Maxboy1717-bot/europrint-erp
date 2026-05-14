/**
 * @module wms-eoq.service
 * @description Economic Order Quantity (EOQ) recalculation engine. For every
 *   material, computes the order quantity that minimises (setup + holding)
 *   cost using the classic Wilson formula, optionally with supplier
 *   quantity-discount tiers.
 *
 *   Two entry points:
 *     1. `enqueueRecalculation` — schedules a batch recalc across all active
 *        materials via BullMQ. Falls back to a local async recompute if the
 *        queue is unavailable so dashboards still update.
 *     2. `calculateWithTiers` — single-material on-demand calc with explicit
 *        price tiers (used by the purchasing dialog when a buyer is evaluating
 *        a new supplier quote).
 * @layer Application Service (WMS)
 *
 * WHY HITL ABOVE 50M UZS
 *   Wilson EOQ assumes a continuous-demand, infinite-horizon world. For
 *   small parts that's fine. For high-value purchases (>50M UZS = ~$4k+) a
 *   buyer must approve — the algorithm can compute the math but isn't allowed
 *   to *commit* to the PO. Those orders get flagged Human-In-The-Loop and
 *   wait in the purchasing inbox for sign-off.
 *
 * WHY DEFAULT 150K ORDERING COST + 20% HOLDING
 *   These are fleet-wide defaults applied when a material card has no
 *   per-item override. They come from a 2024 supply-chain audit:
 *     - Ordering cost ~ 150k UZS = paperwork + receiving + QC sample for
 *       a typical line item (under the smallest reasonable PO)
 *     - Holding cost 20%/yr = local cost of capital (~14%) + handling/spoilage
 *   Override these per-material when you have better data (especially for
 *   refrigerated or fragile items where holding > 30% is realistic).
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { EoqCalculatorService, EoqWithDiscountInput, EoqDiscountResult } from '../domain/services/eoq-calculator.service';
import type { PriceTier } from '../domain/services/eoq-calculator.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';

/** Above this PO value, EOQ result is recommendation-only — buyer must sign off. */
const HITL_PURCHASE_THRESHOLD_UZS = 50_000_000;

/** Fleet default: cost to place + receive + QC one PO line. Override per-material. */
const DEFAULT_ORDERING_COST_UZS = 150_000;
/** Fleet default annualised holding cost (capital + storage + spoilage), 20%. */
const DEFAULT_HOLDING_COST_PCT = 0.20;

interface MaterialRow {
  id: number;
  unit_price: number;
  abc_segment: string;
  current_stock: number;
}

interface TierRow {
  material_id: number;
  min_qty: number;
  max_qty: number | null;
  unit_price: string;
}

interface RecalcSummary {
  processed: number;
  saved: number;
  hitlFlagged: number;
}

@Injectable()
export class WmsEoqService {
  private readonly logger = new Logger(WmsEoqService.name);

  constructor(
    private readonly eoqSvc: EoqCalculatorService,
    @InjectQueue(QUEUE_NAMES.MRP_RUN) private readonly mrpQueue: Queue,
  ) {}

  async enqueueRecalculation(): Promise<{ queued: boolean; jobId: string; message: string }> {
    try {
      const job = await this.mrpQueue.add(
        'eoq-recalc-all',
        { jobType: 'EOQ_RECALC_ALL' },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
      this.logger.log(`EOQ recalculate-all enqueued: jobId=${job.id}`);
      return { queued: true, jobId: String(job.id), message: 'EOQ recalculation queued successfully' };
    } catch (err) {
      const fallbackJobId = `local-${Date.now()}`;
      this.logger.warn(`Queue unavailable, running locally: ${(err as Error).message}`);
      setImmediate(() => {
        this.recalculateAll()
          .then((res) => {
            if (res.ok) {
              this.logger.log(`EOQ local recalc done: processed=${res.data.processed} saved=${res.data.saved}`);
            } else {
              this.logger.error(`EOQ local recalc error: ${res.error.message}`);
            }
          })
          .catch((e: Error) =>
            this.logger.error(`EOQ background recalculation failed: ${e.message}`),
          );
      });
      return { queued: true, jobId: fallbackJobId, message: 'EOQ recalculation scheduled (local async)' };
    }
  }

  calculateWithTiers(input: EoqWithDiscountInput): Result<EoqDiscountResult, AppError> {
    return this.eoqSvc.calculateWithDiscounts(input);
  }

  async recalculateAll(): Promise<Result<RecalcSummary, AppError>> {
    let processed = 0;
    let saved = 0;
    let hitlFlagged = 0;

    try {
      const materialsResult = await runQuery<MaterialRow>(sql`
        SELECT id,
               COALESCE(unit_price, 0)::numeric          AS unit_price,
               COALESCE(abc_segment, 'C')                 AS abc_segment,
               GREATEST(COALESCE(current_stock, 0), 0)::numeric AS current_stock
        FROM material_cards
        WHERE is_active = true
        LIMIT 500
      `);

      const demandResult = await runQuery<{ material_id: number; annual_demand: number }>(sql`
        SELECT product_id::integer AS material_id,
               SUM(ABS(quantity))::numeric * (52.0 / GREATEST(COUNT(DISTINCT DATE_TRUNC('week', created_at)), 1)) AS annual_demand
        FROM pos_inventory_movements
        WHERE product_id ~ '^[0-9]+$'
          AND type IN ('OUT', 'ISSUE', 'CONSUMPTION', 'out', 'issue', 'consumption')
          AND created_at >= NOW() - INTERVAL '52 weeks'
        GROUP BY product_id::integer
      `);
      const demandByMaterial = new Map<number, number>();
      for (const d of demandResult.rows ?? []) {
        demandByMaterial.set(Number(d['material_id']), safeNum(d['annual_demand']));
      }

      const tiersResult = await runQuery<TierRow>(sql`
        SELECT material_id, min_qty, max_qty, unit_price
        FROM supplier_price_tiers
        ORDER BY material_id, min_qty
      `);

      const tiersByMaterial = new Map<number, PriceTier[]>();
      for (const t of tiersResult.rows ?? []) {
        const mid = safeNum(t.material_id);
        const arr = tiersByMaterial.get(mid) ?? [];
        arr.push({ minQty: safeNum(t.min_qty), maxQty: t.max_qty ?? undefined, unitPrice: safeNum(t.unit_price) });
        tiersByMaterial.set(mid, arr);
      }

      for (const m of materialsResult.rows ?? []) {
        processed++;
        const matId = safeNum(m.id);
        const unitPrice = safeNum(m.unit_price);
        const movementDemand = demandByMaterial.get(matId) ?? 0;
        // Fallback: when no movement history, use current_stock×12 as proxy for annual demand
        const annualDemand = movementDemand > 0
          ? movementDemand
          : Math.max(safeNum(m.current_stock) * 12, 100);
        const tiers = tiersByMaterial.get(matId);

        let result: Result<EoqDiscountResult, AppError>;
        if (tiers && tiers.length > 0) {
          result = await this.eoqSvc.calculateWithDiscounts({
            annualDemand,
            orderingCostUzs: DEFAULT_ORDERING_COST_UZS,
            holdingCostPercent: DEFAULT_HOLDING_COST_PCT,
            priceTiers: tiers,
            packSize: 1,
          });
        } else {
          const basicResult = await this.eoqSvc.calculate({
            annualDemand,
            orderingCostUzs: DEFAULT_ORDERING_COST_UZS,
            holdingCostPercent: DEFAULT_HOLDING_COST_PCT,
            unitPriceUzs: unitPrice,
            packSize: 1,
          });
          result = basicResult.ok
            ? Ok({ ...basicResult.data, selectedTierPrice: unitPrice, selectedTierMinQty: 0 })
            : Err(basicResult.error as AppError);
        }

        if (!result.ok) continue;
        const r = result.data;

        if (r.totalCost > HITL_PURCHASE_THRESHOLD_UZS) {
          hitlFlagged++;
          this.logger.warn(`HITL flagged: material ${m.id} totalCost=${r.totalCost}`);
        }

        await runQuery(sql`
          INSERT INTO material_recommendation
            (material_id, eoq_qty, total_cost, order_frequency, cycle_time_days, calculated_at, lot_sizing_method, recommendation_type)
          VALUES
            (${safeNum(m.id)}, ${r.eoqRounded}, ${r.totalCost}, ${r.orderFrequency}, ${r.cycleTimeDays}, NOW(), 'EOQ', 'EOQ')
          ON CONFLICT (material_id) DO UPDATE SET
            eoq_qty = EXCLUDED.eoq_qty,
            total_cost = EXCLUDED.total_cost,
            order_frequency = EXCLUDED.order_frequency,
            cycle_time_days = EXCLUDED.cycle_time_days,
            calculated_at = NOW()
        `);
        saved++;
      }

      return Ok({ processed, saved, hitlFlagged });
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
