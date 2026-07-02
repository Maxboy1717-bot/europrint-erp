/**
 * sales.service.spec.ts
 *
 * Unit tests for SalesService (src/modules/sd/sales/sales.service.ts). The repository is
 * mocked; the service's own real logic — forecast revenue projection (pipeline_value *
 * FORECAST.pipeline_conversion), forecast-accuracy shaping, and the various
 * default-fallback / error-propagation branches — runs unmocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from '../../src/modules/sd/sales/sales.service';
import { SalesRepository } from '../../src/modules/sd/sales/sales.repository';
import { Ok, Err, AppErr } from '../../src/common/result';
import { FORECAST, FORECAST_CONFIDENCE_DEFAULT } from '../../src/common/constants/business.constants';

type RepoMock = {
  listInvoices: jest.Mock;
  getMonthlyTrend: jest.Mock;
  getVelocity: jest.Mock;
  getCommissionCalculations: jest.Mock;
  getForecastAccuracyData: jest.Mock;
  getPipelineForecast: jest.Mock;
  getForecastHistory: jest.Mock;
  getLeaderboard: jest.Mock;
  listSalesOrders: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    listInvoices: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getVelocity: jest.fn(),
    getCommissionCalculations: jest.fn(),
    getForecastAccuracyData: jest.fn(),
    getPipelineForecast: jest.fn(),
    getForecastHistory: jest.fn(),
    getLeaderboard: jest.fn(),
    listSalesOrders: jest.fn(),
  };
}

describe('SalesService', () => {
  let svc: SalesService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesService, { provide: SalesRepository, useValue: repo }],
    }).compile();
    svc = module.get(SalesService);
  });

  // ── generateForecast: real revenue projection, not a stub ──────────────────
  it('generateForecast multiplies pipeline_value by FORECAST.pipeline_conversion', async () => {
    repo.getPipelineForecast.mockResolvedValue(Ok({ pipeline_value: 1_000_000, deal_count: 12 }));
    const r = await svc.generateForecast(7, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.manager_id).toBe(7);
      expect(data.period).toBe('monthly'); // default fallback
      expect(data.pipeline_value).toBe(1_000_000);
      expect(data.deal_count).toBe(12);
      expect(data.forecast_revenue).toBeCloseTo(1_000_000 * FORECAST.pipeline_conversion, 5);
      expect(data.confidence).toBe(FORECAST_CONFIDENCE_DEFAULT);
    }
  });

  it('generateForecast scales forecast_revenue linearly with pipeline_value', async () => {
    repo.getPipelineForecast.mockResolvedValue(Ok({ pipeline_value: 500_000, deal_count: 3 }));
    const a = await svc.generateForecast(null, 'quarterly');
    repo.getPipelineForecast.mockResolvedValue(Ok({ pipeline_value: 1_000_000, deal_count: 3 }));
    const b = await svc.generateForecast(null, 'quarterly');
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      const ad = a.data as Record<string, unknown>;
      const bd = b.data as Record<string, unknown>;
      expect(bd.forecast_revenue).toBeCloseTo((ad.forecast_revenue as number) * 2, 5);
      expect(ad.period).toBe('quarterly');
    }
  });

  it('generateForecast defaults pipeline_value/deal_count to 0 when repo omits them', async () => {
    repo.getPipelineForecast.mockResolvedValue(Ok({}));
    const r = await svc.generateForecast(1, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.forecast_revenue).toBe(0);
      expect(data.pipeline_value).toBe(0);
      expect(data.deal_count).toBe(0);
    }
  });

  it('generateForecast propagates the repository error without computing a forecast', async () => {
    repo.getPipelineForecast.mockResolvedValue(Err(AppErr('DB_ERROR', 'pipeline query failed')));
    const r = await svc.generateForecast(1, 'monthly');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  // ── getForecastAccuracy: maps repo shape into the API response shape ───────
  it('getForecastAccuracy maps repository accuracy data into the response envelope', async () => {
    repo.getForecastAccuracyData.mockResolvedValue(
      Ok({ avg_accuracy: 87.5, periods: [{ month: '2026-05', accuracy_percent: 90 }] }),
    );
    const r = await svc.getForecastAccuracy(3, 6);
    expect(repo.getForecastAccuracyData).toHaveBeenCalledWith(3, 6);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.manager_id).toBe(3);
      expect(data.accuracy_percent).toBe(87.5);
      expect(data.periods).toEqual([{ month: '2026-05', accuracy_percent: 90 }]);
      expect(data.calculated_at).toBeDefined();
    }
  });

  it('getForecastAccuracy defaults months to 6 when omitted', async () => {
    repo.getForecastAccuracyData.mockResolvedValue(Ok({ avg_accuracy: null, periods: [] }));
    await svc.getForecastAccuracy(null);
    expect(repo.getForecastAccuracyData).toHaveBeenCalledWith(null, 6);
  });

  it('getForecastAccuracy returns Err when the repository fails (thrown error caught by safeCall)', async () => {
    repo.getForecastAccuracyData.mockResolvedValue(Err(AppErr('DB_ERROR', 'accuracy query failed')));
    const r = await svc.getForecastAccuracy(9, 3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('accuracy query failed');
  });

  // ── default-fallback branches on period/status query params ────────────────
  it('getVelocity defaults period to "quarterly" when none is supplied', async () => {
    repo.getVelocity.mockResolvedValue(Ok({ avg_cycle_days: 5, total_deals: 20, won_deals: 8 }));
    const r = await svc.getVelocity(null);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as Record<string, unknown>).period).toBe('quarterly');
  });

  it('getVelocity preserves an explicit period', async () => {
    repo.getVelocity.mockResolvedValue(Ok({ avg_cycle_days: 5, total_deals: 20, won_deals: 8 }));
    const r = await svc.getVelocity('weekly');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as Record<string, unknown>).period).toBe('weekly');
  });

  it('getCommissionCalculations defaults period to "monthly" and forwards managerId', async () => {
    repo.getCommissionCalculations.mockResolvedValue(Ok([{ id: 1, commission_5pct: 500 }]));
    const r = await svc.getCommissionCalculations(4, null);
    expect(repo.getCommissionCalculations).toHaveBeenCalledWith(4);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.period).toBe('monthly');
      // NOTE: the service stores the raw repository Result (not the unwrapped `.data`)
      // under `commissions` — documented here as the service's real current behaviour.
      expect(data.commissions).toEqual(Ok([{ id: 1, commission_5pct: 500 }]));
    }
  });

  it('getForecastHistory falls back to an empty array when the repository errors', async () => {
    repo.getForecastHistory.mockResolvedValue(Err(AppErr('DB_ERROR', 'history failed')));
    const r = await svc.getForecastHistory(2, 10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.history).toEqual([]);
      expect(data.manager_id).toBe(2);
      expect(data.limit).toBe(10);
    }
  });

  it('getForecastHistory passes through repository data on success', async () => {
    repo.getForecastHistory.mockResolvedValue(Ok([{ id: 1, period: '2026-05' }]));
    const r = await svc.getForecastHistory(null, 5);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as Record<string, unknown>).history).toEqual([{ id: 1, period: '2026-05' }]);
  });

  it('getLeaderboard defaults period to "monthly" and forwards the limit', async () => {
    repo.getLeaderboard.mockResolvedValue(Ok([{ id: 1, rank: 1 }]));
    const r = await svc.getLeaderboard(null, 25);
    expect(repo.getLeaderboard).toHaveBeenCalledWith(25);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as Record<string, unknown>;
      expect(data.period).toBe('monthly');
      // NOTE: same as getCommissionCalculations — the raw repository Result is
      // stored under `leaderboard`, not the unwrapped array.
      expect(data.leaderboard).toEqual(Ok([{ id: 1, rank: 1 }]));
    }
  });

  // ── pure passthrough methods ────────────────────────────────────────────────
  it('listInvoices forwards all arguments to the repository unmodified', async () => {
    repo.listInvoices.mockResolvedValue(Ok([{ id: 1 }]));
    const r = await svc.listInvoices(11, 'draft', 20, 40);
    expect(repo.listInvoices).toHaveBeenCalledWith(11, 'draft', 20, 40);
    expect(r.ok).toBe(true);
  });

  it('getMonthlyTrend forwards the months argument to the repository', async () => {
    repo.getMonthlyTrend.mockResolvedValue(Ok([{ month: '2026-06', revenue: 100 }]));
    await svc.getMonthlyTrend(12);
    expect(repo.getMonthlyTrend).toHaveBeenCalledWith(12);
  });

  it('listSalesOrders forwards limit/offset to the repository', async () => {
    repo.listSalesOrders.mockResolvedValue(Ok([{ id: 1 }]));
    await svc.listSalesOrders(50, 100);
    expect(repo.listSalesOrders).toHaveBeenCalledWith(50, 100);
  });
});
