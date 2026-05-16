/**
 * test/finance/get-gl-entries.handler.spec.ts
 *
 * Unit tests for GetGlEntriesHandler. IFinanceRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { GetGlEntriesHandler } from '../../src/modules/finance/application/queries/get-gl-entries.handler';
import { GetGlEntriesQuery } from '../../src/modules/finance/application/queries/get-gl-entries.query';
import {
  FINANCE_REPO,
  IFinanceRepo,
} from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(
  payload: ReturnType<typeof Ok<{ items: unknown[]; total: number }>> | ReturnType<typeof Err> | Error,
): jest.Mocked<IFinanceRepo> {
  const findGlEntries =
    payload instanceof Error
      ? jest.fn().mockRejectedValue(payload)
      : jest.fn().mockResolvedValue(payload);
  return {
    findGlEntries,
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
    getArAging: jest.fn(),
    getCashFlow: jest.fn(),
    getAdvanceSummary: jest.fn(),
    updateActuals: jest.fn(),
    getBudgetStats: jest.fn(),
  } as unknown as jest.Mocked<IFinanceRepo>;
}

async function buildHandler(repo: IFinanceRepo): Promise<GetGlEntriesHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetGlEntriesHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetGlEntriesHandler);
}

describe('GetGlEntriesHandler', () => {
  it('returns paginated items with default page and limit', async () => {
    const repo = makeRepo(Ok({ items: [{ id: 'g1' }], total: 1 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetGlEntriesQuery({}));

    expect(result.items).toEqual([{ id: 'g1' }]);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
  });

  it('honours filter overrides for page and limit', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);

    const result = await handler.execute(new GetGlEntriesQuery({ page: 4, limit: 25 }));

    expect(result.page).toBe(4);
    expect(result.limit).toBe(25);
  });

  it('throws InternalServerErrorException when repository rejects', async () => {
    const repo = makeRepo(new Error('boom'));
    const handler = await buildHandler(repo);

    await expect(handler.execute(new GetGlEntriesQuery({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException when repository returns Err', async () => {
    const repo = makeRepo(Err(AppErr('DB_ERROR', 'connection lost')));
    const handler = await buildHandler(repo);

    await expect(handler.execute(new GetGlEntriesQuery({}))).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('forwards filters object to repository.findGlEntries', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await buildHandler(repo);
    const filters = { account: '1100', from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    await handler.execute(new GetGlEntriesQuery(filters));

    expect(repo.findGlEntries).toHaveBeenCalledWith(filters);
  });
});
