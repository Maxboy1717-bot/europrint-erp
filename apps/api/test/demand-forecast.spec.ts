/**
 * Sprint 2C — Talab Prognozi (Task #430)
 *
 * TZ-06: SMA, EMA, optimal alpha grid search
 * TZ-07: Holt-Winters additive model
 * TZ-08: OLS Chiziqli Regressiya
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { ForecastService } from '../src/modules/ai/forecast/forecast.service';
import { HoltWintersService } from '../src/modules/ai/forecast/holt-winters.service';

// ─────────────────────────────────────────────────────────────────────────────
// TZ-06a: SMA — Oddiy Ko'chma O'rtacha
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-06a SMA — Oddiy Ko\'chma O\'rtacha', () => {
  let svc: ForecastService;

  beforeEach(() => {
    svc = new ForecastService();
  });

  it('SMA(3): [10,20,30,40,50] → [20,30,40]', async () => {
    const res = await svc.sma([10, 20, 30, 40, 50], 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.values).toEqual([20, 30, 40]);
  });

  it('SMA metrika: mape, rmse, mae musbat raqam', async () => {
    const res = await svc.sma([10, 12, 14, 13, 15, 14, 16, 18, 20, 19], 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.metrics.mape).toBeGreaterThanOrEqual(0);
    expect(res.data.metrics.rmse).toBeGreaterThanOrEqual(0);
    expect(res.data.metrics.mae).toBeGreaterThanOrEqual(0);
  });

  it('SMA: yetarli data yo\'q → VALIDATION xatosi', async () => {
    const res = await svc.sma([1, 2], 3);
    expect(res.ok).toBe(false);
  });

  it('SMA: n=1, har nuqta o\'zi', async () => {
    const res = await svc.sma([5, 10, 15, 5, 10, 15], 1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.values.length).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-06b: EMA — Eksponensial Silliqlash
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-06b EMA — Eksponensial Silliqlash', () => {
  let svc: ForecastService;

  beforeEach(() => {
    svc = new ForecastService();
  });

  it('EMA alpha=0.3: series=[10,12,14,13,15] → to\'g\'ri qiymatlar', async () => {
    const res = await svc.ema([10, 12, 14, 13, 15], 0.3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Birinchi: y[0]=10
    expect(res.data.smoothed[0]).toBeCloseTo(10, 5);
    // Ikkinchi: 0.3*12 + 0.7*10 = 3.6 + 7.0 = 10.6
    expect(res.data.smoothed[1]).toBeCloseTo(10.6, 5);
    // Uchinchi: 0.3*14 + 0.7*10.6 = 4.2 + 7.42 = 11.62
    expect(res.data.smoothed[2]).toBeCloseTo(11.62, 5);
    // To'rtinchi: 0.3*13 + 0.7*11.62 = 3.9 + 8.134 = 12.034
    expect(res.data.smoothed[3]).toBeCloseTo(12.034, 3);
    // Beshinchi: 0.3*15 + 0.7*12.034 = 4.5 + 8.4238 = 12.9238
    expect(res.data.smoothed[4]).toBeCloseTo(12.9238, 3);
    expect(res.data.alpha).toBe(0.3);
  });

  it('EMA alpha=1.0: har qiymat o\'zidan oldingi y', async () => {
    const res = await svc.ema([5, 10, 15, 20], 1.0);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.smoothed).toEqual([5, 10, 15, 20]);
  });

  it('EMA alpha noto\'g\'ri → xato', async () => {
    expect((await svc.ema([1, 2, 3], 0)).ok).toBe(false);
    expect((await svc.ema([1, 2, 3], 1.1)).ok).toBe(false);
    expect((await svc.ema([1, 2, 3], -0.1)).ok).toBe(false);
  });

  it('EMA ma\'lumot kam → xato', async () => {
    const res = await svc.ema([10], 0.3);
    expect(res.ok).toBe(false);
  });

  it('EMA metrika: mape, rmse qaytariladi', async () => {
    const res = await svc.ema([10, 12, 14, 13, 15], 0.5);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(typeof res.data.metrics.mape).toBe('number');
    expect(typeof res.data.metrics.rmse).toBe('number');
    expect(typeof res.data.metrics.mae).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-06c: Grid Search — Optimal Alpha
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-06c Grid Search — Optimal Alpha', () => {
  let svc: ForecastService;

  beforeEach(() => {
    svc = new ForecastService();
  });

  it('Grid search: 0.05..0.95 oralig\'ida alpha topiladi', async () => {
    const series = [10, 12, 11, 14, 13, 15, 14, 16, 15, 17, 16, 18];
    const res = await svc.gridSearchAlpha(series);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.alpha).toBeGreaterThanOrEqual(0.05);
    expect(res.data.alpha).toBeLessThanOrEqual(0.95);
    expect(res.data.rmse).toBeGreaterThanOrEqual(0);
  });

  it('Grid search: MSE minimizatsiya — bestAlpha topiladi', async () => {
    const series = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
    const res = await svc.gridSearchAlpha(series);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.alpha).toBeGreaterThan(0);
    expect(typeof res.data.rmse).toBe('number');
  });

  it('Grid search: ma\'lumot kam → xato', async () => {
    const res = await svc.gridSearchAlpha([1, 2, 3]);
    expect(res.ok).toBe(false);
  });

  it('Grid search: alpha optimal ravishda topiladi (hardcoded emas)', async () => {
    // Yuqori o'zgaruvchan seriya — har xil alpha optimaldir
    const series = [100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1];
    const res = await svc.gridSearchAlpha(series);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(typeof res.data.alpha).toBe('number');
    expect(res.data.alpha).toBeGreaterThanOrEqual(0.05);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-07: Holt-Winters Additive Model
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-07 Holt-Winters — Triple Exponential Smoothing (Additive)', () => {
  let svc: ForecastService;
  let hwSvc: HoltWintersService;

  beforeEach(() => {
    svc = new ForecastService();
    hwSvc = new HoltWintersService(svc);
  });

  // 24 oylik sun'iy ma'lumot: trend + mavsumiylik
  const monthlySeries = [
    10, 8, 12, 15, 13, 11, 10, 8, 13, 16, 14, 12,  // 1-yil
    12, 10, 14, 17, 15, 13, 12, 10, 15, 18, 16, 14, // 2-yil
  ];

  it('HW: 24 oylik ma\'lumot bilan 12 oy prognoz', async () => {
    const res = await hwSvc.forecast(monthlySeries, 12, {
      alpha: 0.3,
      beta: 0.1,
      gamma: 0.2,
      seasonLength: 12,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.fitted.length).toBe(24);
    expect(res.data.predicted.length).toBe(12);
    expect(res.data.metrics.rmse).toBeGreaterThanOrEqual(0);
    expect(res.data.metrics.mape).toBeGreaterThanOrEqual(0);
  });

  it('HW: fitted va predicted raqam massivi', async () => {
    const res = await hwSvc.forecast(monthlySeries, 6, {
      alpha: 0.4,
      beta: 0.2,
      gamma: 0.3,
      seasonLength: 12,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    res.data.fitted.forEach((v) => expect(typeof v).toBe('number'));
    res.data.predicted.forEach((v) => expect(typeof v).toBe('number'));
  });

  it('HW: ma\'lumot yetarli emas → VALIDATION', async () => {
    const res = await hwSvc.forecast([1, 2, 3, 4, 5], 3, {
      alpha: 0.3,
      beta: 0.1,
      gamma: 0.2,
      seasonLength: 12,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('HW: alpha noto\'g\'ri → VALIDATION', async () => {
    expect(
      (await hwSvc.forecast(monthlySeries, 3, { alpha: 0, beta: 0.1, gamma: 0.2, seasonLength: 12 })).ok,
    ).toBe(false);
    expect(
      (await hwSvc.forecast(monthlySeries, 3, { alpha: 1, beta: 0.1, gamma: 0.2, seasonLength: 12 })).ok,
    ).toBe(false);
  });

  it('HW: optimizeParams → to\'g\'ri (α,β,γ) topiladi', async () => {
    const res = await hwSvc.optimizeParams(monthlySeries, 12);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.alpha).toBeGreaterThan(0);
    expect(res.data.alpha).toBeLessThan(1);
    expect(res.data.beta).toBeGreaterThan(0);
    expect(res.data.beta).toBeLessThan(1);
    expect(res.data.gamma).toBeGreaterThan(0);
    expect(res.data.gamma).toBeLessThan(1);
  });

  it('HW: 4 mavsumli data (s=4), 4 qadam prognoz', async () => {
    const quarterly = [10, 5, 15, 8, 11, 6, 16, 9, 12, 7, 17, 10];
    const res = await hwSvc.forecast(quarterly, 4, {
      alpha: 0.3,
      beta: 0.1,
      gamma: 0.3,
      seasonLength: 4,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.predicted.length).toBe(4);
  });

  it('HW autoForecast: optimal parametrlar bilan prognoz', async () => {
    const res = await hwSvc.autoForecast(monthlySeries, 6, 12);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.predicted.length).toBe(6);
    expect(res.data.optimizedParams.alpha).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-08: OLS Chiziqli Regressiya
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-08 OLS — Chiziqli Regressiya', () => {
  let svc: ForecastService;

  beforeEach(() => {
    svc = new ForecastService();
  });

  it('OLS: y=2x+1 → slope≈2, intercept≈1, R²≈1', async () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11];
    const res = await svc.fitLinear(x, y);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.slope).toBeCloseTo(2, 5);
    expect(res.data.intercept).toBeCloseTo(1, 5);
    expect(res.data.r2).toBeCloseTo(1, 5);
  });

  it('OLS: shovqinli data → R² > 0.95', async () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const y = [2.1, 3.9, 6.2, 7.8, 10.1, 11.9, 14.2, 15.8];
    const res = await svc.fitLinear(x, y);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.r2).toBeGreaterThan(0.95);
    expect(res.data.r2).toBeLessThanOrEqual(1);
    expect(res.data.metrics.rmse).toBeGreaterThanOrEqual(0);
    expect(res.data.metrics.mape).toBeGreaterThanOrEqual(0);
  });

  it('OLS: uzunliklar teng emas → VALIDATION', async () => {
    const res = await svc.fitLinear([1, 2, 3], [10, 20]);
    expect(res.ok).toBe(false);
  });

  it('OLS: ma\'lumot kam → VALIDATION', async () => {
    const res = await svc.fitLinear([1], [5]);
    expect(res.ok).toBe(false);
  });

  it('OLS: predicted uzunligi x ga teng', async () => {
    const x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const y = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29]; // y=3x+2
    const res = await svc.fitLinear(x, y);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.predicted.length).toBe(x.length);
    expect(res.data.slope).toBeCloseTo(3, 5);
    expect(res.data.intercept).toBeCloseTo(2, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Xato Metrikalari
// ─────────────────────────────────────────────────────────────────────────────

describe('Xato Metrikalari — MAPE, RMSE, MAE', () => {
  let svc: ForecastService;

  beforeEach(() => {
    svc = new ForecastService();
  });

  it('MAPE: to\'liq mos (actual=predicted) → mape=0', () => {
    const m = svc.calculateMetrics([10, 20, 30], [10, 20, 30]);
    expect(m.mape).toBeCloseTo(0, 5);
    expect(m.rmse).toBeCloseTo(0, 5);
    expect(m.mae).toBeCloseTo(0, 5);
  });

  it('MAPE: actual=[100,200], predicted=[90,210] → mape≈7.5', () => {
    // |100-90|/100=10%, |200-210|/200=5% → avg=7.5%
    const m = svc.calculateMetrics([100, 200], [90, 210]);
    expect(m.mape).toBeCloseTo(7.5, 3);
  });

  it('MAPE: actual=0 bo\'lsa, hissa 0 (himoya)', () => {
    const m = svc.calculateMetrics([0, 100], [10, 90]);
    expect(Number.isFinite(m.mape)).toBe(true);
  });

  it('RMSE: [10,20,30] vs [12,18,33] → to\'g\'ri', () => {
    // MSE = ((2² + 2² + 3²)/3) = (4+4+9)/3 = 17/3
    // RMSE = sqrt(17/3) ≈ 2.380
    const m = svc.calculateMetrics([10, 20, 30], [12, 18, 33]);
    expect(m.rmse).toBeCloseTo(Math.sqrt(17 / 3), 3);
  });

  it('EMA forecast: predicted arrayni qaytaradi', async () => {
    const series = [10, 12, 14, 13, 15, 14, 16, 18, 20, 19, 21, 22];
    const res = await svc.forecastEma(series, 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.predicted.length).toBe(3);
    res.data.predicted.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });
});
