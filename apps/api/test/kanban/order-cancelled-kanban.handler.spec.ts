/**
 * test/kanban/order-cancelled-kanban.handler.spec.ts
 *
 * Unit tests for OrderCancelledKanbanHandler. Mocks runQuery from @shared/db
 * to exercise both the "cancel column found" and "soft-delete fallback" paths.
 */

interface QueryResult { rows: Array<Record<string, unknown>> }

const runQueryMock = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: runQueryMock,
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderCancelledKanbanHandler,
  OrderCancelledEvent,
} from '../../src/modules/kanban/application/event-handlers/order-cancelled-kanban.handler';

async function build(): Promise<OrderCancelledKanbanHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [OrderCancelledKanbanHandler],
  }).compile();
  return module.get(OrderCancelledKanbanHandler);
}

function queue(...replies: QueryResult[]): void {
  runQueryMock.mockReset();
  let i = 0;
  runQueryMock.mockImplementation(() => Promise.resolve(replies[i++] ?? { rows: [] }));
}

describe('OrderCancelledKanbanHandler', () => {
  it('moves cards into the cancel column when one exists', async () => {
    queue(
      { rows: [{ id: 50 }] },
      { rows: [] },
    );
    const handler = await build();

    await handler.handle(new OrderCancelledEvent(7, 'SO-7'));

    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });

  it('soft-deletes related cards when cancel column is missing', async () => {
    queue(
      { rows: [] },
      { rows: [] },
    );
    const handler = await build();

    await handler.handle(new OrderCancelledEvent(7, 'SO-7'));

    expect(runQueryMock).toHaveBeenCalledTimes(2);
  });

  it('swallows database errors gracefully', async () => {
    runQueryMock.mockReset();
    runQueryMock.mockRejectedValue(new Error('db gone'));
    const handler = await build();

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
