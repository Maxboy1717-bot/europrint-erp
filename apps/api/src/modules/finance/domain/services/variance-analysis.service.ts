/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600.0 timestamp arithmetic
 *   for actual-hours computation, ABS(quantity) + AVG(cost_price::numeric) co-aggregate
 *   on stock_movements joined with stock_items, and enum-cast comparisons
 *   (status::text IN ('OUT','CONSUMPTION')) needed for variance MPV/MQV/LRV/LEV/OV
 *   inputs in a single round-trip per order.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module variance-analysis.service
 * @description Standard-cost vs. actual-cost variance analysis per production
 *   order. Decomposes the gap between what we *planned* a job should cost
 *   (BOM × standard prices + routing × standard rates) and what it *actually*
 *   cost (consumed materials + posted labour + applied overhead) into five
 *   named variances:
 *
 *     MPV — Material Price Variance       (actualPrice − stdPrice) × actualQty
 *     MQV — Material Quantity Variance    (actualQty   − stdQty)   × stdPrice
 *     LRV — Labour Rate Variance          (actualRate  − stdRate)  × actualHrs
 *     LEV — Labour Efficiency Variance    (actualHrs   − stdHrs)   × stdRate
 *     OV  — Overhead Volume Variance      Σ over/under-applied overhead
 *
 *   Each variance has a `Favourable / Unfavourable / Neutral` label so the
 *   CFO sees at a glance which knobs went the wrong way. Total = sum of the
 *   five, and `needsAudit` flags orders whose total variance exceeds the
 *   configured threshold (20% by default — see constant).
 * @layer Domain Service (Finance / cost accounting)
 *
 * WHY THIS DECOMPOSITION (and not just "actual − planned")
 *   A 10M UZS variance is the same headline whether materials were 10% more
 *   expensive or labour took twice as long. Decomposing tells the operations
 *   team WHICH lever moved:
 *     - MPV high → procurement / supplier negotiation
 *     - MQV high → scrap, waste, theft, line-loss
 *     - LRV high → wage inflation, overtime mix
 *     - LEV high → operator skill, machine downtime, training need
 *     - OV  high → mis-applied overhead rate, capacity utilisation
 *   This is the same 4-way split taught in every cost-accounting textbook.
 *
 * WHY 20% AUDIT THRESHOLD
 *   Standard-cost systems expect small drift (±5-10%). Anything beyond 20%
 *   indicates either a process problem or a mis-set standard. We flag for
 *   manual review rather than silently absorbing it into the period close.
 *
 * WHY OVERHEAD AND LABOR RATES COME FROM CFO CONFIG (not hardcoded)
 *   These rates change with wage agreements and overhead absorption policies
 *   (typically annually). Storing in `cfo_config` table lets the CFO update
 *   them without a deploy; the defaults (15k overhead/hr, 25k labour/hr UZS)
 *   are conservative seed values used when the row hasn't been set.
 *
 * WHY "Favourable / Unfavourable" labelling (not just signs)
 *   Sign convention is ambiguous: spending less than standard is "favourable"
 *   (good) but mathematically negative. We label explicitly so CFO email
 *   reports don't get misread by non-accountants.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';

const VARIANCE_AUDIT_THRESHOLD_PCT = 20;

export type { VarianceResult } from './variance-analysis.types';
import type { VarianceResult } from './variance-analysis.types';

type Row = Record<string, unknown>;

@Injectable()
export class VarianceAnalysisService {
  private readonly logger = new Logger(VarianceAnalysisService.name);

  constructor(private readonly cfoConfig: CfoConfigService) {}

  @Calculation('variance-analysis')
  async analyzeOrder(orderId: number): Promise<Result<VarianceResult, AppError>> {
    try {
      const [overheadRate, stdLaborRate] = await Promise.all([
        this.cfoConfig.getNumber('overhead_rate_per_hour', 15000),
        this.cfoConfig.getNumber('std_labor_rate_per_hour', 25000),
      ]);

      const orderRows = await runQuery<Row>(sql`
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
      const order = orderRows[0];
      if (!order) return Err(AppErr('NOT_FOUND', `Ishlab chiqarish buyurtmasi topilmadi: ${orderId}`));

      const plannedQty      = safeNum(order['planned_qty'], 1);
      const productName     = String(order['product_name'] ?? '');
      const productId       = order['product_id'] ? Number(order['product_id']) : null;
      const actualCostTotal = safeNum(order['actual_cost_total'], 0);
      const bomId           = order['bom_id']     ? Number(order['bom_id'])     : null;
      const routingId       = order['routing_id'] ? Number(order['routing_id']) : null;

      const [bomRows, routingRows, mesRows, stdCostRows, movementRows] = await Promise.all([
        bomId !== null
          ? runQuery<Row>(sql`SELECT items FROM boms WHERE id = ${bomId} LIMIT 1`)
          : Promise.resolve([] as Row[]),
        routingId !== null
          ? runQuery<Row>(sql`SELECT steps FROM routings WHERE id = ${routingId} LIMIT 1`)
          : Promise.resolve([] as Row[]),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600.0), 0) AS ah
          FROM mes_sessions ms
          WHERE ms.production_order_id::text = ${String(orderId)}
            AND ms.status::text = 'completed'
        `),
        productId !== null
          ? runQuery<Row>(sql`
              SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                     std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
              FROM standard_cost
              WHERE product_id = ${productId}
              ORDER BY period DESC LIMIT 1
            `)
          : runQuery<Row>(sql`
              SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                     std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
              FROM standard_cost
              WHERE product_name = ${productName}
              ORDER BY period DESC LIMIT 1
            `),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(ABS(sm.quantity)), 0) AS actual_material_qty,
                 COALESCE(AVG(si.cost_price::numeric), 0) AS actual_unit_price
          FROM stock_movements sm
          JOIN stock_items si ON si.id = sm.stock_item_id
          WHERE sm.reference_id::text = ${String(orderId)}
            AND sm.movement_type::text IN ('OUT', 'CONSUMPTION')
        `),
      ]);

      const stdCost      = stdCostRows[0];
      const bomItems     = this.parseBomItems(String(bomRows[0]?.['items'] ?? '[]'));
      const routingSteps = this.parseRoutingSteps(String(routingRows[0]?.['steps'] ?? '[]'));
      const mesRow       = mesRows[0];
      const movRow       = movementRows[0];

      const stdMaterialPerUnit = safeNum(stdCost?.['std_material_uzs'], 0);
      const stdLaborPerUnit    = safeNum(stdCost?.['std_labor_uzs'], 0);
      const stdOvhPerUnit      = safeNum(stdCost?.['std_overhead_uzs'], 0);
      const stdTotalPerUnit    = safeNum(stdCost?.['std_total'], stdMaterialPerUnit + stdLaborPerUnit + stdOvhPerUnit);

      const sqPerUnit = bomItems.reduce((sum, item) => sum + item.qty, 0);
      const spPerUnit = sqPerUnit > 0
        ? safeDiv(stdMaterialPerUnit, sqPerUnit)
        : stdMaterialPerUnit;
      const sq = sqPerUnit * plannedQty;
      const sp = spPerUnit;

      const ah  = safeNum(mesRow?.['ah'], 0);
      // Standard hours and rate from routing + standard cost config
      const sh  = routingSteps.reduce((sum, step) => sum + step.hours, 0) * plannedQty;
      const sr  = sh > 0
        ? Math.max(safeDiv(stdLaborPerUnit * plannedQty, sh), 0)
        : stdLaborRate;

      const aqMat = safeNum(movRow?.['actual_material_qty'], sq);
      const ap    = safeNum(movRow?.['actual_unit_price'], sp);
      const actualMatCost = roundTo(aqMat * ap, 2);

      const stdNonMat = stdLaborPerUnit + stdOvhPerUnit;
      const laborShareRatio = stdNonMat > 0 ? stdLaborPerUnit / stdNonMat : 0.6;
      const actualNonMatCost = actualCostTotal > 0
        ? Math.max(actualCostTotal - actualMatCost, 0)
        : 0;
      const actualLbrCost = actualNonMatCost > 0
        ? roundTo(actualNonMatCost * laborShareRatio, 2)
        : roundTo(ah * stdLaborRate, 2);
      const actualOvhCost = actualNonMatCost > 0
        ? roundTo(actualNonMatCost * (1 - laborShareRatio), 2)
        : roundTo(ah * overheadRate, 2);
      const ar = ah > 0 ? Math.max(safeDiv(actualLbrCost, ah), 0) : stdLaborRate;

      const appliedOH = roundTo(ah * overheadRate, 2);

      const mpv = roundTo((ap - sp) * aqMat, 2);
      const mqv = roundTo((aqMat - sq) * sp, 2);
      const lrv = roundTo((ar - sr) * ah, 2);
      const lev = roundTo((ah - sh) * sr, 2);
      const ov  = roundTo(appliedOH - actualOvhCost, 2);
      const totalVariance = roundTo(mpv + mqv + lrv + lev + ov, 2);
      const stdTotalOrder = roundTo(stdTotalPerUnit * plannedQty, 2);
      const actualTotalCost = actualCostTotal > 0
        ? roundTo(actualCostTotal, 2)
        : roundTo(stdTotalOrder + totalVariance, 2);
      const variancePct   = roundTo(safeDiv(Math.abs(totalVariance), Math.max(stdTotalOrder, 1)) * 100, 2);
      const needsAudit    = variancePct > VARIANCE_AUDIT_THRESHOLD_PCT;

      await this.saveVarianceReport(orderId, { mpv, mqv, lrv, lev, ov, totalVariance });
      if (needsAudit) {
        await this.createAuditTask(orderId, String(order['order_number'] ?? orderId), variancePct).catch(
          e => this.logger.warn(`Audit task yaratishda xato: ${String(e)}`),
        );
      }

      return Ok({
        orderId, orderNumber: String(order['order_number'] ?? ''),
        productName, productId, plannedQty,
        mpv, mqv, lrv, lev, ov, totalVariance,
        standardTotalCost: stdTotalOrder,
        actualTotalCost,
        variancePct, needsAudit,
        details: {
          mpvLabel: mpv < 0 ? 'Favourable' : mpv > 0 ? 'Unfavourable' : 'Neutral',
          mqvLabel: mqv < 0 ? 'Favourable' : mqv > 0 ? 'Unfavourable' : 'Neutral',
          lrvLabel: lrv < 0 ? 'Favourable' : lrv > 0 ? 'Unfavourable' : 'Neutral',
          levLabel: lev < 0 ? 'Favourable' : lev > 0 ? 'Unfavourable' : 'Neutral',
          ovLabel:  ov  > 0 ? 'Under-applied' : ov < 0 ? 'Over-applied' : 'Neutral',
        },
      });
    } catch (err) {
      this.logger.error(`VarianceAnalysisService.analyzeOrder xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  private parseBomItems(json: string): Array<{ qty: number; unitCost: number }> {
    try {
      const items = JSON.parse(json) as Array<Record<string, unknown>>;
      if (!Array.isArray(items)) return [];
      return items.map(i => ({
        qty:      safeNum(i['qty'] ?? i['quantity'], 0),
        unitCost: safeNum(i['unitCost'] ?? i['unit_cost'] ?? i['cost'], 0),
      }));
    } catch {
      return [];
    }
  }

  private parseRoutingSteps(json: string): Array<{ hours: number }> {
    try {
      const steps = JSON.parse(json) as Array<Record<string, unknown>>;
      if (!Array.isArray(steps)) return [];
      return steps.map(s => ({
        hours: safeNum(s['hours'] ?? s['duration_hours'] ?? s['durationHours'], 0),
      }));
    } catch {
      return [];
    }
  }

  private async saveVarianceReport(
    orderId: number,
    v: { mpv: number; mqv: number; lrv: number; lev: number; ov: number; totalVariance: number },
  ): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO variance_report (order_id, mpv, mqv, lrv, lev, ov, total_variance)
        VALUES (${orderId}, ${v.mpv}, ${v.mqv}, ${v.lrv}, ${v.lev}, ${v.ov}, ${v.totalVariance})
        ON CONFLICT (order_id) DO UPDATE
          SET mpv = EXCLUDED.mpv, mqv = EXCLUDED.mqv, lrv = EXCLUDED.lrv,
              lev = EXCLUDED.lev, ov = EXCLUDED.ov, total_variance = EXCLUDED.total_variance,
              calculated_at = now()
      `);
    } catch (err) {
      this.logger.warn(`VarianceReport saqlashda xato (skipped): ${String(err)}`);
    }
  }

  private async createAuditTask(orderId: number, orderNumber: string, variancePct: number): Promise<void> {
    const title = `Variance Audit: ${orderNumber} (${variancePct.toFixed(1)}%)`;
    const desc  = `Avtomatik xabar: ${orderNumber} buyurtmasida ${variancePct.toFixed(1)}% variance aniqlandi (>20% chegarasi). Moliya auditini zudlik bilan o'tkazing.`;
    await runQuery(sql`
      INSERT INTO kaizen_suggestions (title, description, status, created_at)
      VALUES (${title}, ${desc}, ${'open'}, now())
    `);
    this.logger.warn(`VarianceAudit: order=${orderId} variance=${variancePct.toFixed(1)}% — kaizen task yaratildi`);
  }
}
