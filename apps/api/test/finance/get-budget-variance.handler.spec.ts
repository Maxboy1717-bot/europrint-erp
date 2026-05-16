/**
 * test/finance/get-budget-variance.handler.spec.ts
 *
 * Unit tests for GetBudgetVarianceHandler. IFinanceRepo is mocked; the
 * variance/topOverspent aggregation logic is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetBudgetVarianceHandler } from '../../src/modules/finance/application/queries/get-budget-variance.handler';
import { GetBudgetVarianceQuery } from '../../src/modules/finance/application/queries/get-budget-variance.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

interface VarianceLine {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
}

function makeBudgetRow(overrides: Partial<{
  id: string;
  name: string;
  totalPlanned: string;
  totalActual: string;
  lines: VarianceLine[];
}> = {}) {
  return {
    id: overrides.id ?? 'bud-9',
    name: overrides.name ?? 'FY2026',
    totalPlanned: overrides.totalPlanned ?? '1000000',
    totalActual: overrides.totalActual ?? '600000',
    lines: overrides.lines ?? [],
  };
}

function makeRepo(row: ReturnType<typeof makeBudgetRow> | null): jest.Mocked<IFinanceRepo> {
  return {
    findBudgetById: jest.fn().mockResolvedValue(
      row ? Ok(row as unknown as Record<string, unknown>) : Err(AppErr('NOT_FOUND', 'not found')),
    ),
    updateBudgetStatus: jest.fn(),
    findBudgets: jest.fn(),
    saveBudget: jest.fn(),
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
    getBudgetStats: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<GetBudgetVarianceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetBudgetVarianceHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetBudgetVarianceHandler);
}

describe('GetBudgetVarianceHandler', () => {
  it('returns Err when budget is missing', async () => {
    const repo = makeRepo(null);
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetVarianceQuery('missing'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('Budget not found');
  });

  it('computes total variance and percent when budget is on track', async () => {
    const repo = makeRepo(makeBudgetRow({ totalPlanned: '1000000', totalActual: '600000' }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetVarianceQuery('bud-9'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.variance).toBe(400_000);
      expect(result.data.variancePercent).toBe(40);
      expect(result.data.isOverBudget).toBe(false);
    }
  });

  it('flags isOverBudget when actuals exceed plan', async () => {
    const repo = makeRepo(makeBudgetRow({ totalPlanned: '500000', totalActual: '700000' }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetVarianceQuery('bud-9'));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.isOverBudget).toBe(true);
  });

  it('returns top overspent categories sorted by overspend', async () => {
    const lines: VarianceLine[] = [
      { id: 'l1', category: 'rent',   description: 'r', plannedAmount: 100, actualAmount: 300 }, // +200
      { id: 'l2', category: 'salary', description: 's', plannedAmount: 200, actualAmount: 250 }, // +50
      { id: 'l3', category: 'office', description: 'o', plannedAmount: 100, actualAmount: 90  }, // under
    ];
    const repo = makeRepo(makeBudgetRow({ lines }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetVarianceQuery('bud-9'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.topOverspentCategories).toHaveLength(2);
      expect(result.data.topOverspentCategories[0].category).toBe('rent');
    }
  });

  it('handles zero plan without dividing by zero', async () => {
    const repo = makeRepo(makeBudgetRow({ totalPlanned: '0', totalActual: '0' }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetVarianceQuery('bud-9'));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.variancePercent).toBe(0);
  });
});
