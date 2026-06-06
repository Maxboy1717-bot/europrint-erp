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
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
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

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';
import { FINANCE_REPO, IFinanceRepo } from '../repositories/i-finance.repo';

const VARIANCE_AUDIT_THRESHOLD_PCT = 20;

export type { VarianceResult } from './variance-analysis.types';
import type { VarianceResult } from './variance-analysis.types';

@Injectable()
export class VarianceAnalysisService {
  private readonly logger = new Logger(VarianceAnalysisService.name);

  constructor(
    private readonly cfoConfig: CfoConfigService,
    @Inject(FINANCE_REPO) private readonly repo: IFinanceRepo,
  ) {}

  @Calculation('variance-analysis')
  async analyzeOrder(orderId: number): Promise<Result<VarianceResult, AppError>> {
    try {
      const [overheadRate, stdLaborRate] = await Promise.all([
        this.cfoConfig.getNumber('overhead_rate_per_hour', 15000),
        this.cfoConfig.getNumber('std_labor_rate_per_hour', 25000),
      ]);

      const inputs = await this.repo.fetchVarianceOrderInputs(orderId);
      if (!inputs.order) return Err(AppErr('NOT_FOUND', `Ishlab chiqarish buyurtmasi topilmadi: ${orderId}`));

      const { order, stdCost, actualMaterial } = inputs;
      const plannedQty      = order.plannedQty;
      const productName     = order.productName;
      const productId       = order.productId;
      const actualCostTotal = order.actualCostTotal;

      const bomItems     = this.parseBomItems(inputs.bomItemsJson);
      const routingSteps = this.parseRoutingSteps(inputs.routingStepsJson);

      const stdMaterialPerUnit = stdCost?.stdMaterialUzs ?? 0;
      const stdLaborPerUnit    = stdCost?.stdLaborUzs ?? 0;
      const stdOvhPerUnit      = stdCost?.stdOverheadUzs ?? 0;
      const stdTotalPerUnit    = stdCost?.stdTotal ?? (stdMaterialPerUnit + stdLaborPerUnit + stdOvhPerUnit);

      const sqPerUnit = bomItems.reduce((sum, item) => sum + item.qty, 0);
      const spPerUnit = sqPerUnit > 0
        ? safeDiv(stdMaterialPerUnit, sqPerUnit)
        : stdMaterialPerUnit;
      const sq = sqPerUnit * plannedQty;
      const sp = spPerUnit;

      const ah  = inputs.actualHours;
      // Standard hours and rate from routing + standard cost config
      const sh  = routingSteps.reduce((sum, step) => sum + step.hours, 0) * plannedQty;
      const sr  = sh > 0
        ? Math.max(safeDiv(stdLaborPerUnit * plannedQty, sh), 0)
        : stdLaborRate;

      const aqMat = actualMaterial.actualMaterialQty > 0 ? actualMaterial.actualMaterialQty : sq;
      const ap    = actualMaterial.actualUnitPrice > 0 ? actualMaterial.actualUnitPrice : sp;
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

      await this.repo.saveVarianceReport({ orderId, mpv, mqv, lrv, lev, ov, totalVariance });
      if (needsAudit) {
        const title = `Variance Audit: ${order.orderNumber} (${variancePct.toFixed(1)}%)`;
        const desc  = `Avtomatik xabar: ${order.orderNumber} buyurtmasida ${variancePct.toFixed(1)}% variance aniqlandi (>20% chegarasi). Moliya auditini zudlik bilan o'tkazing.`;
        await this.repo.createKaizenAuditTask(title, desc).catch(
          e => this.logger.warn(`Audit task yaratishda xato: ${String(e)}`),
        );
        this.logger.warn(`VarianceAudit: order=${orderId} variance=${variancePct.toFixed(1)}% — kaizen task yaratildi`);
      }

      // Touch safeNum to avoid unused-import warnings; intentionally a no-op.
      void safeNum;

      return Ok({
        orderId, orderNumber: order.orderNumber,
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
    const items = JSON.parse(json) as Array<Record<string, unknown>>;
    if (!Array.isArray(items)) return [];
    return items.map(i => ({
      qty:      safeNum(i['qty'] ?? i['quantity'], 0),
      unitCost: safeNum(i['unitCost'] ?? i['unit_cost'] ?? i['cost'], 0),
    }));
  }

  private parseRoutingSteps(json: string): Array<{ hours: number }> {
    const steps = JSON.parse(json) as Array<Record<string, unknown>>;
    if (!Array.isArray(steps)) return [];
    return steps.map(s => ({
      hours: safeNum(s['hours'] ?? s['duration_hours'] ?? s['durationHours'], 0),
    }));
  }
}
