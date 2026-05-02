import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Ok, Err, Result, AppError } from '@common/result';
import { clamp, safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export const OeeInputSchema = z.object({
  plannedProductionTime: z.number().min(0),
  runTime: z.number().min(0),
  idealCycleTime: z.number().min(0),
  actualQuantity: z.number().int().min(0),
  defectQuantity: z.number().int().min(0),
}).refine(d => d.runTime <= d.plannedProductionTime, {
  message: "runTime plannedProductionTime dan katta bo'lmasligi kerak",
  path: ['runTime'],
}).refine(d => d.defectQuantity <= d.actualQuantity, {
  message: "defectQuantity actualQuantity dan katta bo'lmasligi kerak",
  path: ['defectQuantity'],
});

export type OeeInput = z.infer<typeof OeeInputSchema>;

export interface OeeResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  isWorldClass: boolean;
  isCritical: boolean;
}

/**
 * TZ-D10: OEE Input Validation + Clamp [0, 1]
 */
@Injectable()
export class OeeCalculatorService {
  private readonly logger = new Logger(OeeCalculatorService.name);

  @Calculation('oee.calculate')
  async calculate(input: OeeInput): Promise<Result<OeeResult, AppError>> {
    const parsed = OeeInputSchema.safeParse(input);
    if (!parsed.success) {
      return Err({
        code: 'VALIDATION',
        message: (Array.isArray(parsed.error.errors) ? parsed.error.errors : []).map(e => e.message).join('; '),
      });
    }

    const {
      plannedProductionTime: PT,
      runTime: RT,
      idealCycleTime: IT,
      actualQuantity: AQ,
      defectQuantity: DQ,
    } = parsed.data;

    this.logger.debug(`OEE hisob: PT=${PT} RT=${RT} AQ=${AQ} DQ=${DQ}`);

    const availability = clamp(safeDiv(RT, PT), 0, 1);
    const performance  = clamp(safeDiv(AQ * IT, RT), 0, 1);
    const quality      = clamp(safeDiv(AQ - DQ, AQ), 0, 1);
    const oee          = availability * performance * quality * 100;

    return Ok({
      availability: Math.round(availability * 1000) / 10,
      performance:  Math.round(performance * 1000) / 10,
      quality:      Math.round(quality * 1000) / 10,
      oee:          Math.round(oee * 10) / 10,
      isWorldClass: oee >= 85,
      isCritical:   oee < 60,
    });
  }

  /**
   * Eski interfeys bilan moslik uchun (mavjud controller'lar)
   * @deprecated calculate() ga o'tish tavsiya etiladi
   */
  calculateOee(params: {
    plannedProductionTime: number;
    actualRunningTime: number;
    targetQuantity: number;
    actualQuantity: number;
    defectQuantity: number;
  }): Result<{ availability: number; performance: number; quality: number; oee: number }, AppError> {
    const { plannedProductionTime, actualRunningTime, targetQuantity, actualQuantity, defectQuantity } = params;
    const availability = clamp(safeDiv(actualRunningTime, plannedProductionTime), 0, 1) * 100;
    const performance  = clamp(safeDiv(actualQuantity, targetQuantity), 0, 1) * 100;
    const quality      = clamp(safeDiv(actualQuantity - defectQuantity, actualQuantity), 0, 1) * 100;
    const oee          = (availability / 100) * (performance / 100) * (quality / 100) * 100;
    return Ok({ availability, performance, quality, oee });
  }
}
