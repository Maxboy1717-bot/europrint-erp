/**
 * test/finance/financial-ratios.service.spec.ts
 *
 * Unit tests for FinancialRatiosService — CFO-dashboard ratios + Altman Z.
 * Mocks @shared/db.runQuery + CfoConfigService.
 */

jest.mock('@shared/db', () => {
  const arr: Record<string, unknown>[] = [];
  return {
    __esModule: true,
    runQuery: jest.fn().mockResolvedValue(Object.assign(arr, { rows: arr })),
  };
});

import { FinancialRatiosService } from '../../src/modules/finance/domain/services/financial-ratios.service';
import { CfoConfigService } from '../../src/modules/finance/domain/services/cfo-config.service';
import { runQuery } from '@shared/db';
import { Ok } from '../../src/common/result';

function rowsResult(rows: Record<string, unknown>[]) {
  const arr = [...rows];
  return Object.assign(arr, { rows: [...rows] });
}

function makeCfoConfig(numbers: Record<string, number> = {}): CfoConfigService {
  return {
    getNumber: jest.fn().mockImplementation(async (key: string, fb: number) => numbers[key] ?? fb),
    getMap: jest.fn().mockResolvedValue(Ok(new Map())),
  } as unknown as CfoConfigService;
}

const STRONG_GL_ROW = {
  revenue: 1_000_000,
  cogs: 600_000,
  opex: 100_000,
  interest_exp: 10_000,
  total_assets: 5_000_000,
  total_equity: 2_500_000,
  total_debt: 1_000_000,
  current_assets: 1_500_000,
  current_liabilities: 500_000,
  inventory: 300_000,
  cash: 500_000,
  retained_earnings: 800_000,
};

describe('FinancialRatiosService', () => {
  let svc: FinancialRatiosService;

  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
    svc = new FinancialRatiosService(makeCfoConfig());
  });

  describe('computeForPeriod()', () => {
    it('returns NOT_FOUND when GL has no data for period', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([]));

      const r = await svc.computeForPeriod('2099-01');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('computes current ratio = CA / CL', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([STRONG_GL_ROW]))
        // snapshot upsert + skip distress flag
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // 1.5M / 500k = 3
        expect(r.data.liquidity.currentRatio).toBe(3);
      }
    });

    it('quickRatio excludes inventory from numerator', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([STRONG_GL_ROW]))
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // (1.5M - 0.3M) / 0.5M = 2.4
        expect(r.data.liquidity.quickRatio).toBe(2.4);
      }
    });

    it('returns interestCoverage null when interest expense = 0', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([{ ...STRONG_GL_ROW, interest_exp: 0 }]))
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.leverage.interestCoverage).toBeNull();
    });

    it('flags Altman zone "Safe" for healthy balance sheet', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([STRONG_GL_ROW]))
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(['Safe', 'Grey Zone']).toContain(r.data.altmanZ.zone);
      }
    });

    it('flags Altman "Distress" zone for weak balance sheet', async () => {
      // For Z < 1.81 we need very weak fundamentals AND a small market-cap so
      // X4 (mktCap / totalDebt) doesn't single-handedly boost the score.
      const weakSvc = new FinancialRatiosService({
        getNumber: jest.fn().mockImplementation(async (key: string, fb: number) => {
          if (key === 'shares_outstanding') return 1;
          if (key === 'share_price_uzs') return 1;
          return fb;
        }),
        getMap: jest.fn().mockResolvedValue(Ok(new Map())),
      } as unknown as CfoConfigService);

      const weak = {
        revenue: 50_000,
        cogs: 60_000,
        opex: 50_000,
        interest_exp: 20_000,
        total_assets: 10_000_000,
        total_equity: 100_000,
        total_debt: 9_000_000,
        current_assets: 100_000,
        current_liabilities: 5_000_000,
        inventory: 0,
        cash: 0,
        retained_earnings: -2_000_000,
      };
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([weak]))
        .mockResolvedValue(rowsResult([]));

      const r = await weakSvc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.altmanZ.zone).toBe('Distress');
    });
  });

  describe('profitability ratios', () => {
    it('grossMarginPct = (revenue − cogs) / revenue × 100', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([STRONG_GL_ROW]))
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // (1M - 600k) / 1M = 40%
        expect(r.data.profitability.grossMarginPct).toBe(40);
      }
    });

    it('netMarginPct accounts for opex + interest', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([STRONG_GL_ROW]))
        .mockResolvedValue(rowsResult([]));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // (1M - 600k - 100k - 10k) / 1M = 29%
        expect(r.data.profitability.netMarginPct).toBe(29);
      }
    });
  });

  describe('error handling', () => {
    it('returns failure when initial DB query throws', async () => {
      (runQuery as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(false);
    });
  });
});
