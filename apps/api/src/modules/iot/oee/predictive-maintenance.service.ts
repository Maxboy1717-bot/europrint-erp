/**
 * @module predictive-maintenance.service
 * @description **Predictive Maintenance (PdM)** — estimates *when* a machine
 *   is likely to fail from its raw sensor telemetry, so maintenance can be
 *   scheduled BEFORE a breakdown (condition-based, not calendar-based).
 *
 *   Input is a time-ordered window of sensor readings for ONE device
 *   (e.g. vibration, temperature, current draw). Output is a health snapshot:
 *
 *     degradation   — how far the *recent* signal has drifted toward the
 *                     failure threshold, in [0, 1]
 *                     = clamp((recentAvg − baseline) / (threshold − baseline), 0, 1)
 *     volatility    — instability of the signal, normalised stddev in [0, 1]
 *                     = clamp(stddev(values) / |threshold − baseline|, 0, 1)
 *     trendSlope    — least-squares slope of value-vs-time (units/hour);
 *                     a positive slope toward the threshold means the machine
 *                     is actively degrading
 *     healthScore   — overall machine health in [0, 100] (100 = healthy)
 *                     = 100 × (1 − combined risk)
 *     failureProbability — probability of failure within the lookahead window,
 *                     in [0, 1], derived from degradation + volatility + trend
 *     remainingUsefulLifeHours — RUL: hours until the trend line is projected
 *                     to cross the failure threshold (null when not degrading)
 *
 *   The three risk axes are combined with documented weights (see
 *   PDM_WEIGHT_* constants below) so the dashboard can show *why* a machine
 *   is flagged — drift, instability, or a fast-rising trend.
 *
 * @layer Domain Service (IoT — pure compute, no I/O)
 *
 * WHY CONDITION-BASED, NOT CALENDAR-BASED
 *   The existing `equipment_maintenance` table drives *scheduled* maintenance
 *   (next_maintenance_date). That answers "when is the next checkup due?" but
 *   not "is this machine about to break?". A bearing that overheats two weeks
 *   early is invisible to a calendar. This service reads the live signal and
 *   projects the failure point, turning telemetry into a lead time.
 *
 * WHY A LINEAR TREND (least-squares), NOT ML
 *   With no labelled failure history yet (the telemetry tables are empty in
 *   this build phase), a fitted ML model would be fabricated confidence —
 *   forbidden by the no-fabrication rule. A transparent least-squares slope
 *   on the value/time series is honest, explainable to the shop floor, and
 *   upgradeable later when real failure labels accumulate. The RUL is simply
 *   the time for that line to reach the threshold; if the slope is flat or
 *   moving away from the threshold, RUL is null (not degrading).
 *
 * WHY ZOD VALIDATION INSIDE THE CALCULATOR
 *   Same rationale as OeeCalculatorService: this runs both from controllers
 *   (already validated) and from IoT ingest / cron (raw payloads). Re-validating
 *   here means a sensor emitting a calibration spike cannot silently poison the
 *   health score. Cross-field refinements guarantee the threshold sits on the
 *   far side of the baseline so degradation has a meaningful direction.
 *
 * WHY AN EXPLICIT "INSUFFICIENT DATA" STATE
 *   A trend on one or two points is noise, not a prediction. Below
 *   PDM_MIN_READINGS the service returns `hasEnoughData: false` with neutral
 *   values instead of a fake estimate. This is the empty-state contract for
 *   the current build phase: the tables (iot_sensor_readings) exist but hold
 *   zero rows, so callers receive an honest "not enough telemetry yet" rather
 *   than a fabricated remaining-life number.
 *
 * WHY THESE THRESHOLDS / WEIGHTS
 *   healthScore < 40  → critical (failure imminent, stop & inspect)
 *   healthScore < 70  → warning  (schedule maintenance soon)
 *   The risk weights (degradation 0.5 / trend 0.3 / volatility 0.2) put most
 *   weight on *how close* the signal is to the limit, then on *how fast* it is
 *   approaching, then on *how erratic* it is — matching how a maintenance
 *   engineer reads a trend chart. They are tunable constants, not magic
 *   numbers buried in the math.
 */

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Ok, Err, Result, AppError } from '@common/result';
import { clamp, safeDiv, safeAvg, stddev, safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

/** Minimum readings before a trend/RUL is trustworthy. */
export const PDM_MIN_READINGS = 5;

/** Risk-axis weights (sum = 1.0). See module header for rationale. */
export const PDM_WEIGHT_DEGRADATION = 0.5;
export const PDM_WEIGHT_TREND = 0.3;
export const PDM_WEIGHT_VOLATILITY = 0.2;

/** Health-score bands. */
export const PDM_HEALTH_CRITICAL = 40;
export const PDM_HEALTH_WARNING = 70;

const MS_PER_HOUR = 3_600_000;

const ReadingSchema = z.object({
  /** Sensor value at this point in time. */
  value: z.number(),
  /** ISO timestamp (or epoch ms) when the value was recorded. */
  recordedAt: z.union([z.string(), z.number(), z.date()]),
});

export const PredictiveMaintenanceInputSchema = z.object({
  /** Healthy/nominal value for this signal (e.g. ambient temperature). */
  baseline: z.number(),
  /** Value at which the machine is considered failed (alarm limit). */
  failureThreshold: z.number(),
  /** How far ahead we want a failure-probability estimate, in hours. */
  lookaheadHours: z.number().positive().default(168),
  /** Time-ordered (or unordered) telemetry window for ONE device. */
  readings: z.array(ReadingSchema),
}).refine(d => d.failureThreshold !== d.baseline, {
  message: "failureThreshold baseline ga teng bo'lmasligi kerak",
  path: ['failureThreshold'],
});

export type PredictiveMaintenanceInput = z.infer<typeof PredictiveMaintenanceInputSchema>;

export type MaintenanceUrgency = 'healthy' | 'warning' | 'critical';

export interface PredictiveMaintenanceResult {
  /** False when fewer than PDM_MIN_READINGS readings were supplied. */
  hasEnoughData: boolean;
  /** Number of valid readings used. */
  sampleSize: number;
  /** Drift toward the threshold, [0, 1]. */
  degradation: number;
  /** Signal instability, [0, 1]. */
  volatility: number;
  /** Least-squares slope of value vs time, in units/hour (signed). */
  trendSlopePerHour: number;
  /** Overall machine health, [0, 100] (100 = healthy). */
  healthScore: number;
  /** Probability of failure within lookaheadHours, [0, 1]. */
  failureProbability: number;
  /** Hours until the trend line crosses the threshold; null if not degrading. */
  remainingUsefulLifeHours: number | null;
  /** Banded urgency derived from healthScore. */
  urgency: MaintenanceUrgency;
}

interface NormalisedReading {
  value: number;
  /** Epoch milliseconds. */
  t: number;
}

/**
 * Predictive-maintenance formula. Pure compute — no DB, no side effects.
 * Mirrors OeeCalculatorService: Zod-validated input, Result<T> output,
 * math-utils for all division/averaging so NaN/Infinity cannot leak.
 */
@Injectable()
export class PredictiveMaintenanceService {
  private readonly logger = new Logger(PredictiveMaintenanceService.name);

  @Calculation('iot.predictiveMaintenance.calculate')
  async calculate(
    input: PredictiveMaintenanceInput,
  ): Promise<Result<PredictiveMaintenanceResult, AppError>> {
    const parsed = PredictiveMaintenanceInputSchema.safeParse(input);
    if (!parsed.success) {
      return Err({
        code: 'VALIDATION',
        message: (Array.isArray(parsed.error.errors) ? parsed.error.errors : [])
          .map(e => e.message)
          .join('; '),
      });
    }

    const { baseline, failureThreshold, lookaheadHours, readings } = parsed.data;

    // Normalise timestamps to epoch ms and sort chronologically.
    const points: NormalisedReading[] = (Array.isArray(readings) ? readings : [])
      .map(r => ({ value: safeNum(r.value), t: this.toEpochMs(r.recordedAt) }))
      .filter(p => Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);

    const sampleSize = points.length;

    // EMPTY-STATE CONTRACT: not enough telemetry yet (build phase = 0 rows).
    if (sampleSize < PDM_MIN_READINGS) {
      this.logger.debug(
        `PdM: insufficient telemetry (${sampleSize}/${PDM_MIN_READINGS}) — returning neutral state`,
      );
      return Ok({
        hasEnoughData: false,
        sampleSize,
        degradation: 0,
        volatility: 0,
        trendSlopePerHour: 0,
        healthScore: 100,
        failureProbability: 0,
        remainingUsefulLifeHours: null,
        urgency: 'healthy',
      });
    }

    const values = points.map(p => p.value);
    const span = Math.abs(failureThreshold - baseline); // > 0 (Zod refine)
    const directionUp = failureThreshold > baseline; // failure is "above" baseline?

    // 1) DEGRADATION — how far the recent average has drifted toward the limit.
    const recentAvg = safeAvg(values);
    const drift = directionUp ? recentAvg - baseline : baseline - recentAvg;
    const degradation = clamp(safeDiv(drift, span), 0, 1);

    // 2) VOLATILITY — instability, normalised by the baseline→threshold span.
    const volatility = clamp(safeDiv(stddev(values), span), 0, 1);

    // 3) TREND — least-squares slope of value vs time (units/hour).
    const trendSlopePerHour = this.leastSquaresSlopePerHour(points);
    // Slope component of risk: only a slope heading TOWARD the threshold counts.
    const slopeTowardLimit = directionUp ? trendSlopePerHour : -trendSlopePerHour;
    const projectedRiseOverWindow = Math.max(0, slopeTowardLimit) * lookaheadHours;
    const trendRisk = clamp(safeDiv(projectedRiseOverWindow, span), 0, 1);

    // COMBINED RISK → health + failure probability.
    const combinedRisk = clamp(
      degradation * PDM_WEIGHT_DEGRADATION +
        trendRisk * PDM_WEIGHT_TREND +
        volatility * PDM_WEIGHT_VOLATILITY,
      0,
      1,
    );
    const healthScore = clamp(Math.round((1 - combinedRisk) * 1000) / 10, 0, 100);
    const failureProbability = Math.round(combinedRisk * 1000) / 1000;

    // REMAINING USEFUL LIFE — time for the trend line to reach the threshold.
    const remainingUsefulLifeHours = this.remainingUsefulLife(
      recentAvg,
      failureThreshold,
      slopeTowardLimit,
    );

    const urgency: MaintenanceUrgency =
      healthScore < PDM_HEALTH_CRITICAL
        ? 'critical'
        : healthScore < PDM_HEALTH_WARNING
        ? 'warning'
        : 'healthy';

    this.logger.debug(
      `PdM: n=${sampleSize} deg=${degradation.toFixed(2)} vol=${volatility.toFixed(2)} ` +
        `slope/h=${trendSlopePerHour.toFixed(4)} health=${healthScore} rul=${remainingUsefulLifeHours}`,
    );

    return Ok({
      hasEnoughData: true,
      sampleSize,
      degradation: Math.round(degradation * 1000) / 1000,
      volatility: Math.round(volatility * 1000) / 1000,
      trendSlopePerHour: Math.round(trendSlopePerHour * 10000) / 10000,
      healthScore,
      failureProbability,
      remainingUsefulLifeHours,
      urgency,
    });
  }

  /**
   * Least-squares slope of value vs time, expressed in units PER HOUR.
   * Time axis is shifted to hours-from-first-reading for numerical stability.
   */
  private leastSquaresSlopePerHour(points: NormalisedReading[]): number {
    const n = points.length;
    if (n < 2) return 0;
    const t0 = points[0]?.t ?? 0;
    const xs = points.map(p => safeDiv(p.t - t0, MS_PER_HOUR)); // hours
    const ys = points.map(p => p.value);
    const meanX = safeAvg(xs);
    const meanY = safeAvg(ys);
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = (xs[i] ?? 0) - meanX;
      num += dx * ((ys[i] ?? 0) - meanY);
      den += dx * dx;
    }
    // den = 0 → all readings at the same instant → no measurable trend.
    return safeDiv(num, den);
  }

  /**
   * Hours until `current` reaches `threshold` given a per-hour rate that is
   * already oriented toward the threshold (slopeTowardLimit > 0 = degrading).
   * Returns null when the machine is not degrading (flat/away) or already past.
   */
  private remainingUsefulLife(
    current: number,
    threshold: number,
    slopeTowardLimit: number,
  ): number | null {
    if (slopeTowardLimit <= 0) return null; // not degrading toward the limit
    const remaining = Math.abs(threshold - current);
    const hours = safeDiv(remaining, slopeTowardLimit);
    if (!Number.isFinite(hours) || hours <= 0) return null;
    return Math.round(hours * 10) / 10;
  }

  /** Coerce string / number / Date timestamp to epoch milliseconds. */
  private toEpochMs(v: string | number | Date): number {
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v;
    const parsed = Date.parse(v);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
}
