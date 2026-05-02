/**
 * mrp-run.processor.ts — BullMQ 'mrp-run' navbat workeri.
 *
 * Qo'llab-quvvatlanadigan job turlari:
 *   1. MRP BOM explosion (productIds + planningHorizonDays)
 *   2. EOQ_RECALC_ALL   — barcha materiallar uchun EOQ qayta hisoblash (TZ-02)
 *      Narx bloklari mavjud bo'lsa EoqCalculatorService.calculateWithDiscounts() ishlatiladi,
 *      aks holda calculateWithDiscounts() bilan taqiqlangan standart blok.
 *   3. SAFETY_STOCK_REFRESH — EWM α=0.2 + ABC Z-score asosida xavfsiz zaxira (TZ-04)
 *      SafetyStockService.calculate() orqali — domain xizmat qayta ishlatiladi.
 *
 * Concurrency: 1 (og'ir hisoblash, parallel emas)
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { sql } from 'drizzle-orm';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';
import { BomExplosionService } from '../../pp/domain/services/bom-explosion.service';
import { EoqCalculatorService } from '../../wms/domain/services/eoq-calculator.service';
import { SafetyStockService } from '../../wms/domain/services/safety-stock.service';
import type { PriceTier } from '../../wms/domain/services/eoq-calculator.service';
import type { AbcClass } from '../../wms/domain/services/safety-stock.service';
import { runQuery } from '@shared/db';

export interface MrpRunJobData {
  planningHorizonDays?: number;
  productIds?: string[];
  warehouseId?: string;
  triggeredBy: string;
  jobType?: 'EOQ_RECALC_ALL' | 'SAFETY_STOCK_REFRESH';
}

@Processor(QUEUE_NAMES.MRP_RUN, { concurrency: 1 })
export class MrpRunProcessor extends WorkerHost {
  private readonly logger = new Logger(MrpRunProcessor.name);

  constructor(
    private readonly bomService: BomExplosionService,
    private readonly eoqSvc: EoqCalculatorService,
    private readonly ssSvc: SafetyStockService,
  ) {
    super();
  }

  async process(job: Job<MrpRunJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(`[mrp] Job #${job.id} type=${job.data.jobType ?? 'MRP'} backoff=${delay}ms`);

    try {
      if (job.data.jobType === 'EOQ_RECALC_ALL') {
        await this.runEoqRecalcAll();
      } else if (job.data.jobType === 'SAFETY_STOCK_REFRESH') {
        await this.runSafetyStockRefresh();
      } else {
        await this.runMrpBomExplosion(job.data);
      }
      this.logger.log(`[mrp] Job #${job.id} muvaffaqiyatli yakunlandi`);
    } catch (err) {
      this.logger.error(`[mrp] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async runMrpBomExplosion(data: MrpRunJobData): Promise<void> {
    const productIds = Array.isArray(data.productIds) ? data.productIds : [];
    if (productIds.length === 0) {
      throw new Error('[mrp] productIds bo\'sh — kamida bitta mahsulot talab qilinadi');
    }

    let totalNodes = 0;
    const failedIds: string[] = [];

    for (const productId of productIds) {
      const result = await this.bomService.explodeFromDb(productId, 1);
      if (result.ok) {
        totalNodes += result.data.totalNodes;
      } else {
        this.logger.warn(`[mrp] BOM explosion xato: productId=${productId} — ${result.error.message}`);
        failedIds.push(productId);
      }
    }

    this.logger.log(
      `[mrp] BOM yakunlandi: mahsulotlar=${productIds.length}, tugunlar=${totalNodes}, ` +
      `xato=${failedIds.length}, horizon=${data.planningHorizonDays ?? 0}d`,
    );

    if (failedIds.length > 0) {
      throw new Error(`[mrp] ${failedIds.length}/${productIds.length} mahsulot BOM explosion muvaffaqiyatsiz`);
    }
  }

  /**
   * TZ-02: EOQ qayta hisoblash — barcha materiallar uchun material_recommendation yangilash.
   *
   * Narx bloklari mavjud bo'lsa: EoqCalculatorService.calculateWithDiscounts() — All-Units model
   * Narx bloklari yo'q bo'lsa:  EoqCalculatorService.calculateWithDiscounts() bilan yagona standart blok
   */
  private async runEoqRecalcAll(): Promise<void> {
    // Uses only existing material_cards columns (no annual_demand/ordering_cost_uzs/holding_cost_percent).
    // Annual demand is derived from pos_inventory_movements (52-week look-back), falling back
    // to current_stock×12 when no movement data exists.
    const demandRows = await runQuery(sql`
      SELECT product_id::integer AS material_id,
             SUM(ABS(quantity))::numeric
               * (52.0 / GREATEST(COUNT(DISTINCT DATE_TRUNC('week', created_at)), 1)) AS annual_demand
      FROM pos_inventory_movements
      WHERE product_id ~ '^[0-9]+$'
        AND type IN ('OUT','ISSUE','CONSUMPTION','out','issue','consumption')
        AND created_at >= NOW() - INTERVAL '52 weeks'
      GROUP BY product_id::integer
    `).catch(() => ({ rows: [] as Record<string, unknown>[] }));

    const demandByMaterial = new Map<number, number>();
    for (const d of demandRows.rows ?? []) {
      demandByMaterial.set(Number(d['material_id']), Number(d['annual_demand']) || 0);
    }

    const matRows = await runQuery(sql`
      SELECT mc.id AS material_id,
             GREATEST(COALESCE(mc.current_stock, 0) * 12, 100)::numeric AS stock_based_demand,
             50000::numeric AS ordering_cost,
             CASE COALESCE(mc.abc_segment, 'C')
               WHEN 'A' THEN 0.20
               WHEN 'B' THEN 0.25
               ELSE 0.30
             END::numeric AS holding_cost_pct,
             COALESCE(mc.last_purchase_price, mc.unit_price, 1000)::numeric AS unit_price,
             COALESCE(ip.lead_time_days, 7)::integer AS lead_time_days
      FROM material_cards mc
      LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
      WHERE mc.is_active = true
      LIMIT 2000
    `);

    const tierRows = await runQuery(sql`
      SELECT supplier_id::text AS supplier_id,
             material_id,
             COALESCE(min_qty, 0)::numeric AS min_qty,
             max_qty::numeric AS max_qty,
             unit_price::numeric AS unit_price
      FROM supplier_price_tiers
      ORDER BY material_id, min_qty
    `).catch((e: Error) => {
      this.logger.warn(`supplier_price_tiers query failed, proceeding without discount tiers: ${e.message}`);
      return { rows: [] };
    });

    const tiersByMaterial = new Map<number, PriceTier[]>();
    for (const tr of tierRows.rows ?? []) {
      const matId = Number(tr['material_id']);
      if (!tiersByMaterial.has(matId)) tiersByMaterial.set(matId, []);
      tiersByMaterial.get(matId)!.push({
        minQty: Number(tr['min_qty']) || 0,
        maxQty: tr['max_qty'] != null ? Number(tr['max_qty']) : undefined,
        unitPrice: Number(tr['unit_price']) || 0,
      });
    }

    let updated = 0;
    for (const r of matRows.rows ?? []) {
      const matId = Number(r['material_id']);
      const movementDemand = demandByMaterial.get(matId) ?? 0;
      const stockDemand = Number(r['stock_based_demand']) || 100;
      const D = movementDemand > 0 ? movementDemand : stockDemand;
      const S = Number(r['ordering_cost']) || 50000;
      const I = Number(r['holding_cost_pct']) || 0.25;
      const defaultPrice = Number(r['unit_price']) || 1000;

      const tiers: PriceTier[] = tiersByMaterial.get(matId) ?? [
        { minQty: 0, unitPrice: defaultPrice },
      ];

      const eoqResult = this.eoqSvc.calculateWithDiscounts({
        annualDemand: D,
        orderingCostUzs: S,
        holdingCostPercent: I,
        priceTiers: tiers,
      });

      if (!eoqResult.ok) {
        this.logger.warn(`[eoq-recalc] material_id=${matId}: ${eoqResult.error.message}`);
        continue;
      }

      const { eoqRounded, totalCost, orderFrequency, cycleTimeDays } = eoqResult.data;

      await runQuery(sql`
        INSERT INTO material_recommendation
          (material_id, eoq_qty, total_cost, order_frequency, cycle_time_days, calculated_at, lot_sizing_method, recommendation_type)
        VALUES
          (${matId}, ${eoqRounded}, ${totalCost}, ${orderFrequency}, ${cycleTimeDays}, NOW(), 'EOQ', 'EOQ')
        ON CONFLICT (material_id) DO UPDATE SET
          eoq_qty = EXCLUDED.eoq_qty,
          total_cost = EXCLUDED.total_cost,
          order_frequency = EXCLUDED.order_frequency,
          cycle_time_days = EXCLUDED.cycle_time_days,
          calculated_at = NOW(),
          lot_sizing_method = 'EOQ'
      `);

      await runQuery(sql`
        INSERT INTO inventory_policy (material_id, eoq, updated_at)
        VALUES (${matId}, ${eoqRounded}, NOW())
        ON CONFLICT (material_id) DO UPDATE SET
          eoq = EXCLUDED.eoq,
          updated_at = NOW()
      `);

      updated++;
    }

    this.logger.log(`[eoq-recalc] ${updated} material yangilandi`);
  }

  /**
   * TZ-04: Safety Stock yangilash — SafetyStockService orqali (EWM + ABC Z-scores).
   *
   * SafetyStockService.calculate() ishlatiladi — domain xizmat qayta ishlatiladi.
   * SS = Z × sqrt(L̄ × σ_d² + d̄² × σ_L²)
   * Z-scores: A=2.326 (99%), B=1.645 (95%), C=1.282 (90%)
   */
  private async runSafetyStockRefresh(): Promise<void> {
    const matRows = await runQuery(sql`
      SELECT mc.id AS material_id,
             COALESCE(ip.abc_class, 'C') AS abc_class,
             COALESCE(ip.lead_time_days, 7)::integer AS lead_time_days
      FROM material_cards mc
      LEFT JOIN inventory_policy ip ON ip.material_id = mc.id
      WHERE mc.is_active = true
      LIMIT 2000
    `);

    let updated = 0;
    for (const r of matRows.rows ?? []) {
      const matId = Number(r['material_id']);
      const abcClass = (String(r['abc_class'] ?? 'C').toUpperCase().slice(0, 1)) as AbcClass;
      const leadTimeDays = Number(r['lead_time_days']) || 7;

      // 365-day daily-demand basis from goods movements (spec requirement)
      const demandRows = await runQuery(sql`
        SELECT COALESCE(SUM(ABS(quantity)), 0)::numeric AS daily_demand
        FROM pos_inventory_movements
        WHERE product_id ~ '^[0-9]+$'
          AND product_id::integer = ${matId}
          AND type IN ('OUT', 'ISSUE', 'CONSUMPTION', 'out', 'issue', 'consumption')
          AND created_at >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
        LIMIT 365
      `).catch((e: Error) => {
        this.logger.warn(`Demand history query failed for material ${matId}: ${e.message}`);
        return { rows: [] };
      });

      const dailyDemands = (demandRows.rows ?? []).map((d: Record<string, unknown>) => Number(d['daily_demand']) || 0);

      if (dailyDemands.length < 2) continue;

      const ltRows = await runQuery(sql`
        SELECT EXTRACT(DAY FROM (po.actual_delivery_date - po.created_at))::numeric AS actual_lead_days
        FROM mm_purchase_orders po
        JOIN mm_purchase_order_items poi ON poi.purchase_order_id = po.id
        WHERE poi.material_id = ${matId}
          AND po.actual_delivery_date IS NOT NULL
          AND po.created_at >= NOW() - INTERVAL '12 months'
        ORDER BY po.created_at DESC
        LIMIT 12
      `).catch((e: Error) => {
        this.logger.warn(`Lead-time history query failed for material ${matId}: ${e.message}`);
        return { rows: [] };
      });

      const leadTimeSeries = (ltRows.rows ?? [])
        .map((row: Record<string, unknown>) => Math.max(0, Number(row['actual_lead_days']) || 0))
        .filter((d: number) => d > 0);

      const ssResult = this.ssSvc.calculate({
        dailyDemandSeries: dailyDemands,
        leadTimeDays,
        ...(leadTimeSeries.length >= 3 ? { leadTimeSeries } : {}),
        abcClass: ['A', 'B', 'C'].includes(abcClass) ? abcClass : 'C',
        useEwm: true,
      });

      if (!ssResult.ok) {
        this.logger.warn(`[safety-stock] material_id=${matId}: ${ssResult.error.message}`);
        continue;
      }

      const { safetyStock, avgDailyDemand } = ssResult.data;
      const rop = avgDailyDemand * leadTimeDays + safetyStock;

      await runQuery(sql`
        INSERT INTO inventory_policy (material_id, safety_stock, reorder_point, updated_at)
        VALUES (${matId}, ${safetyStock}, ${rop}, NOW())
        ON CONFLICT (material_id) DO UPDATE SET
          safety_stock = EXCLUDED.safety_stock,
          reorder_point = EXCLUDED.reorder_point,
          updated_at = NOW()
      `);

      updated++;
    }

    this.logger.log(`[safety-stock-refresh] ${updated} material yangilandi`);
  }
}
