/**
 * test/sd/update-order-status.handler.spec.ts
 *
 * Unit tests for UpdateOrderStatusHandler. ISalesOrderRepository and EventBus
 * are mocked; the SalesOrder aggregate runs for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import {
  UpdateOrderStatusHandler,
  UpdateOrderStatusCommand,
} from '../../src/modules/sd/application/commands/update-order-status.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(
  order: SalesOrder | null, updateOk = true,
): jest.Mocked<ISalesOrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'not found')),
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
): Promise<UpdateOrderStatusHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UpdateOrderStatusHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return module.get(UpdateOrderStatusHandler);
}

describe('UpdateOrderStatusHandler', () => {
  it('throws BadRequest when order is missing', async () => {
    const handler = await buildHandler(makeRepo(null), makeBus());

    await expect(
      handler.execute(new UpdateOrderStatusCommand(99, 'approved')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws Forbidden on illegal status transition', async () => {
    const order = buildSalesOrder({ status: 'draft' });
    const handler = await buildHandler(makeRepo(order), makeBus());

    await expect(
      handler.execute(new UpdateOrderStatusCommand(order.getId(), 'shipped')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks ready_for_planning when advance is insufficient', async () => {
    const order = buildSalesOrder({
      status: 'pending_advance',
      totalAmount: 10_000_000,
      advanceRequired: 70,
      advancePaid: 0,
    });
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(order), bus);

    await expect(
      handler.execute(new UpdateOrderStatusCommand(order.getId(), 'ready_for_planning')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const names = (bus.publish as jest.Mock).mock.calls.map(c => c[0]?.constructor?.name);
    expect(names).toContain('AdvanceCheckFailedEvent');
  });

  it('updates status and publishes OrderStatusChangedEvent when transition is valid', async () => {
    const order = buildSalesOrder({ status: 'draft' });
    const bus = makeBus();
    const repo = makeRepo(order);
    const handler = await buildHandler(repo, bus);

    const result = await handler.execute(
      new UpdateOrderStatusCommand(order.getId(), 'pending_approval'),
    );

    expect(result.ok).toBe(true);
    expect(repo.update).toHaveBeenCalled();
    const names = (bus.publish as jest.Mock).mock.calls.map(c => c[0]?.constructor?.name);
    expect(names).toContain('OrderStatusChangedEvent');
  });

  it('returns Err when persistence of new status fails', async () => {
    const order = buildSalesOrder({ status: 'draft' });
    const handler = await buildHandler(makeRepo(order, false), makeBus());

    const result = await handler.execute(
      new UpdateOrderStatusCommand(order.getId(), 'pending_approval'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/Failed to update/);
  });
});
