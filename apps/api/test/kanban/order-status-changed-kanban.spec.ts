/**
 * test/kanban/order-status-changed-kanban.spec.ts
 *
 * Golden-thread sync (§15 #127 / vision #22): when a sales order's status
 * changes SD emits OrderStatusChangedEvent, which logistics/pp/sd already
 * consume. Kanban previously only listened for OrderCreated + OrderCancelled, so
 * a card created for an order silently drifted once its order status changed.
 *
 * Two suites:
 *  1. KanbanCardsRepository.appendOrderStatusNote — renders an UPDATE that finds
 *     the linked sales_order card(s) by related_type + related_id and appends a
 *     dated status note to `description` (no column/stage change — Guruh-B).
 *  2. OrderStatusChangedKanbanHandler — on the event, delegates to the repo with
 *     (orderId, previousStatus, newStatus) and swallows repo errors (best-effort).
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn(), db: {} }));

import { runQuery } from '@shared/db';
import { PgDialect } from 'drizzle-orm/pg-core';
import { Test, TestingModule } from '@nestjs/testing';
import { KanbanCardsRepository } from '../../src/modules/kanban/infrastructure/repositories/kanban-cards.repo';
import {
  OrderStatusChangedKanbanHandler,
  OrderStatusChangedEvent,
} from '../../src/modules/kanban/application/event-handlers/order-status-changed-kanban.handler';
import { KANBAN_BOARDS_REPO } from '../../src/modules/kanban/domain/repositories/i-kanban-boards.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe('KanbanCardsRepository.appendOrderStatusNote — golden-thread note sync (§15 #127)', () => {
  let repo: KanbanCardsRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    mockRunQuery.mockResolvedValue(
      { rows: [{ id: 13 }] } as unknown as Awaited<ReturnType<typeof runQuery>>,
    );
    repo = new KanbanCardsRepository();
  });

  it('renders an UPDATE finding sales_order cards by related_id and appending the status note', async () => {
    const res = await repo.appendOrderStatusNote(42, 'shaping', 'approved');
    expect(res.ok).toBe(true);

    const q = new PgDialect().sqlToQuery(mockRunQuery.mock.calls[0][0]);

    // Targets the right table + columns, and appends to description (no column_id set).
    expect(q.sql).toContain('kanban_cards');
    expect(q.sql.toLowerCase()).toContain('update');
    expect(q.sql).toContain('description');
    expect(q.sql).not.toContain('column_id'); // does NOT move stage (Guruh-B)

    // Finds by related_type='sales_order' + related_id + deleted_at IS NULL.
    expect(q.sql).toContain('related_type');
    expect(q.sql).toContain("'sales_order'");
    expect(q.sql).toContain('related_id');
    expect(q.sql).toContain('deleted_at');

    // orderId bound as text (mirrors moveOrderCardToCancelled's String(orderId)).
    expect(q.params).toContain('42');
    // The dated status note is bound as a single param.
    expect(
      q.params.some(
        (p) => typeof p === 'string' && p.includes('Buyurtma holati: shaping -> approved'),
      ),
    ).toBe(true);
  });

  it('is a no-op Ok when no card is linked to the order (RETURNING → empty rows)', async () => {
    mockRunQuery.mockResolvedValue(
      { rows: [] } as unknown as Awaited<ReturnType<typeof runQuery>>,
    );
    const res = await repo.appendOrderStatusNote(999, 'draft', 'confirmed');
    expect(res.ok).toBe(true);
  });

  it('returns Err (never throws) when the DB call fails', async () => {
    mockRunQuery.mockRejectedValue(new Error('db down'));
    const res = await repo.appendOrderStatusNote(1, 'a', 'b');
    expect(res.ok).toBe(false);
  });
});

function makeRepo(ok = true) {
  return {
    appendOrderStatusNote: jest
      .fn()
      .mockResolvedValue(ok ? Ok(undefined) : Err(AppErr('DB_ERROR', 'append failed'))),
    moveOrderCardToCancelled: jest.fn(),
    createKanbanForOrder: jest.fn(),
  };
}

async function build(
  repo: ReturnType<typeof makeRepo>,
): Promise<OrderStatusChangedKanbanHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OrderStatusChangedKanbanHandler,
      { provide: KANBAN_BOARDS_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(OrderStatusChangedKanbanHandler);
}

describe('OrderStatusChangedKanbanHandler', () => {
  it('delegates to appendOrderStatusNote with (orderId, previousStatus, newStatus)', async () => {
    const repo = makeRepo();
    const handler = await build(repo);

    await handler.handle(new OrderStatusChangedEvent(42, 'shaping', 'approved'));

    expect(repo.appendOrderStatusNote).toHaveBeenCalledWith(42, 'shaping', 'approved');
  });

  it('resolves without throwing when repo succeeds', async () => {
    const repo = makeRepo(true);
    const handler = await build(repo);

    await expect(
      handler.handle(new OrderStatusChangedEvent(42, 'a', 'b')),
    ).resolves.toBeUndefined();
  });

  it('swallows repo errors gracefully (best-effort — never breaks the SD status change)', async () => {
    const repo = makeRepo(false);
    const handler = await build(repo);

    await expect(
      handler.handle(new OrderStatusChangedEvent(42, 'a', 'b')),
    ).resolves.toBeUndefined();
  });

  it('exposes the eventName and aggregateName on its event class', () => {
    const ev = new OrderStatusChangedEvent(1, 'a', 'b');
    expect(ev.eventName).toBe('OrderStatusChanged');
    expect(ev.aggregateName).toBe('SalesOrder');
  });
});
