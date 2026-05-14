/**
 * @module scheduling-capacity.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { WorkCenterLoad, TocResult, makeSchedErr } from './scheduling.types';

@Injectable()
export class SchedulingCapacityService {
  /**
   * TZ-16: TOC — Theory of Constraints / Bottleneck
   * ρ_i = λ_i / μ_i
   * Bottleneck = argmax_i ρ_i
   */
  @Calculation('pp.toc.detectBottleneck')
  detectBottleneck(workCenters: WorkCenterLoad[]): Result<TocResult, AppError> {
    const safeWC = Array.isArray(workCenters) ? workCenters : [];
    if (!safeWC.length) {
      return Err(makeSchedErr('Ish markazlari ro\'yxati bo\'sh'));
    }

    // serviceRate <= 0 → VALIDATION (nolga bo'lish yoki noldan kam kapasite)
    for (const wc of safeWC) {
      if (safeNum(wc.serviceRate) <= 0) {
        return Err(makeSchedErr(
          `Ish markazi '${wc.workCenterId}': serviceRate musbat bo'lishi kerak (nol yoki manfiy kapasite bottleneck hisoblanadi)`,
        ));
      }
    }

    const all = (Array.isArray(safeWC) ? safeWC : []).map((wc) => ({
      workCenterId: wc.workCenterId,
      utilization: safeDiv(safeNum(wc.arrivalRate), safeNum(wc.serviceRate)),
    }));

    all.sort((a, b) => b.utilization - a.utilization);

    const bottleneck = all[0];
    const throughputIndex = safeDiv(1, bottleneck.utilization > 0 ? bottleneck.utilization : 1);

    return Ok({
      bottleneck: bottleneck.workCenterId,
      utilization: bottleneck.utilization,
      allWorkCenters: all,
      throughputIndex,
    });
  }
}
