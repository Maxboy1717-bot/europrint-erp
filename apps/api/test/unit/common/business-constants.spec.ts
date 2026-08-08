/**
 * test/unit/common/business-constants.spec.ts
 *
 * Lock-in tests for business.constants.ts: every constant the rest of the
 * codebase depends on (KPI weights, forecast multipliers, ABC thresholds,
 * commission rates, time durations) is asserted to have the documented
 * value + type. Catches accidental edits in PR review.
 */

import {
  KPI_WEIGHTS,
  KPI_RATING_THRESHOLDS,
  FORECAST,
  SLA_RESPONSE_HOURS,
  DEFAULT_ADVANCE_PERCENT,
  SAFETY_STOCK_FACTOR,
  QUEUE_POLL_INTERVAL_MS,
  SMS_TOKEN_TTL_MS,
  ASSET_EXPIRY_WINDOW_MS,
  COST_SPLIT_PAPER,
  COST_SPLIT_INK,
  COST_SPLIT_LABOR,
  COGS_MATERIAL_RATIO,
  FORECAST_CONFIDENCE_DEFAULT,
  MS_PER_DAY,
  SECONDS_PER_DAY,
  HW_ALPHA_MIN,
  HW_ALPHA_MAX,
  FORECAST_HOLDOUT_FRACTION,
  ENSEMBLE_EMA_ALPHA,
  CI_LOWER,
  CI_UPPER,
  ABC_A_THRESHOLD,
  ABC_B_THRESHOLD,
  CONFIDENCE_HIGH,
  CONFIDENCE_MEDIUM,
  CONFIDENCE_LOW,
  AI_TEMP_CONSERVATIVE,
  AI_TEMP_BALANCED,
  AI_TEMP_CREATIVE,
  LARGE_TX_THRESHOLD_UZS,
  MAX_FALLBACK_DAYS,
  SEVEN_DAYS_MS,
  THIRTY_DAYS_MS,
  MONTHS_PER_YEAR,
  COMMISSION_RATE,
  BULK_DISCOUNT_LARGE,
  BULK_DISCOUNT_SMALL,
  CHURN_HIGH_DAYS,
  CHURN_MED_DAYS,
  ABC_SCORE_WEIGHT,
} from '../../../src/common/constants/business.constants';

describe('business.constants', () => {
  it('sums to 1.0 when KPI_WEIGHTS components are added', () => {
    const sum = KPI_WEIGHTS.attendance + KPI_WEIGHTS.performance + KPI_WEIGHTS.tasks;
    expect(sum).toBeCloseTo(1.0, 10);
    expect(KPI_WEIGHTS.attendance).toBe(0.5);
    expect(KPI_WEIGHTS.performance).toBe(0.3);
    expect(KPI_WEIGHTS.tasks).toBe(0.2);
  });

  it('orders thresholds descending excellent > good > average when KPI_RATING_THRESHOLDS read', () => {
    expect(KPI_RATING_THRESHOLDS.excellent).toBe(0.9);
    expect(KPI_RATING_THRESHOLDS.good).toBe(0.75);
    expect(KPI_RATING_THRESHOLDS.average).toBe(0.6);
    expect(KPI_RATING_THRESHOLDS.excellent).toBeGreaterThan(KPI_RATING_THRESHOLDS.good);
    expect(KPI_RATING_THRESHOLDS.good).toBeGreaterThan(KPI_RATING_THRESHOLDS.average);
  });

  it('exposes symmetric optimistic/pessimistic multipliers when FORECAST read', () => {
    expect(FORECAST.optimistic).toBe(1.3);
    expect(FORECAST.pessimistic).toBe(0.7);
    expect(FORECAST.pipeline_conversion).toBe(0.6);
    expect(FORECAST.optimistic + FORECAST.pessimistic).toBeCloseTo(2.0, 10);
  });

  it('sums to 1.0 when COST_SPLIT_PAPER + INK + LABOR are added', () => {
    const total = COST_SPLIT_PAPER + COST_SPLIT_INK + COST_SPLIT_LABOR;
    expect(total).toBeCloseTo(1.0, 10);
    expect(COST_SPLIT_PAPER).toBe(0.4);
    expect(COST_SPLIT_INK).toBe(0.35);
    expect(COST_SPLIT_LABOR).toBe(0.25);
  });

  it('equals 86_400_000 / 86_400 when MS_PER_DAY / SECONDS_PER_DAY read', () => {
    expect(MS_PER_DAY).toBe(86_400_000);
    expect(SECONDS_PER_DAY).toBe(86_400);
    expect(MS_PER_DAY).toBe(SECONDS_PER_DAY * 1000);
  });

  it('orders bounds correctly when ABC_A_THRESHOLD < ABC_B_THRESHOLD read', () => {
    expect(ABC_A_THRESHOLD).toBe(0.8);
    expect(ABC_B_THRESHOLD).toBe(0.95);
    expect(ABC_A_THRESHOLD).toBeLessThan(ABC_B_THRESHOLD);
  });

  it('orders confidence tiers correctly when HIGH > MEDIUM > LOW read', () => {
    expect(CONFIDENCE_HIGH).toBe(0.9);
    expect(CONFIDENCE_MEDIUM).toBe(0.75);
    expect(CONFIDENCE_LOW).toBe(0.5);
    expect(CONFIDENCE_HIGH).toBeGreaterThan(CONFIDENCE_MEDIUM);
    expect(CONFIDENCE_MEDIUM).toBeGreaterThan(CONFIDENCE_LOW);
  });

  it('orders AI temperatures conservative < balanced < creative when read', () => {
    expect(AI_TEMP_CONSERVATIVE).toBe(0.3);
    expect(AI_TEMP_BALANCED).toBe(0.5);
    expect(AI_TEMP_CREATIVE).toBe(0.7);
  });

  it('exposes 7-day and 30-day windows in ms when SEVEN_DAYS_MS / THIRTY_DAYS_MS read', () => {
    expect(SEVEN_DAYS_MS).toBe(7 * MS_PER_DAY);
    expect(THIRTY_DAYS_MS).toBe(30 * MS_PER_DAY);
    expect(ASSET_EXPIRY_WINDOW_MS).toBe(THIRTY_DAYS_MS);
  });

  it('orders BULK_DISCOUNT tiers small < large when minQty / rate read', () => {
    expect(BULK_DISCOUNT_LARGE.minQty).toBe(100);
    expect(BULK_DISCOUNT_LARGE.rate).toBe(0.1);
    expect(BULK_DISCOUNT_SMALL.minQty).toBe(50);
    expect(BULK_DISCOUNT_SMALL.rate).toBe(0.05);
    expect(BULK_DISCOUNT_LARGE.rate).toBeGreaterThan(BULK_DISCOUNT_SMALL.rate);
  });

  it('orders churn windows correctly when CHURN_HIGH > CHURN_MED read', () => {
    expect(CHURN_HIGH_DAYS).toBe(180);
    expect(CHURN_MED_DAYS).toBe(90);
    expect(CHURN_HIGH_DAYS).toBeGreaterThan(CHURN_MED_DAYS);
  });

  it('sums to 1.0 when ABC_SCORE_WEIGHT components are added', () => {
    const total =
      ABC_SCORE_WEIGHT.revenue +
      ABC_SCORE_WEIGHT.frequency +
      ABC_SCORE_WEIGHT.recency +
      ABC_SCORE_WEIGHT.margin +
      ABC_SCORE_WEIGHT.longevity;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('pins SD advance default to the owner-vision 70% (V-3340 #48 drift guard)', () => {
    // Bug fixed by #48: the quotation->order conversion used a 30% fallback while the
    // canonical new-order INSERT used 70%. Both now share DEFAULT_ADVANCE_PERCENT.
    // If this ever changes, the two code paths must move together — hence the pin.
    expect(DEFAULT_ADVANCE_PERCENT).toBe(70);
    expect(typeof DEFAULT_ADVANCE_PERCENT).toBe('number');
  });

  it('exposes scalar misc constants with expected values when read', () => {
    expect(SLA_RESPONSE_HOURS).toBe(4);
    expect(SAFETY_STOCK_FACTOR).toBe(0.5);
    expect(QUEUE_POLL_INTERVAL_MS).toBe(2_000);
    expect(SMS_TOKEN_TTL_MS).toBe(29 * 24 * 60 * 60 * 1_000);
    expect(COGS_MATERIAL_RATIO).toBe(0.6);
    expect(FORECAST_CONFIDENCE_DEFAULT).toBe(0.72);
    expect(HW_ALPHA_MIN).toBe(0.01);
    expect(HW_ALPHA_MAX).toBe(0.99);
    expect(FORECAST_HOLDOUT_FRACTION).toBe(0.2);
    expect(ENSEMBLE_EMA_ALPHA).toBe(0.3);
    expect(CI_LOWER).toBe(0.025);
    expect(CI_UPPER).toBe(0.975);
    expect(LARGE_TX_THRESHOLD_UZS).toBe(50_000_000);
    expect(MAX_FALLBACK_DAYS).toBe(9_999);
    expect(MONTHS_PER_YEAR).toBe(12);
    expect(COMMISSION_RATE).toBe(0.05);
  });

  it('declares numeric types when typeof check runs on every scalar', () => {
    expect(typeof SLA_RESPONSE_HOURS).toBe('number');
    expect(typeof MS_PER_DAY).toBe('number');
    expect(typeof COMMISSION_RATE).toBe('number');
    expect(typeof KPI_WEIGHTS.attendance).toBe('number');
  });
});
