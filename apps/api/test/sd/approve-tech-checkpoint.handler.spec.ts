/**
 * test/sd/approve-tech-checkpoint.handler.spec.ts
 *
 * Unit tests for ApproveTechCheckpointHandler. Repo + EventBus are mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  ApproveTechCheckpointHandler,
  ApproveTechCheckpointCommand,
} from '../../src/modules/sd/application/commands/approve-tech-checkpoint.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(order: SalesOrder | null, updateOk = true): jest.Mocked<ISalesOrderRepository> {
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
): Promise<ApproveTechCheckpointHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ApproveTechCheckpointHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return module.get(ApproveTechCheckpointHandler);
}

describe('ApproveTechCheckpointHandler', () => {
  it('returns NOT_FOUND when order is missing', async () => {
    const handler = await buildHandler(makeRepo(null), makeBus());

    const result = await handler.execute(new ApproveTechCheckpointCommand(99, 'bom'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('approves single BOM checkpoint and publishes typed event', async () => {
    const order = buildSalesOrder();
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(order), bus);

    const result = await handler.execute(
      new ApproveTechCheckpointCommand(order.getId(), 'bom'),
    );

    expect(result.ok).toBe(true);
    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'TechCheckpointBOMApproved' }),
    );
  });

  it('publishes DesignAndLabCompleted when all 3 checkpoints pass', async () => {
    const order = buildSalesOrder({
      techBomApproved: true, techRoutingApproved: true, techCardApproved: false,
    });
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(order), bus);

    await handler.execute(new ApproveTechCheckpointCommand(order.getId(), 'card'));

    const eventNames = (bus.publish as jest.Mock).mock.calls.map(c => c[0].eventName);
    expect(eventNames).toContain('DesignAndLabCompleted');
  });

  it('does not signal PP when only some checkpoints are approved', async () => {
    const order = buildSalesOrder();
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(order), bus);

    await handler.execute(new ApproveTechCheckpointCommand(order.getId(), 'routing'));

    const eventNames = (bus.publish as jest.Mock).mock.calls.map(c => c[0].eventName);
    expect(eventNames).not.toContain('DesignAndLabCompleted');
  });

  it('returns INTERNAL when repository update fails', async () => {
    const order = buildSalesOrder();
    const handler = await buildHandler(makeRepo(order, false), makeBus());

    const result = await handler.execute(
      new ApproveTechCheckpointCommand(order.getId(), 'bom'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
  });
});
