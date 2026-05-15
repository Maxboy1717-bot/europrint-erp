/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   INSERT ... ON CONFLICT (product_name, period) DO UPDATE SET ... = EXCLUDED.*
 *   composite-key upsert (used in two code paths depending on whether product_id is
 *   known), plus computed select column `std_material_uzs + std_labor_uzs +
 *   std_overhead_uzs AS std_total_uzs` returned alongside its components.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

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

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';

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

type Row = Record<string, unknown>;

@Injectable()
export class StandardCostService {
  private readonly logger = new Logger(StandardCostService.name);

  constructor(private readonly cfoConfig: CfoConfigService) {}

  @Calculation('standard-cost-get')
  async getForProduct(productName: string, period: string): Promise<Result<StandardCostDto, AppError>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT sc.product_name, sc.product_id, sc.period,
               sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
               sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
               sc.created_at
        FROM standard_cost sc
        LEFT JOIN products p ON p.id = sc.product_id
        WHERE (sc.product_name = ${productName} OR p.name = ${productName})
          AND sc.period = ${period}
        ORDER BY sc.period DESC
        LIMIT 1
      `);
      const row = rows[0];
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
      const rows = await runQuery<Row>(sql`
        SELECT sc.product_name, sc.product_id, sc.period,
               sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
               sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
               sc.created_at
        FROM standard_cost sc
        WHERE sc.product_id = ${productId}
          AND sc.period = ${period}
        ORDER BY sc.period DESC
        LIMIT 1
      `);
      const row = rows[0];
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

      const productRows = await runQuery<Row>(sql`
        SELECT id FROM products WHERE name = ${productName} AND is_active = true LIMIT 1
      `);
      const productId = productRows[0] ? Number(productRows[0]['id']) : null;

      const [bomRows, routingRows] = await Promise.all([
        runQuery<Row>(sql`
          SELECT items FROM boms
          WHERE product_name = ${productName} AND is_active = true
          ORDER BY created_at DESC LIMIT 1
        `),
        productId !== null
          ? runQuery<Row>(sql`
              SELECT r.steps
              FROM routings r
              JOIN production_orders po ON po.routing_id = r.id
              WHERE po.product_id = ${productId}
              ORDER BY po.created_at DESC LIMIT 1
            `)
          : Promise.resolve([] as Row[]),
      ]);

      const bomItems     = this.parseBomItems(String(bomRows[0]?.['items'] ?? '[]'));
      const routingSteps = this.parseRoutingSteps(String(routingRows[0]?.['steps'] ?? '[]'));

      const materialCostPerUnit = bomItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
      const stdHours            = routingSteps.reduce((sum, step) => sum + step.hours, 0);
      const laborCostPerUnit    = stdHours * laborRate;
      const overheadCostPerUnit = stdHours * overheadRate;

      if (productId !== null) {
        await runQuery(sql`
          INSERT INTO standard_cost (product_name, product_id, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
          VALUES (${productName}, ${productId}, ${period}, ${materialCostPerUnit}, ${laborCostPerUnit}, ${overheadCostPerUnit})
          ON CONFLICT (product_name, period) DO UPDATE
            SET product_id       = EXCLUDED.product_id,
                std_material_uzs = EXCLUDED.std_material_uzs,
                std_labor_uzs    = EXCLUDED.std_labor_uzs,
                std_overhead_uzs = EXCLUDED.std_overhead_uzs,
                updated_at       = now()
        `);
      } else {
        await runQuery(sql`
          INSERT INTO standard_cost (product_name, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
          VALUES (${productName}, ${period}, ${materialCostPerUnit}, ${laborCostPerUnit}, ${overheadCostPerUnit})
          ON CONFLICT (product_name, period) DO UPDATE
            SET std_material_uzs = EXCLUDED.std_material_uzs,
                std_labor_uzs    = EXCLUDED.std_labor_uzs,
                std_overhead_uzs = EXCLUDED.std_overhead_uzs,
                updated_at       = now()
        `);
      }

      return Ok({
        productName,
        productId,
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
      const rows = await runQuery<Row>(sql`
        SELECT sc.product_name, sc.product_id, sc.period,
               sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
               sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
               sc.created_at
        FROM standard_cost sc
        LEFT JOIN products p ON p.id = sc.product_id
        WHERE sc.product_name = ${productName} OR p.name = ${productName}
        ORDER BY sc.period DESC LIMIT 24
      `);
      return Ok(rows.map(r => this.toDto(r)));
    } catch (err) {
      this.logger.error(`StandardCostService.listPeriods xato: ${String(err)}`);
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

  private toDto(row: Row): StandardCostDto {
    const mat   = safeNum(row['std_material_uzs'], 0);
    const lab   = safeNum(row['std_labor_uzs'], 0);
    const ovh   = safeNum(row['std_overhead_uzs'], 0);
    const total = safeNum(row['std_total_uzs'], mat + lab + ovh);
    return {
      productName:    String(row['product_name'] ?? ''),
      productId:      row['product_id'] ? Number(row['product_id']) : null,
      period:         String(row['period'] ?? ''),
      stdMaterialUzs: roundTo(mat, 2),
      stdLaborUzs:    roundTo(lab, 2),
      stdOverheadUzs: roundTo(ovh, 2),
      stdTotalUzs:    roundTo(total, 2),
      calculatedAt:   row['created_at'] ? new Date(String(row['created_at'])) : new Date(),
    };
  }
}
