/**
 * test/kanban/order-created-kanban.handler.spec.ts
 *
 * Unit tests for OrderCreatedKanbanHandler. IKanbanBoardsRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedKanbanHandler } from '../../src/modules/kanban/application/event-handlers/order-created-kanban.handler';
import { KANBAN_BOARDS_REPO } from '../../src/modules/kanban/domain/repositories/i-kanban-boards.repo';
import { OrderCreatedEvent } from '../../src/modules/sd/domain/events/order-created.event';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeEvent(): OrderCreatedEvent {
  return new OrderCreatedEvent(101, 7, 'SO-2024-001', 1_500_000);
}

function makeRepo(createOk = true) {
  return {
    createKanbanForOrder: jest.fn().mockResolvedValue(
      createOk ? Ok({ id: 'card-1' }) : Err(AppErr('DB_ERROR', 'insert failed')),
    ),
    // Additional repo methods (not used by this handler)
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getColumns: jest.fn(),
    getCards: jest.fn(),
  };
}

async function build(repo: ReturnType<typeof makeRepo>): Promise<OrderCreatedKanbanHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OrderCreatedKanbanHandler,
      { provide: KANBAN_BOARDS_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(OrderCreatedKanbanHandler);
}

describe('OrderCreatedKanbanHandler', () => {
  it('calls createKanbanForOrder with event data when order is created', async () => {
    const repo = makeRepo();
    const handler = await build(repo);

    await handler.handle(makeEvent());

    expect(repo.createKanbanForOrder).toHaveBeenCalledWith({
      orderId:     101,
      orderNumber: 'SO-2024-001',
      totalAmount: 1_500_000,
      companyId:   7,
    });
  });

  it('resolves without throwing when createKanbanForOrder succeeds', async () => {
    const repo = makeRepo(true);
    const handler = await build(repo);

    await expect(handler.handle(makeEvent())).resolves.toBeUndefined();
  });

  it('swallows repository errors without throwing', async () => {
    const repo = makeRepo(false);
    const handler = await build(repo);

    await expect(handler.handle(makeEvent())).resolves.toBeUndefined();
  });
});
