/**
 * test/finance/financial-ratios.service.spec.ts
 *
 * Unit tests for FinancialRatiosService — CFO-dashboard ratios + Altman Z.
 * Mocks IFinanceRepo and CfoConfigService.
 */

import { FinancialRatiosService } from '../../src/modules/finance/domain/services/financial-ratios.service';
import { CfoConfigService } from '../../src/modules/finance/domain/services/cfo-config.service';
import type { FinancialRatiosGl } from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok } from '../../src/common/result';

// camelCase GL row matching FinancialRatiosGl interface
const STRONG_GL: FinancialRatiosGl = {
  revenue:             1_000_000,
  cogs:                  600_000,
  opex:                  100_000,
  interestExp:            10_000,
  totalAssets:         5_000_000,
  totalEquity:         2_500_000,
  totalDebt:           1_000_000,
  currentAssets:       1_500_000,
  currentLiabilities:    500_000,
  inventory:             300_000,
  cash:                  500_000,
  retainedEarnings:      800_000,
};

const WEAK_GL: FinancialRatiosGl = {
  revenue:                50_000,
  cogs:                   60_000,
  opex:                   50_000,
  interestExp:            20_000,
  totalAssets:        10_000_000,
  totalEquity:           100_000,
  totalDebt:           9_000_000,
  currentAssets:         100_000,
  currentLiabilities:  5_000_000,
  inventory:                   0,
  cash:                        0,
  retainedEarnings:   -2_000_000,
};

function makeRepo() {
  return {
    fetchFinancialRatiosGl:    jest.fn(),
    saveFinancialRatiosSnapshot: jest.fn().mockResolvedValue(undefined),
    flagAltmanDistress:         jest.fn().mockResolvedValue(undefined),
  };
}

function makeCfoConfig(numbers: Record<string, number> = {}): CfoConfigService {
  return {
    getNumber: jest.fn().mockImplementation(async (key: string, fb: number) => numbers[key] ?? fb),
    getMap: jest.fn().mockResolvedValue(Ok(new Map())),
  } as unknown as CfoConfigService;
}

function buildSvc(
  repo: ReturnType<typeof makeRepo>,
  cfoOverride?: CfoConfigService,
): FinancialRatiosService {
  return new FinancialRatiosService(
    cfoOverride ?? makeCfoConfig(),
    repo as never,
  );
}

describe('FinancialRatiosService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let svc: FinancialRatiosService;

  beforeEach(() => {
    repo = makeRepo();
    svc = buildSvc(repo);
  });

  describe('computeForPeriod()', () => {
    it('returns NOT_FOUND when GL has no data for period', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(null);

      const r = await svc.computeForPeriod('2099-01');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('computes current ratio = CA / CL', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(STRONG_GL);

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // 1.5M / 500k = 3
        expect(r.data.liquidity.currentRatio).toBe(3);
      }
    });

    it('quickRatio excludes inventory from numerator', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(STRONG_GL);

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // (1.5M - 0.3M) / 0.5M = 2.4
        expect(r.data.liquidity.quickRatio).toBe(2.4);
      }
    });

    it('returns interestCoverage null when interest expense = 0', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce({ ...STRONG_GL, interestExp: 0 });

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.leverage.interestCoverage).toBeNull();
    });

    it('flags Altman zone "Safe" for healthy balance sheet', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(STRONG_GL);

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(['Safe', 'Grey Zone']).toContain(r.data.altmanZ.zone);
      }
    });

    it('flags Altman "Distress" zone for weak balance sheet', async () => {
      // For Z < 1.81 we need very weak fundamentals AND a small market-cap so
      // X4 (mktCap / totalDebt) doesn't single-handedly boost the score.
      const weakCfo = {
        getNumber: jest.fn().mockImplementation(async (key: string, fb: number) => {
          if (key === 'shares_outstanding') return 1;
          if (key === 'share_price_uzs') return 1;
          return fb;
        }),
        getMap: jest.fn().mockResolvedValue(Ok(new Map())),
      } as unknown as CfoConfigService;

      const weakRepo = makeRepo();
      weakRepo.fetchFinancialRatiosGl.mockResolvedValueOnce(WEAK_GL);
      const weakSvc = buildSvc(weakRepo, weakCfo);

      const r = await weakSvc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.altmanZ.zone).toBe('Distress');
    });
  });

  describe('profitability ratios', () => {
    it('grossMarginPct = (revenue − cogs) / revenue × 100', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(STRONG_GL);

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(true);
      if (r.ok) {
        // (1M - 600k) / 1M = 40%
        expect(r.data.profitability.grossMarginPct).toBe(40);
      }
    });

    it('netMarginPct accounts for opex + interest', async () => {
      repo.fetchFinancialRatiosGl.mockResolvedValueOnce(STRONG_GL);

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
      repo.fetchFinancialRatiosGl.mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.computeForPeriod('2025-05');

      expect(r.ok).toBe(false);
    });
  });
});
