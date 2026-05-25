/**
 * test/sd/get-order-by-id.handler.spec.ts
 *
 * Unit tests for GetOrderByIdHandler. ISalesOrderRepository is mocked; the
 * SalesOrder aggregate is real and provides the 360° payload accessors.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  GetOrderByIdHandler,
  GetOrderByIdQuery,
} from '../../src/modules/sd/application/queries/get-order-by-id.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(order: SalesOrder | null): jest.Mocked<ISalesOrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'not found')),
    ),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

async function buildHandler(repo: ISalesOrderRepository): Promise<GetOrderByIdHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetOrderByIdHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetOrderByIdHandler);
}

describe('GetOrderByIdHandler', () => {
  it('returns NOT_FOUND when order does not exist', async () => {
    const handler = await buildHandler(makeRepo(null));

    const result = await handler.execute(new GetOrderByIdQuery(999));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns 360° card payload when order is found', async () => {
    const order = buildSalesOrder({
      id: 42, status: 'pending_advance', totalAmount: 5_000_000,
    });
    const handler = await buildHandler(makeRepo(order));

    const result = await handler.execute(new GetOrderByIdQuery(42));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data['id']).toBe(42);
      expect(result.data['status']).toBe('pending_advance');
      expect(result.data['totalAmount']).toBe(5_000_000);
    }
  });

  it('reports threeCheckpointPassed=false when not all checkpoints passed', async () => {
    const order = buildSalesOrder({
      techBomApproved: true, techRoutingApproved: false, techCardApproved: false,
    });
    const handler = await buildHandler(makeRepo(order));

    const result = await handler.execute(new GetOrderByIdQuery(order.getId()));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data['threeCheckpointPassed']).toBe(false);
  });

  it('reports threeCheckpointPassed=true when all 3 checkpoints passed', async () => {
    const order = buildSalesOrder({
      techBomApproved: true, techRoutingApproved: true, techCardApproved: true,
    });
    const handler = await buildHandler(makeRepo(order));

    const result = await handler.execute(new GetOrderByIdQuery(order.getId()));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data['threeCheckpointPassed']).toBe(true);
  });

  it('includes advanceBlock signal in payload', async () => {
    const order = buildSalesOrder({
      totalAmount: 10_000_000, advanceRequired: 70, advancePaid: 0,
      advanceStatus: 'pending',
    });
    const handler = await buildHandler(makeRepo(order));

    const result = await handler.execute(new GetOrderByIdQuery(order.getId()));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const block = result.data['advanceBlock'] as { blocked: boolean };
      expect(block.blocked).toBe(true);
    }
  });
});
