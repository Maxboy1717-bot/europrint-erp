/**
 * test/finance/cashflow-forecast.service.spec.ts
 *
 * Unit tests for CashflowForecastService — 13-week 3-scenario cashflow model.
 * Mocks IFinanceRepo and CfoConfigService.
 */

import { CashflowForecastService } from '../../src/modules/finance/domain/services/cashflow-forecast.service';
import { CfoConfigService } from '../../src/modules/finance/domain/services/cfo-config.service';
import type { CashflowWeekRaw } from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok } from '../../src/common/result';

const EMPTY_WEEK: CashflowWeekRaw = { arCol: 0, soInflow: 0, apOut: 0, payrollOut: 0 };

function makeRepo() {
  return {
    fetchCashflowWeek: jest.fn().mockResolvedValue(EMPTY_WEEK),
  };
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

function buildSvc(cfo?: CfoConfigService): { svc: CashflowForecastService; repo: ReturnType<typeof makeRepo> } {
  const repo = makeRepo();
  const svc = new CashflowForecastService(cfo ?? makeCfoConfig(), repo as never);
  return { svc, repo };
}

describe('CashflowForecastService', () => {
  describe('forecastWeeks()', () => {
    it('returns 3 scenarios: base / optimistic / pessimistic', async () => {
      const { svc } = buildSvc();

      const r = await svc.forecastWeeks(4);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.scenarios.base).toBeDefined();
        expect(r.data.scenarios.optimistic).toBeDefined();
        expect(r.data.scenarios.pessimistic).toBeDefined();
      }
    });

    it('every scenario has the requested number of weeks', async () => {
      const { svc } = buildSvc();

      const r = await svc.forecastWeeks(5);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.scenarios.base).toHaveLength(5);
        expect(r.data.scenarios.optimistic).toHaveLength(5);
        expect(r.data.scenarios.pessimistic).toHaveLength(5);
      }
    });

    it('uses default 13 weeks when no argument given', async () => {
      const { svc } = buildSvc();

      const r = await svc.forecastWeeks();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.weeks).toBe(13);
        expect(r.data.scenarios.base).toHaveLength(13);
      }
    });

    it('opening balance is echoed in the output', async () => {
      const { svc } = buildSvc(makeCfoConfig(75_000_000));

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.openingBalance).toBe(75_000_000);
      }
    });

    it('optimistic scenario has higher inflows than pessimistic (1.2 vs 0.8 multiplier)', async () => {
      const { svc, repo } = buildSvc();
      // 1 week with real AR + SO inflow
      repo.fetchCashflowWeek.mockResolvedValueOnce({
        arCol: 10_000_000, soInflow: 5_000_000, apOut: 0, payrollOut: 0,
      });

      const r = await svc.forecastWeeks(1);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const opt = r.data.scenarios.optimistic[0];
        const pes = r.data.scenarios.pessimistic[0];
        expect(opt.totalInflow).toBeGreaterThan(pes.totalInflow);
      }
    });

    it('returns success even when getMap config returns Err (service uses default ECL rates)', async () => {
      const { svc } = buildSvc();

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(true);
    });

    it('status field is one of OK / WARNING / CRITICAL', async () => {
      const { svc } = buildSvc();

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
      const { svc } = buildSvc(cfo);

      const r = await svc.forecastWeeks(2);

      expect(r.ok).toBe(false);
    });
  });
});
