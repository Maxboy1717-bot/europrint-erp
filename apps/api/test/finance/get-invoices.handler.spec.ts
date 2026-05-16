/**
 * test/finance/get-invoices.handler.spec.ts
 *
 * Unit tests for finance GetInvoicesHandler. IFinanceRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { GetInvoicesHandler } from '../../src/modules/finance/application/queries/get-invoices.handler';
import { GetInvoicesQuery } from '../../src/modules/finance/application/queries/get-invoices.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(
  payload: ReturnType<typeof Ok<{ items: unknown[]; total: number }>> | ReturnType<typeof Err> | Error,
): jest.Mocked<IFinanceRepo> {
  const findInvoices =
    payload instanceof Error
      ? jest.fn().mockRejectedValue(payload)
      : jest.fn().mockResolvedValue(payload);
  return {
    findInvoices,
    findBudgetById: jest.fn(),
    findBudgets: jest.fn(),
    saveBudget: jest.fn(),
    updateBudgetStatus: jest.fn(),
    findInvoiceById: jest.fn(),
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

async function buildHandler(repo: IFinanceRepo): Promise<GetInvoicesHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetInvoicesHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetInvoicesHandler);
}

describe('GetInvoicesHandler (finance)', () => {
  it('returns paginated payload with defaults when no filters supplied', async () => {
    const repo = makeRepo(Ok({ items: [{ id: 'inv-1' }], total: 1 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetInvoicesQuery({}));

    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('throws InternalServerErrorException when repository rejects', async () => {
    const repo = makeRepo(new Error('boom'));
    const handler = await buildHandler(repo);

    await expect(handler.execute(new GetInvoicesQuery({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException when repository returns Err', async () => {
    const repo = makeRepo(Err(AppErr('DB_ERROR', 'down')));
    const handler = await buildHandler(repo);

    await expect(handler.execute(new GetInvoicesQuery({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('passes filter object to repository.findInvoices', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);
    const filters = { status: 'posted', customerId: '7', page: 2, limit: 50 };

    await handler.execute(new GetInvoicesQuery(filters));

    expect(repo.findInvoices).toHaveBeenCalledWith(filters);
  });

  it('preserves total count from repository response', async () => {
    const repo = makeRepo(Ok({ items: [], total: 42 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetInvoicesQuery({ page: 1, limit: 10 }));

    expect(result.total).toBe(42);
  });
});
