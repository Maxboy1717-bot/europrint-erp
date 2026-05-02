import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';

const LEARNING_CURVE_DEFAULT_RATE = 0.80;
const LEARNING_CURVE_MIN_RATE = 0.60;
const LEARNING_CURVE_MAX_RATE = 1.00;

export interface LearningCurveInput {
  t1Minutes: number;
  rate?: number;
  cumulativeUnits: number;
}

export interface LearningCurvePoint {
  n: number;
  avgTimeMinutes: number;
  unitTimeMinutes: number;
}

export interface LearningCurveResult {
  points: LearningCurvePoint[];
  rate: number;
  t1Minutes: number;
  slope: number;
}

function makeLcErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

/**
 * TZ-D09: Wright 80% Learning Curve
 * Cumulative average time: T̄_n = t1 × n^log2(rate)
 * Individual unit time: t_n = T̄_n × n - T̄_{n-1} × (n-1)
 */
function cumulativeAvgTime(t1: number, rate: number, n: number): number {
  if (n <= 0) return 0;
  const slope = Math.log2(rate);
  return t1 * Math.pow(n, slope);
}

function unitTime(t1: number, rate: number, n: number): number {
  if (n <= 1) return t1;
  const current = cumulativeAvgTime(t1, rate, n) * n;
  const prev = cumulativeAvgTime(t1, rate, n - 1) * (n - 1);
  return current - prev;
}

@Injectable()
export class LearningCurveService {
  /**
   * Predict time for cumulative production volume.
   * Returns array of points for visualization.
   */
  @Calculation('pp.learningCurve.calculate')
  calculate(input: LearningCurveInput): Result<LearningCurveResult, AppError> {
    const rate = safeNum(input.rate, LEARNING_CURVE_DEFAULT_RATE);
    const t1 = safeNum(input.t1Minutes);
    const maxN = safeNum(input.cumulativeUnits);

    if (t1 <= 0) return Err(makeLcErr('t1Minutes musbat bo\'lishi kerak'));
    if (maxN <= 0) return Err(makeLcErr('cumulativeUnits musbat bo\'lishi kerak'));
    if (rate < LEARNING_CURVE_MIN_RATE || rate > LEARNING_CURVE_MAX_RATE) {
      return Err(makeLcErr(`rate ${LEARNING_CURVE_MIN_RATE}–${LEARNING_CURVE_MAX_RATE} oralig\'ida bo\'lishi kerak`));
    }

    const slope = Math.log2(rate);
    const checkpoints = buildCheckpoints(maxN);

    const points: LearningCurvePoint[] = (checkpoints ?? []).map((n) => ({
      n,
      avgTimeMinutes: cumulativeAvgTime(t1, rate, n),
      unitTimeMinutes: unitTime(t1, rate, n),
    }));

    return Ok({ points, rate, t1Minutes: t1, slope });
  }

  /**
   * Calibrate rate from two observed data points.
   * slope = (ln(t2) - ln(t1)) / (ln(n2) - ln(n1))
   */
  @Calculation('pp.learningCurve.calibrate')
  calibrate(n1: number, t1: number, n2: number, t2: number): Result<number, AppError> {
    if (n1 <= 0 || n2 <= 0) return Err(makeLcErr('n1, n2 musbat bo\'lishi kerak'));
    if (t1 <= 0 || t2 <= 0) return Err(makeLcErr('t1, t2 musbat bo\'lishi kerak'));
    if (n1 >= n2) return Err(makeLcErr('n1 < n2 bo\'lishi kerak'));

    const slope = safeDiv(Math.log(t2) - Math.log(t1), Math.log(n2) - Math.log(n1));
    const rate = Math.pow(2, slope);

    if (rate < LEARNING_CURVE_MIN_RATE || rate > LEARNING_CURVE_MAX_RATE) {
      return Err(makeLcErr(`Kalibrlangan rate (${rate.toFixed(3)}) oraliqdan tashqari`));
    }

    return Ok(rate);
  }
}

function buildCheckpoints(maxN: number): number[] {
  const points: number[] = [];
  let n = 1;
  while (n <= maxN) {
    points.push(n);
    n = n < 10 ? n + 1 : n < 100 ? n + 10 : n + 50;
  }
  if (points[points.length - 1] !== maxN) points.push(maxN);
  return points;
}
