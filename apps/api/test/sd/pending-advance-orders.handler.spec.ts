/**
 * test/sd/pending-advance-orders.handler.spec.ts
 *
 * Unit tests for PendingAdvanceOrdersHandler. ISalesOrderRepository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  PendingAdvanceOrdersHandler,
  PendingAdvanceOrdersQuery,
} from '../../src/modules/sd/application/queries/pending-advance-orders.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(orders: SalesOrder[] | null): jest.Mocked<ISalesOrderRepository> {
  return {
    findPendingAdvanceOrders: jest.fn().mockResolvedValue(
      orders ? Ok(orders) : Err(AppErr('DB_ERROR', 'down')),
    ),
    findById: jest.fn(),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

async function buildHandler(repo: ISalesOrderRepository): Promise<PendingAdvanceOrdersHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PendingAdvanceOrdersHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(PendingAdvanceOrdersHandler);
}

describe('PendingAdvanceOrdersHandler', () => {
  it('returns paginated orders when repository succeeds', async () => {
    const orders = [
      buildSalesOrder({ id: 10, status: 'pending_advance' }),
      buildSalesOrder({ id: 11, status: 'pending_advance' }),
    ];
    const handler = await buildHandler(makeRepo(orders));

    const result = await handler.execute(new PendingAdvanceOrdersQuery(50, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data['data'] as SalesOrder[];
      expect(data).toHaveLength(2);
    }
  });

  it('returns INTERNAL when repository fails', async () => {
    const handler = await buildHandler(makeRepo(null));

    const result = await handler.execute(new PendingAdvanceOrdersQuery());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });

  it('uses default limit=50 and offset=0 when query is empty', async () => {
    const repo = makeRepo([]);
    const handler = await buildHandler(repo);

    await handler.execute(new PendingAdvanceOrdersQuery());

    expect(repo.findPendingAdvanceOrders).toHaveBeenCalledWith(50, 0);
  });

  it('forwards custom pagination to repository', async () => {
    const repo = makeRepo([]);
    const handler = await buildHandler(repo);

    await handler.execute(new PendingAdvanceOrdersQuery(20, 100));

    expect(repo.findPendingAdvanceOrders).toHaveBeenCalledWith(20, 100);
  });

  it('reports total count as data length in pagination envelope', async () => {
    const orders = [buildSalesOrder(), buildSalesOrder(), buildSalesOrder()];
    const handler = await buildHandler(makeRepo(orders));

    const result = await handler.execute(new PendingAdvanceOrdersQuery(50, 0));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const pagination = result.data['pagination'] as { total: number };
      expect(pagination.total).toBe(3);
    }
  });
});
