import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { Ok, Err, Result, AppError } from '@common/result';

export interface RopParams {
  avgDailyDemand: number;
  leadTimeDays: number;
  safetyStock: number;
}

export interface RopResult {
  rop: number;
  demandDuringLeadTime: number;
  safetyStock: number;
}

function makeRopErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class RopService {
  @Calculation('wms.rop.calculate')
  calculate(params: RopParams): Result<RopResult, AppError> {
    const { avgDailyDemand, leadTimeDays, safetyStock } = params;

    if (avgDailyDemand < 0) return Err(makeRopErr('avgDailyDemand manfiy bo\'lishi mumkin emas'));
    if (leadTimeDays <= 0) return Err(makeRopErr('leadTimeDays musbat bo\'lishi kerak'));
    if (safetyStock < 0) return Err(makeRopErr('safetyStock manfiy bo\'lishi mumkin emas'));

    const demandDuringLeadTime = avgDailyDemand * leadTimeDays;
    const rop = Math.ceil(demandDuringLeadTime + safetyStock);

    return Ok({ rop, demandDuringLeadTime, safetyStock });
  }
}
