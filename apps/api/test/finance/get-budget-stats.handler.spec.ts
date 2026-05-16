/**
 * test/finance/get-budget-stats.handler.spec.ts
 *
 * Unit tests for GetBudgetStatsHandler. IFinanceRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetBudgetStatsHandler } from '../../src/modules/finance/application/queries/get-budget-stats.handler';
import { GetBudgetStatsQuery } from '../../src/modules/finance/application/queries/get-budget-stats.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type StatsOk = ReturnType<typeof Ok<{
  totalBudgets: number;
  approved: number;
  draft: number;
  totalPlanned: number;
  totalActual: number;
  overallVariancePercent: number;
}>>;

function makeRepo(stats: StatsOk | ReturnType<typeof Err>): jest.Mocked<IFinanceRepo> {
  return {
    getBudgetStats: jest.fn().mockResolvedValue(stats),
    findBudgetById: jest.fn(),
    findBudgets: jest.fn(),
    saveBudget: jest.fn(),
    updateBudgetStatus: jest.fn(),
    findInvoiceById: jest.fn(),
    findInvoices: jest.fn(),
    findInvoiceBySalesOrderId: jest.fn(),
    saveInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    findPayments: jest.fn(),
    savePayment: jest.fn(),
    saveGlEntry: jest.fn(),
    findGlEntries: jest.fn(),
    getArAging: jest.fn(),
    getCashFlow: jest.fn(),
    getAdvanceSummary: jest.fn(),
    updateActuals: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<GetBudgetStatsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetBudgetStatsHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetBudgetStatsHandler);
}

describe('GetBudgetStatsHandler', () => {
  it('returns repository stats verbatim when query succeeds', async () => {
    const stats = {
      totalBudgets: 10, approved: 6, draft: 4,
      totalPlanned: 500_000_000, totalActual: 320_000_000,
      overallVariancePercent: 36,
    };
    const repo = makeRepo(Ok(stats));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetStatsQuery(2026));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(stats);
  });

  it('propagates Err result when repository fails', async () => {
    const repo = makeRepo(Err(AppErr('DB_ERROR', 'connection lost')));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetStatsQuery(2026));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('DB_ERROR');
  });

  it('forwards fiscalYear from query to repository', async () => {
    const repo = makeRepo(Ok({
      totalBudgets: 0, approved: 0, draft: 0,
      totalPlanned: 0, totalActual: 0, overallVariancePercent: 0,
    }));
    const handler = await buildHandler(repo);

    await handler.execute(new GetBudgetStatsQuery(2027));

    expect(repo.getBudgetStats).toHaveBeenCalledWith(2027);
  });

  it('handles zero budgets without throwing', async () => {
    const empty = {
      totalBudgets: 0, approved: 0, draft: 0,
      totalPlanned: 0, totalActual: 0, overallVariancePercent: 0,
    };
    const repo = makeRepo(Ok(empty));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetStatsQuery(2026));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.totalBudgets).toBe(0);
  });
});
