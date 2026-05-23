/**
 * test/finance/get-payments.handler.spec.ts
 *
 * Unit tests for GetPaymentsHandler. IFinanceRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';

import { GetPaymentsHandler } from '../../src/modules/finance/application/queries/get-payments.handler';
import { GetPaymentsQuery } from '../../src/modules/finance/application/queries/get-payments.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(
  payload: ReturnType<typeof Ok<{ items: unknown[]; total: number }>> | ReturnType<typeof Err> | Error,
): jest.Mocked<IFinanceRepo> {
  const findPayments =
    payload instanceof Error
      ? jest.fn().mockRejectedValue(payload)
      : jest.fn().mockResolvedValue(payload);
  return {
    findPayments,
    findBudgetById: jest.fn(),
    findBudgets: jest.fn(),
    saveBudget: jest.fn(),
    updateBudgetStatus: jest.fn(),
    findInvoiceById: jest.fn(),
    findInvoices: jest.fn(),
    findInvoiceBySalesOrderId: jest.fn(),
    saveInvoice: jest.fn(),
    updateInvoice: jest.fn(),
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

async function buildHandler(repo: IFinanceRepo): Promise<GetPaymentsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetPaymentsHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetPaymentsHandler);
}

describe('GetPaymentsHandler', () => {
  it('returns paginated payload with defaults when no filters supplied', async () => {
    const repo = makeRepo(Ok({ items: [{ id: 'p1' }, { id: 'p2' }], total: 2 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetPaymentsQuery({}));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('returns Err when repository rejects', async () => {
    const repo = makeRepo(new Error('explode'));
    const handler = await buildHandler(repo);

    const r = await handler.execute(new GetPaymentsQuery({}));
    expect(r.ok).toBe(false);
  });

  it('returns Err when repository returns Err', async () => {
    const repo = makeRepo(Err(AppErr('DB_ERROR', 'down')));
    const handler = await buildHandler(repo);

    const r = await handler.execute(new GetPaymentsQuery({}));
    expect(r.ok).toBe(false);
  });

  it('honours pagination overrides from query filters', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new GetPaymentsQuery({ invoiceId: '501', page: 5, limit: 100 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(100);
    }
  });

  it('forwards filters object to repository.findPayments', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);
    const filters = { invoiceId: '501', from: new Date('2026-01-01') };

    await handler.execute(new GetPaymentsQuery(filters));

    expect(repo.findPayments).toHaveBeenCalledWith(filters);
  });
});
