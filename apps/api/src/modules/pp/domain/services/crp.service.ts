/**
 * @module crp.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

export interface WorkCenterInput {
  workCenterId: string;
  shiftHours: number;
  utilization: number;
  efficiency: number;
  machines?: number;
}

export interface WorkOrderOperation {
  workCenterId: string;
  setupTime: number;
  runTimePerUnit: number;
  qtyTarget: number;
}

export interface CrpResult {
  workCenterId: string;
  requiredHours: number;
  availableHours: number;
  loadPercent: number;
  isBottleneck: boolean;
  isOverloaded: boolean;
}

function makeCrpErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class CrpService {
  /**
   * TZ-12: CRP — Capacity Requirements Planning
   *
   * CR_t^(WC) = Σ_o (t_setup + q_o × t_run)
   * Load% = CR / AC × 100%
   * AC = shift_hours × utilization × efficiency × machines
   */
  @Calculation('pp.crp.calculateLoad')
  calculateLoad(
    workCenter: WorkCenterInput,
    operations: WorkOrderOperation[],
  ): Result<CrpResult, AppError> {
    if (!workCenter.workCenterId) {
      return Err(makeCrpErr('workCenterId bo\'sh bo\'lmasin'));
    }
    if (safeNum(workCenter.shiftHours) <= 0) {
      return Err(makeCrpErr('shiftHours musbat bo\'lishi kerak'));
    }

    const utilization = safeNum(workCenter.utilization, 1);
    const efficiency = safeNum(workCenter.efficiency, 1);
    const machines = safeNum(workCenter.machines, 1);
    const shiftHours = safeNum(workCenter.shiftHours);

    const availableHours = shiftHours * utilization * efficiency * machines;

    const safeOps = Array.isArray(operations) ? operations : [];
    const requiredHours = safeOps
      .filter((op) => op.workCenterId === workCenter.workCenterId)
      .reduce(
        (sum, op) =>
          sum + safeNum(op.setupTime) + safeNum(op.runTimePerUnit) * safeNum(op.qtyTarget),
        0,
      );

    const loadPercent = safeDiv(requiredHours * 100, availableHours);

    return Ok({
      workCenterId: workCenter.workCenterId,
      requiredHours,
      availableHours,
      loadPercent,
      isBottleneck: loadPercent > 85,
      isOverloaded: loadPercent > 100,
    });
  }

  /**
   * Bir nechta ish markazlari uchun CRP hisobi
   */
  @Calculation('pp.crp.calculateMultiple')
  calculateMultiple(
    workCenters: WorkCenterInput[],
    operations: WorkOrderOperation[],
  ): Result<CrpResult[], AppError> {
    if (!workCenters.length) {
      return Err(makeCrpErr('workCenters bo\'sh bo\'lmasin'));
    }

    const results: CrpResult[] = [];
    for (const wc of workCenters) {
      const r = this.calculateLoad(wc, operations);
      if (!r.ok) return Err(r.error);
      results.push(r.data);
    }

    return Ok(results);
  }
}
