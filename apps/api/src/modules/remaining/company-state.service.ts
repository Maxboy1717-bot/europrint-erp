/**
 * @module company-state.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * EP-DIR-001 / EP-DIR-029 (flagship contradiction fix):
 *   The live GET /api/company-state/current now delegates company-state scoring to the
 *   vision-correct DirectorHolatService (5 weighted, configurable metrics, 5 levels)
 *   instead of the legacy 3-metric hardcoded profit/revenue/retention formula.
 *
 *   - Weights + per-metric value bands come from the `state_thresholds` table (25 rows).
 *   - Level labels/colors come from the `company_state_levels` table (5 rows).
 *   - The 5 raw metric values come from live data (cash_flow/production_plan/orders/hr/quality).
 *
 *   The response SHAPE consumed by the FE (CompanyStatePage + CompanyStateWidget) is
 *   preserved: { state, status, label{uz,ru,emoji}, kpis{...}, summary{...}, thresholds, generatedAt }.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import {
  DIR_DECLINE_ALERT_DAYS,
  DIR_DECLINE_TREND_DAYS,
  DIR_DECLINE_LOOKBACK_DAYS,
} from '@common/constants/business.constants';
import { CompanyStateRepository, type StateThresholdRow, type StateLevelRow, type OperationsMetrics } from './company-state.repository';
import { DirectorHolatService, type WeightMap } from '../director/application/director-holat.service';
import {
  HOLAT_METRIC_KEYS,
  HOLAT_LEVELS,
  type HolatMetricKey,
  type HolatLevel,
} from '../director/application/director-holat.constants';

/** Lowercase FE state keys the dashboard widgets/colors are keyed on. */
type FeStateKey = 'osish' | 'normal' | 'ehtiyot' | 'xavf' | 'inqiroz';

/**
 * Each holat level maps to a representative normalised metric score (0-100) that
 * sits safely inside the corresponding DirectorHolatService band
 * (OSISH≥85, NORMAL≥65, EHTIYOT≥45, XAVF≥25, INQIROZ≥0). A metric classified into
 * a given level contributes this score; the weighted sum then re-classifies into
 * the overall level.
 */
const LEVEL_NORMALISED_SCORE: Record<HolatLevel, number> = {
  OSISH: 92,
  NORMAL: 75,
  EHTIYOT: 55,
  XAVF: 35,
  INQIROZ: 10,
};

/** Level → FE lowercase key + emoji (DB carries labels/colors, not emoji). */
const LEVEL_FE: Record<HolatLevel, { key: FeStateKey; emoji: string }> = {
  OSISH:   { key: 'osish',   emoji: '🚀' },
  NORMAL:  { key: 'normal',  emoji: '✅' },
  EHTIYOT: { key: 'ehtiyot', emoji: '⚠️' },
  XAVF:    { key: 'xavf',    emoji: '🔶' },
  INQIROZ: { key: 'inqiroz', emoji: '🚨' },
};

@Injectable()
export class CompanyStateService {
  private readonly logger = new Logger(CompanyStateService.name);

  constructor(
    private readonly repo: CompanyStateRepository,
    private readonly holat: DirectorHolatService,
  ) {}

  async getCurrent(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [thresholdsR, levelsR, metricsR, opsR] = await Promise.all([
        this.repo.getStateThresholds(),
        this.repo.getStateLevels(),
        this.repo.getRawMetrics(),
        this.repo.getOperationsMetrics(),
      ]);

      const thresholdRows: StateThresholdRow[] = thresholdsR.ok ? thresholdsR.data : [];
      const levelRows: StateLevelRow[] = levelsR.ok ? levelsR.data : [];
      const m = metricsR.ok
        ? metricsR.data
        : {
            cash_flow: 0, production_plan: 0, orders: 0, hr: 0, quality: 100,
            revenue: 0, expenses: 0, totalEmployees: 0, activeEmployees: 0, activeOrders: 0,
          };
      const ops: OperationsMetrics = opsR.ok
        ? opsR.data
        : {
            downtimeEventsCount: 0, downtimeMinutesTotal: 0, downtimeMinutesAvg: 0,
            machineAvailabilityPct: 0, machinePerformancePct: 0,
          };

      // ---- Build configurable weight map from DB (EP-DIR-001) --------------
      const weights = this.buildWeights(thresholdRows);

      // ---- Classify each raw metric into a 0-100 normalised score ----------
      const rawValues: Record<HolatMetricKey, number> = {
        cash_flow: m.cash_flow,
        production_plan: m.production_plan,
        orders: m.orders,
        hr: m.hr,
        quality: m.quality,
      };
      const normalised = {} as Record<HolatMetricKey, number>;
      for (const key of HOLAT_METRIC_KEYS) {
        const level = this.classifyMetric(key, rawValues[key], thresholdRows);
        normalised[key] = LEVEL_NORMALISED_SCORE[level];
      }

      // ---- Delegate to the vision-correct 5-metric holat formula -----------
      const holatResult = this.holat.computeHolat(normalised, { weights });
      const level: HolatLevel = holatResult.ok ? holatResult.data.level : 'INQIROZ';
      const fe = LEVEL_FE[level];

      // ---- Resolve display label from DB (fallback to constants) ----------
      const levelRow = levelRows.find((r) => r.code === level);
      const labelUz = levelRow?.label_uz ?? level;
      const labelRu = levelRow?.label_ru ?? level;

      // ---- Legacy KPI support figures (preserve FE shape) -----------------
      const profit = m.revenue - m.expenses;
      const retentionPct = m.totalEmployees > 0
        ? Math.round((m.activeEmployees / m.totalEmployees) * 100)
        : 0;
      const fmt = (n: number) =>
        n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} mlrd` :
        n >= 1_000_000     ? `${(n / 1_000_000).toFixed(1)} mln` :
        n.toLocaleString('uz-UZ');

      return {
        // Page consumer keys on `state`; widget keys on `status` — provide both.
        state: fe.key,
        status: fe.key,
        level,
        label: { uz: labelUz, ru: labelRu, emoji: fe.emoji },
        label_ru: labelRu,
        emoji: fe.emoji,
        kpis: {
          profit,
          revenue: m.revenue,
          expenses: m.expenses,
          costs: m.expenses,
          retentionPct,
          retention_pct: retentionPct,
          profit_pct: Math.round(normalised.cash_flow),
          revenue_pct: Math.round(normalised.orders),
          totalEmployees: m.totalEmployees,
          activeEmployees: m.activeEmployees,
          activeOrders: m.activeOrders,
        },
        // Per-metric normalised breakdown (5-metric vision, real values).
        metrics: {
          cash_flow: { raw: m.cash_flow, score: normalised.cash_flow, weight: weights.cash_flow },
          production_plan: { raw: m.production_plan, score: normalised.production_plan, weight: weights.production_plan },
          orders: { raw: m.orders, score: normalised.orders, weight: weights.orders },
          hr: { raw: m.hr, score: normalised.hr, weight: weights.hr },
          quality: { raw: m.quality, score: normalised.quality, weight: weights.quality },
        },
        // Director-level operations figures — downtime (downtime_events) + machine
        // telemetry health (mes_telemetry), real live data alongside production_plan
        // above. No "energy" field: see OperationsMetrics doc-comment (owner ruling
        // EP-IOT-018 — no real energy sensor data exists, fabricating one is banned).
        operations: {
          downtimeEventsCount: ops.downtimeEventsCount,
          downtimeMinutesTotal: Math.round(ops.downtimeMinutesTotal * 100) / 100,
          downtimeMinutesAvg: Math.round(ops.downtimeMinutesAvg * 100) / 100,
          machineAvailabilityPct: Math.round(ops.machineAvailabilityPct * 10) / 10,
          machinePerformancePct: Math.round(ops.machinePerformancePct * 10) / 10,
        },
        score: holatResult.ok ? holatResult.data.score : 0,
        summary: {
          profitFormatted: fmt(profit),
          revenueFormatted: fmt(m.revenue),
          expensesFormatted: fmt(m.expenses),
        },
        weights,
        generatedAt: _time.now().toISOString(),
        generated_at: _time.now().toISOString(),
      };
    });
  }

  /**
   * EP-DIR-005 — "Og'ish tezligi" (rate-of-change) detector (vision 05-director
   * #3). Reads the recent DAILY holat scores (company_state_log) and counts the
   * current run of consecutive day-over-day declines ending at the latest day:
   *   - run >= DIR_DECLINE_TREND_DAYS (2) → `trend` flag (early warning)
   *   - run >= DIR_DECLINE_ALERT_DAYS (3) → emit the `EP-DIR-005` alert event
   * The 2/3 thresholds are vision-given (not owner config). Emission is
   * idempotent per calendar day.
   */
  async detectConsecutiveDecline(): Promise<Result<{
    daysChecked: number;
    consecutiveDeclineDays: number;
    trend: boolean;
    alert: boolean;
    emitted: boolean;
  }, AppError>> {
    return safeCall(async () => {
      const scoresR = await this.repo.getRecentDailyScores(DIR_DECLINE_LOOKBACK_DAYS);
      const rows = scoresR.ok ? scoresR.data : [];

      // rows are most-recent day first; count consecutive strict declines.
      let run = 0;
      for (let i = 0; i + 1 < rows.length; i++) {
        if (rows[i].score < rows[i + 1].score) run++;
        else break;
      }

      const trend = run >= DIR_DECLINE_TREND_DAYS;
      const alert = run >= DIR_DECLINE_ALERT_DAYS;

      let emitted = false;
      if (alert) {
        const latest = rows[0];
        const aggregateId = latest ? latest.day : 'company';
        const emitR = await this.repo.emitDeclineAlertOncePerDay(aggregateId, {
          code: 'EP-DIR-005',
          type: 'dir.state.declineAlert',
          consecutiveDeclineDays: run,
          latestDay: latest?.day ?? null,
          latestScore: latest?.score ?? null,
          scores: rows.map((r) => r.score),
        });
        emitted = emitR.ok ? emitR.data.emitted : false;
      }

      return {
        daysChecked: rows.length,
        consecutiveDeclineDays: run,
        trend,
        alert,
        emitted,
      };
    });
  }

  /**
   * Build a normalised WeightMap from the state_thresholds rows. Each metric's
   * weight is duplicated across its 5 level rows; take the first non-null per
   * metric. Falls back to the holat constants default if a metric is missing or
   * the DB sum is not 1.0 (DirectorHolatService validates the sum strictly).
   */
  private buildWeights(rows: StateThresholdRow[]): WeightMap {
    const byMetric = new Map<string, number>();
    for (const r of rows) {
      if (!byMetric.has(r.metric_key) && Number.isFinite(r.weight)) {
        byMetric.set(r.metric_key, r.weight);
      }
    }
    const candidate = {} as WeightMap;
    let sum = 0;
    let complete = true;
    for (const key of HOLAT_METRIC_KEYS) {
      const w = byMetric.get(key);
      if (w === undefined || !Number.isFinite(w) || w < 0) {
        complete = false;
        break;
      }
      candidate[key] = w;
      sum += w;
    }
    if (complete && Math.abs(sum - 1.0) <= 0.001) return candidate;
    this.logger.warn(
      `state_thresholds weights unusable (sum=${sum.toFixed(3)}, complete=${complete}); falling back to holat defaults`,
    );
    return DEFAULT_HOLAT_WEIGHTS_FALLBACK;
  }

  /**
   * Classify a single raw metric value into a holat level using its configurable
   * per-level value bands from state_thresholds. A band matches when
   *   value >= min_value (or min is NULL/open-low)  AND  value <= max_value (or max is NULL/open-high).
   * Returns INQIROZ when no band matches (defensive; bands seed full coverage).
   */
  private classifyMetric(
    metric: HolatMetricKey,
    value: number,
    rows: StateThresholdRow[],
  ): HolatLevel {
    const bands = rows.filter((r) => r.metric_key === metric);
    for (const level of HOLAT_LEVELS) {
      const band = bands.find((b) => b.level_code === level);
      if (!band) continue;
      const aboveMin = band.min_value == null || value >= band.min_value;
      const belowMax = band.max_value == null || value <= band.max_value;
      if (aboveMin && belowMax) return level;
    }
    return 'INQIROZ';
  }
}

/**
 * Local fallback weight map (mirrors DEFAULT_HOLAT_WEIGHTS). Used only when the
 * DB weights are missing/inconsistent; kept here so the service has no hard
 * dependency on the constants module shape beyond the public types.
 */
const DEFAULT_HOLAT_WEIGHTS_FALLBACK: WeightMap = {
  cash_flow: 0.30,
  production_plan: 0.25,
  orders: 0.20,
  hr: 0.15,
  quality: 0.10,
};
