import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

export interface TurnoverInput {
  annualCogs: number;
  avgInventoryValue: number;
}

export interface TurnoverResult {
  turnover: number;
  dio: number;
  interpretation: string;
}

function makeTurnoverErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class InventoryTurnoverService {
  @Calculation('wms.turnover.calculate')
  calculate(input: TurnoverInput): Result<TurnoverResult, AppError> {
    const { annualCogs, avgInventoryValue } = input;

    if (annualCogs < 0) return Err(makeTurnoverErr('annualCogs manfiy bo\'lishi mumkin emas'));
    if (avgInventoryValue < 0) return Err(makeTurnoverErr('avgInventoryValue manfiy bo\'lishi mumkin emas'));

    if (avgInventoryValue === 0) {
      if (annualCogs === 0) {
        return Ok({ turnover: 0, dio: 0, interpretation: 'Ma\'lumot yetarli emas' });
      }
      return Err(makeTurnoverErr('avgInventoryValue nol bo\'lsa turnover hisoblanmaydi'));
    }

    const turnover = safeDiv(annualCogs, avgInventoryValue);
    const dio = safeDiv(365, turnover);

    const interpretation = this.interpret(turnover, dio);

    return Ok({ turnover, dio, interpretation });
  }

  private interpret(turnover: number, dio: number): string {
    if (turnover === 0) return 'Harakatlanmaydi (dead stock xavfi)';
    if (dio > 180) return 'Sekin harakatlanuvchi (slow-moving), zaxirani kamaytirish tavsiya etiladi';
    if (dio > 90) return 'O\'rtacha aylanuvchi';
    if (dio > 30) return 'Yaxshi aylanuvchi';
    return 'Tez aylanuvchi (fast-moving), zaxira etarliligini nazorat qiling';
  }

  calculateDio(turnover: number): Result<number, AppError> {
    if (turnover < 0) return Err(makeTurnoverErr('turnover manfiy bo\'lishi mumkin emas'));
    if (turnover === 0) return Err(makeTurnoverErr('turnover nol bo\'lsa DIO hisoblanmaydi'));
    return Ok(safeDiv(365, turnover));
  }
}
