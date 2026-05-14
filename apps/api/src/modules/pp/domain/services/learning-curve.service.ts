/**
 * @module learning-curve.service
 * @description Wright's Learning Curve calculator. Predicts how unit-time
 *   drops as workers gain experience producing the same item. Used when
 *   quoting a new product (no historical actuals) or planning a ramp-up
 *   for a redesigned product line.
 *
 *   Wright (1936) formula — cumulative average time:
 *     T̄_n = t1 × n^(log₂ rate)
 *
 *   Individual unit time (n-th unit alone):
 *     t_n = T̄_n × n − T̄_{n−1} × (n−1)
 *
 *   "Rate" is the learning factor: 0.80 means each doubling of cumulative
 *   volume reduces average time to 80% of its previous value. So:
 *     unit  1: t1 minutes
 *     unit  2: 0.80 × t1
 *     unit  4: 0.80² × t1 = 0.64 × t1
 *     unit  8: 0.80³ × t1 = 0.512 × t1
 *     unit 16: 0.80⁴ × t1 = 0.41 × t1
 *
 *   Two operations:
 *     - `calculate(input)`   — predict the curve from a known t1 + rate
 *     - `calibrate(n1, t1, n2, t2)` — derive `rate` from two observed
 *                                      production data points
 * @layer Domain Service (PP — pure math, no I/O)
 *
 * WHY 80% AS THE DEFAULT
 *   80% is the industry-standard "moderate complexity assembly" learning
 *   rate (aerospace + automotive baselines). Print packaging is in the same
 *   complexity zone — operators learn the press setup over a few hundred
 *   units. Highly automated lines have higher rates (less manual learning
 *   to do — 90%+); fully manual artisan work has lower rates (70-75%).
 *
 *   Override via `input.rate` when you have a per-product calibration.
 *
 * WHY THE [0.60, 1.00] BOUND ON rate
 *   - rate ≥ 1.00 = no learning happens (units don't get faster). Always
 *     a sign of bad data; we reject.
 *   - rate < 0.60 = 40%+ improvement per doubling. Physically implausible
 *     for non-toy operations; almost certainly a data-entry error.
 *   Either failure points to bad calibration inputs rather than a real
 *   learning curve.
 *
 * WHY LOGARITHMIC CHECKPOINTS (1,2,...10,20,...100,150,...)
 *   The curve flattens — the difference between unit 100 and unit 101 is
 *   tiny compared to unit 1 vs unit 2. Plotting every unit wastes
 *   pixels. Logarithmic checkpoints give a roughly even-density curve in
 *   log space, which is what the dashboard chart actually renders.
 *
 * WHY THIS LIVES IN PP, NOT FI
 *   The output is a *time* prediction, which feeds production scheduling
 *   (MES timing, capacity planning). FI uses it indirectly via standard
 *   cost — but PP owns the curve generation because rate calibration
 *   requires understanding the routing and labour stations.
 *
 * REFERENCE
 *   T.P. Wright, "Factors Affecting the Cost of Airplanes" (1936),
 *   Journal of Aeronautical Sciences. Still the canonical citation.
 */

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

    const points: LearningCurvePoint[] = (Array.isArray(checkpoints) ? checkpoints : []).map((n) => ({
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
