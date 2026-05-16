/**
 * test/sd/list-orders.handler.spec.ts
 *
 * Unit tests for ListOrdersHandler. ISalesOrderRepository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ListOrdersHandler,
  ListOrdersQuery,
} from '../../src/modules/sd/application/queries/list-orders.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(orders: SalesOrder[] | null, total = 0): jest.Mocked<ISalesOrderRepository> {
  const okResult = orders ? Ok(orders) : Err(AppErr('DB_ERROR', 'fail'));
  return {
    findByStatus:    jest.fn().mockResolvedValue(okResult),
    findByCompanyId: jest.fn().mockResolvedValue(okResult),
    findAll:         jest.fn().mockResolvedValue(okResult),
    count:           jest.fn().mockResolvedValue(Ok(total)),
    findById: jest.fn(),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

async function buildHandler(repo: ISalesOrderRepository): Promise<ListOrdersHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ListOrdersHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(ListOrdersHandler);
}

describe('ListOrdersHandler', () => {
  it('lists all orders when neither status nor companyId is supplied', async () => {
    const orders = [buildSalesOrder({ id: 1 }), buildSalesOrder({ id: 2 })];
    const repo = makeRepo(orders, 2);
    const handler = await buildHandler(repo);

    const result = await handler.execute(new ListOrdersQuery());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.data).toHaveLength(2);
    expect(repo.findAll).toHaveBeenCalled();
  });

  it('filters by status when status is provided', async () => {
    const repo = makeRepo([], 0);
    const handler = await buildHandler(repo);

    await handler.execute(new ListOrdersQuery(undefined, 'approved', 10, 0));

    expect(repo.findByStatus).toHaveBeenCalledWith('approved', 10, 0);
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('filters by companyId when only companyId is provided', async () => {
    const repo = makeRepo([], 0);
    const handler = await buildHandler(repo);

    await handler.execute(new ListOrdersQuery(7, undefined, 10, 0));

    expect(repo.findByCompanyId).toHaveBeenCalledWith(7, 10, 0);
  });

  it('returns INTERNAL when repository query fails', async () => {
    const repo = makeRepo(null);
    const handler = await buildHandler(repo);

    const result = await handler.execute(new ListOrdersQuery());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });

  it('returns pagination envelope with total count from repository', async () => {
    const orders = [buildSalesOrder()];
    const repo = makeRepo(orders, 99);
    const handler = await buildHandler(repo);

    const result = await handler.execute(new ListOrdersQuery(undefined, undefined, 25, 50));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pagination).toEqual({ limit: 25, offset: 50, total: 99 });
    }
  });
});
