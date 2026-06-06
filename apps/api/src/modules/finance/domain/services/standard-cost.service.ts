/**
 * @module standard-cost.service
 * @description Maintains and queries the "standard cost" reference table —
 *   the expected per-unit cost of a product before any real production
 *   happens. Standard costs are the baseline against which actual costs are
 *   measured (see `variance-analysis.service.ts`).
 *
 *   A standard cost has three components:
 *     stdMaterial — Σ over BOM components (stdQty × stdPrice)
 *     stdLabor    — Σ over routing steps (stdHours × stdLaborRate)
 *     stdOverhead — Σ over routing steps (stdHours × overheadRate)
 *
 *   Standards are stored per `(productName, period)` so they can be
 *   refreshed as raw material prices and wages change quarterly. The most
 *   recent standard for a period is used; older revisions remain queryable
 *   for retrospective variance reports.
 * @layer Domain Service (Finance / cost accounting)
 *
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
 *
 * WHY STANDARDS LIVE IN A DEDICATED TABLE (not computed on-demand)
 *   Two reasons:
 *     1. Stability — once a standard is set for Q1, it stays fixed even if
 *        raw prices move mid-quarter. This is the entire point of standard
 *        costing: a static reference that makes variances meaningful.
 *     2. Audit trail — auditors want to see exactly which numbers were used
 *        to value WIP and finished goods inventory at period close.
 *
 * WHY MATERIAL / LABOR / OVERHEAD ARE STORED SEPARATELY
 *   Variance analysis decomposes spend into the same three buckets. Storing
 *   them aggregated would lose the resolution. Total = sum, so it's free to
 *   recompute on read.
 *
 * WHY refreshes ARE QUARTERLY, NOT REAL-TIME
 *   IFRS / UZ tax convention: standard costs are reviewed at planning cycles
 *   (typically quarterly), not on every price tick. Continuous refresh would
 *   defeat the purpose of "standard" — it becomes actual cost again.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';
import { FINANCE_REPO, IFinanceRepo, StandardCostRecord } from '../repositories/i-finance.repo';

export interface StandardCostDto {
  productName: string;
  productId: number | null;
  period: string;
  stdMaterialUzs: number;
  stdLaborUzs: number;
  stdOverheadUzs: number;
  stdTotalUzs: number;
  calculatedAt: Date;
}

@Injectable()
export class StandardCostService {
  private readonly logger = new Logger(StandardCostService.name);

  constructor(
    private readonly cfoConfig: CfoConfigService,
    @Inject(FINANCE_REPO) private readonly repo: IFinanceRepo,
  ) {}

  @Calculation('standard-cost-get')
  async getForProduct(productName: string, period: string): Promise<Result<StandardCostDto, AppError>> {
    try {
      const row = await this.repo.findStandardCostByName(productName, period);
      if (!row) return Err(AppErr('NOT_FOUND', `Standart tannarx topilmadi: ${productName} / ${period}`));
      return Ok(this.toDto(row));
    } catch (err) {
      this.logger.error(`StandardCostService.getForProduct xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  @Calculation('standard-cost-get-by-id')
  async getForProductById(productId: number, period: string): Promise<Result<StandardCostDto, AppError>> {
    try {
      const row = await this.repo.findStandardCostById(productId, period);
      if (!row) return Err(AppErr('NOT_FOUND', `Standart tannarx topilmadi: productId=${productId} / ${period}`));
      return Ok(this.toDto(row));
    } catch (err) {
      this.logger.error(`StandardCostService.getForProductById xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  @Calculation('standard-cost-calculate')
  async calculateAndSave(productName: string, period: string): Promise<Result<StandardCostDto, AppError>> {
    try {
      const [overheadRate, laborRate] = await Promise.all([
        this.cfoConfig.getNumber('overhead_rate_per_hour', 15000),
        this.cfoConfig.getNumber('std_labor_rate_per_hour', 25000),
      ]);

      const inputs = await this.repo.fetchStandardCostCalcInputs(productName);

      const bomItems     = this.parseBomItems(inputs.bomItemsJson);
      const routingSteps = this.parseRoutingSteps(inputs.routingStepsJson);

      const materialCostPerUnit = bomItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
      const stdHours            = routingSteps.reduce((sum, step) => sum + step.hours, 0);
      const laborCostPerUnit    = stdHours * laborRate;
      const overheadCostPerUnit = stdHours * overheadRate;

      await this.repo.upsertStandardCost({
        productName,
        productId:      inputs.productId,
        period,
        stdMaterialUzs: materialCostPerUnit,
        stdLaborUzs:    laborCostPerUnit,
        stdOverheadUzs: overheadCostPerUnit,
      });

      return Ok({
        productName,
        productId:      inputs.productId,
        period,
        stdMaterialUzs: roundTo(materialCostPerUnit, 2),
        stdLaborUzs:    roundTo(laborCostPerUnit, 2),
        stdOverheadUzs: roundTo(overheadCostPerUnit, 2),
        stdTotalUzs:    roundTo(materialCostPerUnit + laborCostPerUnit + overheadCostPerUnit, 2),
        calculatedAt:   new Date(),
      });
    } catch (err) {
      this.logger.error(`StandardCostService.calculateAndSave xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  @Calculation('standard-cost-list')
  async listPeriods(productName: string): Promise<Result<StandardCostDto[], AppError>> {
    try {
      const rows = await this.repo.listStandardCosts(productName, 24);
      return Ok(rows.map(r => this.toDto(r)));
    } catch (err) {
      this.logger.error(`StandardCostService.listPeriods xato: ${String(err)}`);
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

  private toDto(row: StandardCostRecord): StandardCostDto {
    return {
      productName:    row.productName,
      productId:      row.productId,
      period:         row.period,
      stdMaterialUzs: roundTo(row.stdMaterialUzs, 2),
      stdLaborUzs:    roundTo(row.stdLaborUzs, 2),
      stdOverheadUzs: roundTo(row.stdOverheadUzs, 2),
      stdTotalUzs:    roundTo(row.stdTotalUzs, 2),
      calculatedAt:   row.createdAt ?? new Date(),
    };
  }
}
