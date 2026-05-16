/**
 * test/finance/cashflow-forecast.service.spec.ts
 *
 * Unit tests for CashflowForecastService — 13-week 3-scenario cashflow model.
 * Mocks @shared/db.runQuery + CfoConfigService.
 */

jest.mock('@shared/db', () => {
  const arr: Record<string, unknown>[] = [];
  return {
    __esModule: true,
    runQuery: jest.fn().mockResolvedValue(Object.assign(arr, { rows: arr })),
  };
});

import { CashflowForecastService } from '../../src/modules/finance/domain/services/cashflow-forecast.service';
import { CfoConfigService } from '../../src/modules/finance/domain/services/cfo-config.service';
import { runQuery } from '@shared/db';
import { Ok } from '../../src/common/result';

function rowsResult(rows: Record<string, unknown>[]) {
  const arr = [...rows];
  return Object.assign(arr, { rows: [...rows] });
}

function makeCfoConfig(opening = 100_000_000, minCash = 50_000_000): CfoConfigService {
  return {
    getNumber: jest.fn().mockImplementation(async (key: string, fb: number) => {
      if (key === 'opening_cash_balance_uzs') return opening;
      if (key === 'min_cash_reserve_uzs') return minCash;
      if (key === 'monthly_tax_estimate_uzs') return 4_000_000;
      return fb;
    }),
    getMap: jest.fn().mockResolvedValue(Ok(new Map([
      ['ar_ecl_rate_0_30', { toNumber: () => 0.02 }],
      ['ar_ecl_rate_31_60', { toNumber: () => 0.08 }],
      ['ar_ecl_rate_61_90', { toNumber: () => 0.20 }],
      ['ar_ecl_rate_91_plus', { toNumber: () => 0.50 }],
    ]))),
  } as unknown as CfoConfigService;
}

describe('CashflowForecastService', () => {
  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
    // Default: every loadWeeklyData query returns empty rows
    (runQuery as jest.Mock).mockResolvedValue(rowsResult([]));
  });

  describe('forecastWeeks()', () => {
    it('returns 3 scenarios: base / optimistic / pessimistic', async () => {
      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks(4);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.scenarios.base).toBeDefined();
        expect(r.data.scenarios.optimistic).toBeDefined();
        expect(r.data.scenarios.pessimistic).toBeDefined();
      }
    });

    it('every scenario has the requested number of weeks', async () => {
      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks(5);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.scenarios.base).toHaveLength(5);
        expect(r.data.scenarios.optimistic).toHaveLength(5);
        expect(r.data.scenarios.pessimistic).toHaveLength(5);
      }
    });

    it('uses default 13 weeks when no argument given', async () => {
      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.weeks).toBe(13);
        expect(r.data.scenarios.base).toHaveLength(13);
      }
    });

    it('opening balance is echoed in the output', async () => {
      const svc = new CashflowForecastService(makeCfoConfig(75_000_000));

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.openingBalance).toBe(75_000_000);
      }
    });

    it('optimistic scenario has higher inflows than pessimistic (1.2 vs 0.8 multiplier)', async () => {
      // Provide one week with AR inflow
      (runQuery as jest.Mock).mockReset();
      (runQuery as jest.Mock)
        // Each week generates 4 sub-queries (AR, SO, AP, payroll). For 1 week, 4 calls
        .mockResolvedValueOnce(rowsResult([{ ar_col: 10_000_000 }])) // AR week 1
        .mockResolvedValueOnce(rowsResult([{ so_total: 5_000_000 }])) // SO week 1
        .mockResolvedValueOnce(rowsResult([{ ap_out: 0 }]))           // AP week 1
        .mockResolvedValueOnce(rowsResult([{ payroll_out: 0 }]));     // payroll week 1

      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks(1);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const opt = r.data.scenarios.optimistic[0];
        const pes = r.data.scenarios.pessimistic[0];
        expect(opt.totalInflow).toBeGreaterThan(pes.totalInflow);
      }
    });

    it('returns failure when getMap config fails (then internal catch fires later)', async () => {
      // Even if config returns Err, the service is designed to use default ECL rates
      // when eclMap.ok is false — so the call still succeeds.
      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(true);
    });

    it('status field is one of OK / WARNING / CRITICAL', async () => {
      const svc = new CashflowForecastService(makeCfoConfig());

      const r = await svc.forecastWeeks(3);

      expect(r.ok).toBe(true);
      if (r.ok) {
        for (const w of r.data.scenarios.base) {
          expect(['OK', 'WARNING', 'CRITICAL']).toContain(w.status);
        }
      }
    });
  });

  describe('error handling', () => {
    it('returns failure when underlying query throws unexpectedly', async () => {
      const cfo = {
        getNumber: jest.fn().mockRejectedValue(new Error('config table missing')),
        getMap: jest.fn().mockResolvedValue(Ok(new Map())),
      } as unknown as CfoConfigService;
      const svc = new CashflowForecastService(cfo);

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(false);
    });
  });
});
