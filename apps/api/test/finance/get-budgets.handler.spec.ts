/**
 * test/finance/get-budgets.handler.spec.ts
 *
 * Unit tests for GetBudgetsHandler. IFinanceRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetBudgetsHandler } from '../../src/modules/finance/application/queries/get-budgets.handler';
import { GetBudgetsQuery } from '../../src/modules/finance/application/queries/get-budgets.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(
  payload: ReturnType<typeof Ok<{ items: unknown[]; total: number }>> | ReturnType<typeof Err>,
): jest.Mocked<IFinanceRepo> {
  return {
    findBudgets: jest.fn().mockResolvedValue(payload),
    findBudgetById: jest.fn(),
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
    getBudgetStats: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<GetBudgetsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetBudgetsHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetBudgetsHandler);
}

describe('GetBudgetsHandler', () => {
  it('returns items and total from repository on success', async () => {
    const repo = makeRepo(Ok({ items: [{ id: 'b1' }, { id: 'b2' }], total: 2 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetsQuery(2026));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(2);
      expect(result.data.items).toHaveLength(2);
    }
  });

  it('propagates Err result when repository fails', async () => {
    const repo = makeRepo(Err(AppErr('DB_ERROR', 'down')));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetsQuery(2026));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('DB_ERROR');
  });

  it('forwards filters to repository.findBudgets', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);

    await handler.execute(new GetBudgetsQuery(2026, 'approved', 'Finance', 3, 50));

    expect(repo.findBudgets).toHaveBeenCalledWith({
      fiscalYear: 2026,
      status: 'approved',
      department: 'Finance',
      page: 3,
      limit: 50,
    });
  });

  it('defaults page and limit when not provided', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);

    await handler.execute(new GetBudgetsQuery());

    expect(repo.findBudgets).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('returns empty list when repository has no matching budgets', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetBudgetsQuery(2099));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.items).toEqual([]);
  });
});
