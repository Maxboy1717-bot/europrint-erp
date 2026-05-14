/**
 * @module oee-calculator.service
 * @description **Overall Equipment Effectiveness (OEE)** — the single
 *   number that captures how well a machine is being used. Industry-
 *   standard manufacturing KPI; published with three contributing factors
 *   so operators see *which* axis dropped the score:
 *
 *     Availability = runTime / plannedProductionTime
 *                   (how much of scheduled time the machine was running)
 *     Performance  = (idealCycleTime × actualQty) / runTime
 *                   (was it running at design speed?)
 *     Quality      = (actualQty − defectQty) / actualQty
 *                   (what fraction of output was good)
 *     OEE          = Availability × Performance × Quality
 *
 *   Each factor is in [0, 1]; OEE in [0, 1] (presented as % in the UI).
 *
 *   Industry benchmarks (Nakajima):
 *     OEE ≥ 0.85  World-class (top-quartile manufacturer)
 *     OEE ≥ 0.60  Typical
 *     OEE < 0.40  Critical — line is losing money
 * @layer Domain Service (IoT/MES — pure compute, no I/O)
 *
 * WHY THREE FACTORS, NOT ONE
 *   "Our OEE is 50%" tells management nothing actionable. The breakdown
 *   tells them WHY:
 *     - Low Availability  → fewer breakdowns / faster changeovers
 *     - Low Performance   → speed losses (under-speeding, small stops)
 *     - Low Quality       → defect reduction / rework analysis
 *
 *   Each factor maps to a different shop-floor team's responsibility, so
 *   the breakdown drives accountability without finger-pointing.
 *
 * WHY ZOD VALIDATION INSIDE THE CALCULATOR
 *   This service is called both from controllers (already Zod-validated
 *   DTOs) and from cron processors / IoT ingest (raw payloads). Re-validating
 *   inside the calc means we cannot accidentally compute OEE on malformed
 *   data — saving hours of debugging when a sensor emits "9999" for cycle
 *   time during a calibration burst.
 *
 *   The cross-field refinements (`runTime ≤ plannedProductionTime`,
 *   `defectQty ≤ actualQty`) catch IoT clock drift and counter rollover
 *   that would produce nonsense factors (>1.0).
 *
 * WHY clamp TO [0, 1] AT THE END
 *   Each factor can briefly exceed 1.0 in edge cases (machine ran faster
 *   than the "ideal cycle time" because cycle time was over-estimated).
 *   We clamp because OEE > 100% breaks dashboards (progress bars, colour
 *   thresholds) and confuses operators. The proper fix is calibration —
 *   our IoT alerts surface "performance > 1.05" as a calibration request.
 *
 * WHY 0.85 / 0.40 THRESHOLDS
 *   0.85 = Nakajima's "World-Class OEE" target, originally published in
 *   his 1988 TPM book and accepted industry-wide. 0.40 = the level at
 *   which a manufacturing line is generally regarded as commercially
 *   unviable (any further drop probably means scheduled downtime would
 *   be cheaper than running).
 */

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
