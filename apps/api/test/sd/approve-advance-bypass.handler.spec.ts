/**
 * test/sd/approve-advance-bypass.handler.spec.ts
 *
 * Unit tests for ApproveAdvanceBypassHandler. ISalesOrderRepository and
 * EventBus are mocked; the SalesOrder aggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  ApproveAdvanceBypassHandler,
  ApproveAdvanceBypassCommand,
} from '../../src/modules/sd/application/commands/approve-advance-bypass.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(order: SalesOrder | null, updateOk = true): jest.Mocked<ISalesOrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'Order not found')),
    ),
    update: jest.fn().mockResolvedValue(
      updateOk ? Ok(undefined) : Err(AppErr('DB_ERROR', 'failed')),
    ),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

function makeBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

async function buildHandler(
  repo: ISalesOrderRepository, bus: EventBus,
): Promise<ApproveAdvanceBypassHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ApproveAdvanceBypassHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return module.get(ApproveAdvanceBypassHandler);
}

describe('ApproveAdvanceBypassHandler', () => {
  it('returns VALIDATION when bypass reason is empty', async () => {
    const handler = await buildHandler(makeRepo(buildSalesOrder()), makeBus());

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(1, 99, '   '),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION');
  });

  it('returns NOT_FOUND when order does not exist', async () => {
    const handler = await buildHandler(makeRepo(null), makeBus());

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(999, 99, 'CEO override'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('bypasses advance when order is in valid state', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const repo = makeRepo(order);
    const handler = await buildHandler(repo, makeBus());

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, 'special case'),
    );

    expect(result.ok).toBe(true);
    expect(order.getAdvanceStatus()).toBe('bypassed');
    expect(repo.update).toHaveBeenCalledWith(order);
  });

  it('publishes AdvanceBypassApproved event on success', async () => {
    const order = buildSalesOrder();
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(order), bus);

    await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, 'urgent'),
    );

    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'AdvanceBypassApproved' }),
    );
  });

  it('returns INTERNAL when persisting bypass fails', async () => {
    const order = buildSalesOrder();
    const handler = await buildHandler(makeRepo(order, false), makeBus());

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, 'reason'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });
});
