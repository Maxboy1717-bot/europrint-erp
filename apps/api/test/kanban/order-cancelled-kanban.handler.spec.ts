/**
 * test/kanban/order-cancelled-kanban.handler.spec.ts
 *
 * Unit tests for OrderCancelledKanbanHandler. IKanbanBoardsRepo is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderCancelledKanbanHandler,
  OrderCancelledEvent,
} from '../../src/modules/kanban/application/event-handlers/order-cancelled-kanban.handler';
import { KANBAN_BOARDS_REPO } from '../../src/modules/kanban/domain/repositories/i-kanban-boards.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(moveOk = true) {
  return {
    moveOrderCardToCancelled: jest.fn().mockResolvedValue(
      moveOk ? Ok(undefined) : Err(AppErr('DB_ERROR', 'move failed')),
    ),
    createKanbanForOrder: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getColumns: jest.fn(),
    getCards: jest.fn(),
  };
}

async function build(repo: ReturnType<typeof makeRepo>): Promise<OrderCancelledKanbanHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OrderCancelledKanbanHandler,
      { provide: KANBAN_BOARDS_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(OrderCancelledKanbanHandler);
}

describe('OrderCancelledKanbanHandler', () => {
  it('calls moveOrderCardToCancelled with orderId and orderNumber', async () => {
    const repo = makeRepo();
    const handler = await build(repo);

    await handler.handle(new OrderCancelledEvent(7, 'SO-7'));

    expect(repo.moveOrderCardToCancelled).toHaveBeenCalledWith(7, 'SO-7');
  });

  it('resolves without throwing when repo succeeds', async () => {
    const repo = makeRepo(true);
    const handler = await build(repo);

    await expect(handler.handle(new OrderCancelledEvent(7, 'SO-7'))).resolves.toBeUndefined();
  });

  it('swallows database errors gracefully', async () => {
    const repo = makeRepo(false);
    const handler = await build(repo);

    await expect(
      handler.handle(new OrderCancelledEvent(7, 'SO-7')),
    ).resolves.toBeUndefined();
  });

  it('exposes the static eventName and aggregateName on its event class', async () => {
    const ev = new OrderCancelledEvent(1, 'SO-1');
    expect(ev.eventName).toBe('OrderCancelled');
    expect(ev.aggregateName).toBe('SalesOrder');
  });
});
