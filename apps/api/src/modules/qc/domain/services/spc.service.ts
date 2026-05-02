import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeDiv, safeNum, safeAvg } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { db, qc_spc_data } from '@shared/db';
import { eq, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';

export interface ControlChartData {
  parameterId: number;
  measurements: number[];
  mean:         number;
  stdDev:       number;
  ucl:          number;
  lcl:          number;
  outOfControl: number[];
}

const ROUND_PRECISION = 1000;
const CP_CAPABLE   = 1.33;
const CP_EXCELLENT = 1.67;

const A2: Record<number, number> = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483 };
const D3: Record<number, number> = { 2: 0,     3: 0,     4: 0,     5: 0,     6: 0     };
const D4: Record<number, number> = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004 };
const d2: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534 };

export interface Subgroup {
  values: number[];
}

export interface XbarRResult {
  grandMean: number;
  meanRange: number;
  uclX: number;
  lclX: number;
  uclR: number;
  lclR: number;
  sigma: number;
  subgroupSize: number;
}

export interface CapabilityResult {
  cp: number;
  cpk: number;
  isCapable: boolean;
  isExcellent: boolean;
}

/**
 * TZ-30: X-bar/R Control Charts + Process Capability
 */
@Injectable()
export class SpcService {
  @Calculation('spc.xbarR')
  async computeXbarR(
    subgroups: readonly Subgroup[],
    subgroupSize: number,
  ): Promise<Result<XbarRResult, AppError>> {
    if (subgroups.length < 2) {
      return Err({ code: 'BAD_REQUEST', message: 'Kamida 2 ta subgroup kerak' });
    }
    if (!(subgroupSize in A2)) {
      return Err({ code: 'BAD_REQUEST', message: `n=${subgroupSize} qo'llab-quvvatlanmaydi (2-6)` });
    }

    const means  = subgroups.map(sg => safeAvg(sg.values.map(safeNum)));
    const ranges = subgroups.map(sg => {
      const nums = sg.values.map(safeNum);
      return Math.max(...nums) - Math.min(...nums);
    });

    const grandMean = safeAvg(means);
    const meanRange = safeAvg(ranges);

    const a2 = A2[subgroupSize] ?? 0;
    const d3 = D3[subgroupSize] ?? 0;
    const d4 = D4[subgroupSize] ?? 0;

    return Ok({
      grandMean,
      meanRange,
      uclX: grandMean + a2 * meanRange,
      lclX: grandMean - a2 * meanRange,
      uclR: d4 * meanRange,
      lclR: d3 * meanRange,
      sigma: safeDiv(meanRange, d2[subgroupSize] ?? 1),
      subgroupSize,
    });
  }

  @Calculation('spc.capability')
  async computeCapability(
    grandMean: number,
    sigma: number,
    usl: number,
    lsl: number,
  ): Promise<Result<CapabilityResult, AppError>> {
    if (usl <= lsl) {
      return Err({ code: 'BAD_REQUEST', message: 'USL > LSL bo\'lishi kerak' });
    }
    if (sigma <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'sigma > 0 bo\'lishi kerak' });
    }

    const cp  = safeDiv(usl - lsl, 6 * sigma);
    const cpu = safeDiv(usl - grandMean, 3 * sigma);
    const cpl = safeDiv(grandMean - lsl, 3 * sigma);
    const cpk = Math.min(cpu, cpl);

    return Ok({
      cp:          Math.round(cp  * ROUND_PRECISION) / ROUND_PRECISION,
      cpk:         Math.round(cpk * ROUND_PRECISION) / ROUND_PRECISION,
      isCapable:   cp >= CP_CAPABLE,
      isExcellent: cp >= CP_EXCELLENT,
    });
  }

  async getControlChart(
    parameterId: number,
    lastN = 30,
  ): Promise<Result<ControlChartData, AppError>> {
    try {
      const readings = await db
        .select({ value: qc_spc_data.value, measuredAt: qc_spc_data.measuredAt })
        .from(qc_spc_data)
        .where(eq(qc_spc_data.parameterId, parameterId))
        .orderBy(desc(qc_spc_data.measuredAt))
        .limit(lastN);

      if (!readings.length) {
        return Err({ code: 'NOT_FOUND', message: 'O\'lchamlar topilmadi' });
      }

      const values = (readings as { value: string | number }[])
        .reverse()
        .map(r => safeNum(r.value));
      const n = values.length;

      const sum = values.reduce(
        (acc: number, v: number) => new Decimal(acc).plus(v).toNumber(),
        0,
      );
      const mean = new Decimal(sum).div(n).toDecimalPlaces(4).toNumber();

      const variance =
        values.reduce(
          (acc: number, v: number) =>
            new Decimal(acc).plus(new Decimal(v - mean).pow(2)).toNumber(),
          0,
        ) / n;
      const stdDev = new Decimal(Math.sqrt(variance))
        .toDecimalPlaces(4)
        .toNumber();

      const ucl = new Decimal(mean)
        .plus(new Decimal(stdDev).mul(3))
        .toDecimalPlaces(4)
        .toNumber();
      const lcl = new Decimal(mean)
        .minus(new Decimal(stdDev).mul(3))
        .toDecimalPlaces(4)
        .toNumber();

      const outOfControl = values
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v > ucl || v < lcl)
        .map(({ i }) => i);

      return Ok({ parameterId, measurements: values, mean, stdDev, ucl, lcl, outOfControl });
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
