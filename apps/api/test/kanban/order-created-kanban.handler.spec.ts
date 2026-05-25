/**
 * test/kanban/order-created-kanban.handler.spec.ts
 *
 * Unit tests for OrderCreatedKanbanHandler. Mocks @shared/db.runQuery to feed
 * board / column rows and to spy on the INSERT call.
 */

interface QueryResult { rows: Array<Record<string, unknown>> }

const runQueryMock = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: runQueryMock,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedKanbanHandler } from '../../src/modules/kanban/application/event-handlers/order-created-kanban.handler';
import { OrderCreatedEvent } from '../../src/modules/sd/domain/events/order-created.event';

async function build(): Promise<OrderCreatedKanbanHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [OrderCreatedKanbanHandler],
  }).compile();
  return module.get(OrderCreatedKanbanHandler);
}

function event(): OrderCreatedEvent {
  return new OrderCreatedEvent(101, 7, 'SO-2024-001', 1_500_000);
}

function queue(...replies: QueryResult[]): void {
  runQueryMock.mockReset();
  let i = 0;
  runQueryMock.mockImplementation(() => Promise.resolve(replies[i++] ?? { rows: [] }));
}

describe('OrderCreatedKanbanHandler', () => {
  it('returns early when no sales board is found', async () => {
    queue({ rows: [] });
    const handler = await build();

    await handler.handle(event());

    expect(runQueryMock).toHaveBeenCalledTimes(1);
  });

  it('returns early when board has no columns', async () => {
    queue({ rows: [{ id: 9 }] }, { rows: [] });
    const handler = await build();

    await handler.handle(event());

    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });

  it('inserts a kanban card when board and first column exist', async () => {
    queue(
      { rows: [{ id: 9 }] },
      { rows: [{ id: 4 }] },
      { rows: [] },
    );
    const handler = await build();

    await handler.handle(event());

    expect(runQueryMock).toHaveBeenCalledTimes(3);
  });

  it('swallows database errors without throwing', async () => {
    runQueryMock.mockReset();
    runQueryMock.mockRejectedValue(new Error('db boom'));
    const handler = await build();

    await expect(handler.handle(event())).resolves.toBeUndefined();
  });
});
