/**
 * test/sd/create-order.handler.spec.ts
 *
 * Unit tests for CreateOrderHandler. ISalesOrderRepository and EventBus are
 * mocked; the SalesOrder aggregate factory runs for real.
 */

// Must be before imports so Jest hoists the factory above require() calls.
jest.mock('@shared/db', () => ({
  db: {
    transaction: jest.fn().mockImplementation(
      async (cb: (tx: unknown) => unknown) => cb(null),
    ),
  },
  domain_events: {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  CreateOrderHandler,
  CreateOrderCommand,
} from '../../src/modules/sd/application/commands/create-order.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { OutboxRepository } from '../../src/modules/shared/outbox/outbox.repository';

function makeRepo(saveOk = true, count = 5): jest.Mocked<ISalesOrderRepository> {
  return {
    save: jest.fn().mockImplementation((order: SalesOrder) =>
      Promise.resolve(saveOk ? Ok(order) : Err(AppErr('DB_ERROR', 'save failed'))),
    ),
    count: jest.fn().mockResolvedValue(Ok(count)),
    findById: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

function makeBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

async function buildHandler(
  repo: ISalesOrderRepository, bus: EventBus,
): Promise<CreateOrderHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateOrderHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
      { provide: OutboxRepository, useValue: { insertBatch: jest.fn().mockResolvedValue(Ok(1)) } },
    ],
  }).compile();
  return module.get(CreateOrderHandler);
}

describe('CreateOrderHandler', () => {
  it('creates draft sales order from valid command', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo, makeBus());

    const result = await handler.execute(
      new CreateOrderCommand(10, 5_000_000, 'UZS', false, false, 7),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.getStatus()).toBe('draft');
  });

  it('returns Err when save fails at the repository', async () => {
    const repo = makeRepo(false);
    const handler = await buildHandler(repo, makeBus());

    const result = await handler.execute(
      new CreateOrderCommand(10, 5_000_000, 'UZS'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/save/i);
  });

  it('publishes DesignRequired event when designFlag is true', async () => {
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(), bus);

    await handler.execute(
      new CreateOrderCommand(10, 1_000_000, 'UZS', true, false, 7),
    );

    const names = (bus.publish as jest.Mock).mock.calls.map(c => c[0].eventName);
    expect(names).toContain('DesignRequired');
  });

  it('publishes SampleRequired event when sampleFlag is true', async () => {
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(), bus);

    await handler.execute(
      new CreateOrderCommand(10, 1_000_000, 'UZS', false, true, 7),
    );

    const names = (bus.publish as jest.Mock).mock.calls.map(c => c[0].eventName);
    expect(names).toContain('SampleRequired');
  });

  it('always publishes OrderCreatedEvent after successful save', async () => {
    const bus = makeBus();
    const handler = await buildHandler(makeRepo(), bus);

    await handler.execute(
      new CreateOrderCommand(10, 1_000_000, 'UZS'),
    );

    const published = (bus.publish as jest.Mock).mock.calls.map(c => c[0]);
    expect(published.some(e => e.constructor.name === 'OrderCreatedEvent')).toBe(true);
  });

  it('produces order number using sequence prefix when count is available', async () => {
    const repo = makeRepo(true, 99);
    const handler = await buildHandler(repo, makeBus());

    const result = await handler.execute(
      new CreateOrderCommand(10, 1_000_000, 'UZS'),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.getOrderNumber()).toMatch(/^SO-/);
  });
});
