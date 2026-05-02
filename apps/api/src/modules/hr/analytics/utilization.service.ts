/**
 * utilization.service.ts — TZ-45: Utilizatsiya (Mashg'ulot Darajasi)
 *
 * Formula:
 *   AH  = WorkingDays × ShiftHours − Leaves × ShiftHours
 *   U   = Billable_Hours / AH × 100%
 *
 * Holatlar (sozlanuvchi, kompaniya belgilaydi):
 *   > targetMax × 1.1  → OVERLOADED
 *   targetMin..targetMax → OPTIMAL
 *   targetMin..targetMax orasida → ACCEPTABLE
 *   < targetMin        → UNDERUTILIZED
 *
 * Standart maqsadlar (agar sozlanmasa):
 *   Operator:  70–85%
 *   Manager:   60–75%
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export type UtilizationStatus = 'OVERLOADED' | 'OPTIMAL' | 'ACCEPTABLE' | 'UNDERUTILIZED';

export interface UtilizationInput {
  workingDays: number;
  shiftHoursPerDay: number;
  leaveDays: number;
  productiveHours: number;
  targetMin?: number;
  targetMax?: number;
}

export interface UtilizationResult {
  availableHours: number;
  productiveHours: number;
  leaveDays: number;
  utilizationRate: number;
  targetMin: number;
  targetMax: number;
  status: UtilizationStatus;
}

export interface BatchUtilizationInput {
  employeeId: string;
  workingDays: number;
  shiftHoursPerDay: number;
  leaveDays: number;
  productiveHours: number;
  targetMin?: number;
  targetMax?: number;
}

@Injectable()
export class UtilizationService {
  private round1(n: number): number {
    return Math.round(n * 10) / 10;
  }

  private getStatus(u: number, targetMin: number, targetMax: number): UtilizationStatus {
    if (u > targetMax * 1.1) return 'OVERLOADED';
    if (u >= targetMin && u <= targetMax) return 'OPTIMAL';
    if (u < targetMin) return 'UNDERUTILIZED';
    return 'ACCEPTABLE';
  }

  @Calculation('hr.utilization.calculate')
  async calculate(input: UtilizationInput): Promise<Result<UtilizationResult, AppError>> {
    const workingDays = safeNum(input.workingDays);
    const shiftHours = safeNum(input.shiftHoursPerDay);
    const leaveDays = safeNum(input.leaveDays);
    const productiveHours = safeNum(input.productiveHours);
    const targetMin = safeNum(input.targetMin ?? 60);
    const targetMax = safeNum(input.targetMax ?? 85);

    if (workingDays < 0 || shiftHours <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'workingDays ≥ 0 va shiftHoursPerDay > 0 bo\'lishi kerak' });
    }
    if (leaveDays < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'leaveDays manfiy bo\'lishi mumkin emas' });
    }
    if (productiveHours < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'productiveHours manfiy bo\'lishi mumkin emas' });
    }
    if (targetMin < 0 || targetMax > 100 || targetMin > targetMax) {
      return Err({ code: 'BAD_REQUEST', message: 'targetMin ≤ targetMax va [0,100] oralig\'ida bo\'lishi kerak' });
    }

    const availableHours = Math.max(0, (workingDays - leaveDays) * shiftHours);

    if (availableHours === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Mavjud soatlar nol — ketdi yoki ishlamadi' });
    }

    const utilizationRate = this.round1(safeDiv(productiveHours, availableHours) * 100);
    const status = this.getStatus(utilizationRate, targetMin, targetMax);

    return Ok({
      availableHours,
      productiveHours,
      leaveDays,
      utilizationRate,
      targetMin,
      targetMax,
      status,
    });
  }

  @Calculation('hr.utilization.batch')
  async batchCalculate(
    batch: BatchUtilizationInput[],
  ): Promise<Result<Array<{ employeeId: string } & UtilizationResult>, AppError>> {
    if (!batch.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Batch bo\'sh' });
    }

    const results: Array<{ employeeId: string } & UtilizationResult> = [];
    for (const item of batch) {
      const r = await this.calculate(item);
      if (!r.ok) return Err(r.error);
      results.push({ employeeId: item.employeeId, ...r.data });
    }

    return Ok(results);
  }
}
