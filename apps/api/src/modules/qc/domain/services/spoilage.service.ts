import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { PERCENT_BASIS, PERCENT_MULTIPLIER, ROUND_2DP_FACTOR } from '@common/constants/app.constants';
import { SPOILAGE_ALARM_MULTIPLIER } from '../../constants/qc.constants';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface JobSpoilageData {
  defectiveSheets: number;
  totalSheets: number;
  printType: PrintType;
  unitCostPaper: number;
  unitCostInk: number;
  unitCostLabor: number;
}

export type PrintType = '4color' | '8color';

const STANDARD_SPOILAGE_RATE: Record<PrintType, number> = {
  '4color': 0.03, // 3%
  '8color': 0.05, // 5%
};

export interface SpoilageResult {
  actualRate: number;
  standardRate: number;
  variance: number;
  isAlarm: boolean;
  costOfSpoilage: number;
  defectiveSheets: number;
  totalSheets: number;
}

/**
 * TZ-37: Spoilage / Waste Rate
 *
 *   Spoilage_Rate = Defective / Total
 *   Variance = Actual - Standard
 *
 *   Alarm: actual > 2 × standard
 *
 * Standart darajalar (bosma sanoat):
 *   4-rangli bosma: 3%
 *   8-rangli bosma: 5%
 *
 * TZ-36: Make-Ready Setup Time
 *   t_total = t_setup + t_run × Q + t_cleanup
 */
@Injectable()
export class SpoilageService {
  @Calculation('qc.spoilage.calculate')
  async calculate(
    defectiveSheets: number,
    totalSheets: number,
    printType: PrintType,
    unitCostPaper: number,
    unitCostInk: number,
    unitCostLabor: number,
  ): Promise<Result<SpoilageResult, AppError>> {
    if (totalSheets <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'totalSheets > 0 bo\'lishi kerak' });
    }
    if (defectiveSheets < 0 || defectiveSheets > totalSheets) {
      return Err({ code: 'BAD_REQUEST', message: 'defectiveSheets ∈ [0, totalSheets]' });
    }

    const actualRate   = safeDiv(safeNum(defectiveSheets), safeNum(totalSheets));
    const standardRate = STANDARD_SPOILAGE_RATE[printType] ?? 0.03;
    const variance     = actualRate - standardRate;
    const isAlarm      = actualRate > SPOILAGE_ALARM_MULTIPLIER * standardRate;

    const unitCost       = safeNum(unitCostPaper) + safeNum(unitCostInk) + safeNum(unitCostLabor);
    const costOfSpoilage = safeNum(defectiveSheets) * unitCost;

    return Ok({
      actualRate:      Math.round(actualRate   * PERCENT_BASIS) / PERCENT_MULTIPLIER,
      standardRate:    Math.round(standardRate * PERCENT_BASIS) / PERCENT_MULTIPLIER,
      variance:        Math.round(variance     * PERCENT_BASIS) / PERCENT_MULTIPLIER,
      isAlarm,
      costOfSpoilage:  Math.round(costOfSpoilage * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      defectiveSheets: safeNum(defectiveSheets),
      totalSheets:     safeNum(totalSheets),
    });
  }

  /**
   * TZ-36: Make-Ready va Setup Time
   *   t_total = t_setup + t_run × Q + t_cleanup
   */
  @Calculation('qc.makeready.calculate')
  async calculateMakeReady(
    setupTime: number,
    runTimePerUnit: number,
    quantity: number,
    cleanupTime: number,
  ): Promise<Result<{ totalMinutes: number; setupTime: number; runTime: number; cleanupTime: number }, AppError>> {
    if (setupTime < 0 || runTimePerUnit < 0 || quantity < 0 || cleanupTime < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Vaqt qiymatlari manfiy bo\'lishi mumkin emas' });
    }

    const runTime    = safeNum(runTimePerUnit) * safeNum(quantity);
    const total      = safeNum(setupTime) + runTime + safeNum(cleanupTime);

    return Ok({
      totalMinutes: Math.round(total * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      setupTime:    safeNum(setupTime),
      runTime:      Math.round(runTime * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      cleanupTime:  safeNum(cleanupTime),
    });
  }

  async getJobSpoilageData(jobId: string): Promise<JobSpoilageData> {
    const inspRows = await runQuery<{ defective_sheets: number; total_sheets: number }>(sql`
      SELECT
        COALESCE(SUM(i.items_failed), 0)::int  AS defective_sheets,
        COALESCE(SUM(i.items_checked), 1)::int AS total_sheets
      FROM qc_inspections i
      WHERE i.reference_id::text = ${jobId}
        AND i.reference_type IN ('print_job', 'production_order')
    `);

    /* Fetch unit cost + product name defensively — columns may differ across deployments */
    let unitCost = 0;
    let productName = '';
    try {
      const costRows = await runQuery<{ unit_cost: number; product_name: string | null }>(sql`
        SELECT
          COALESCE(
            NULLIF(po.actual_cost,  0),
            NULLIF(po.planned_cost, 0),
            0
          ) / GREATEST(COALESCE(po.confirmed_quantity, po.planned_quantity, 1), 1) AS unit_cost,
          mc.name AS product_name
        FROM production_orders po
        LEFT JOIN material_cards mc ON mc.id = po.product_id
        WHERE po.order_number = ${jobId} OR po.id::text = ${jobId}
        LIMIT 1
      `);
      unitCost    = safeNum(costRows[0]?.unit_cost   ?? 0);
      productName = (costRows[0]?.product_name ?? '').toLowerCase();
    } catch {
      /* Graceful degradation: cost data unavailable — defaults to 0 / 4color */
    }

    const row = inspRows[0] ?? { defective_sheets: 0, total_sheets: 1 };

    /* Derive print type: 8-color / 8rangli in product name → '8color' */
    const printType: PrintType = /8[- ]?color|8[- ]?rangli|cmykx2/.test(productName)
      ? '8color'
      : '4color';

    /* Industry-standard cost split: paper 40%, ink 35%, labor 25% */
    return {
      defectiveSheets: safeNum(row.defective_sheets),
      totalSheets:     Math.max(safeNum(row.total_sheets), 1),
      printType,
      unitCostPaper:   unitCost * 0.40,
      unitCostInk:     unitCost * 0.35,
      unitCostLabor:   unitCost * 0.25,
    };
  }
}
