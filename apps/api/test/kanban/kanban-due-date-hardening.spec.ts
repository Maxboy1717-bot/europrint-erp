/**
 * test/kanban/kanban-due-date-hardening.spec.ts
 *
 * Kanban module 15 — report crash-hardening (defensive, no behavior change to valid data).
 *
 * PROBLEM: kanban_cards.due_date is varchar. An empty-string ('') or otherwise malformed
 * due_date makes an unguarded `due_date::date` cast throw (неверный синтаксис для типа date: "")
 * and 500s the whole Kanban stats/report dashboard.
 *
 * This spec pins BOTH halves of the fix:
 *  1. Source: KanbanBoardsService.addCard normalizes ''-> null (mirrors updateCard's str()
 *     + the just-fixed createCardFlat) so new empty-string dates never reach the DB.
 *  2. Reports: every due_date::date cast in DrizzleKanbanStatsRepository is guarded with the
 *     cron's proven idiom — `due_date ~ '^\d{4}-\d{2}-\d{2}'` + `substring(due_date FROM 1 FOR 10)::date`
 *     — so a bad value is excluded (WHERE-regex) instead of throwing. Valid dates are unchanged.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn(), db: {} }));

import { runQuery } from '@shared/db';
import { PgDialect } from 'drizzle-orm/pg-core';
import { DrizzleKanbanStatsRepository } from '../../src/modules/kanban/infrastructure/repositories/drizzle-kanban-stats.repo';
import { KanbanBoardsService } from '../../src/modules/kanban/application/kanban-boards.service';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// ── 1. Source fix — addCard normalizes ''-> null ────────────────────────────
describe("KanbanBoardsService.addCard — due_date '' -> null normalization", () => {
  function make() {
    const addCard = jest.fn().mockResolvedValue({ ok: true, data: { id: 5 } });
    const onCardCreated = jest.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = new KanbanBoardsService({ addCard } as any, { onCardCreated } as any);
    return { svc, addCard };
  }

  it("stores an empty-string dueDate as null (stops the ''::date crash at source)", async () => {
    const { svc, addCard } = make();
    await svc.addCard('board-1', { title: 't', columnId: 'col-1', dueDate: '' });
    expect(addCard).toHaveBeenCalledTimes(1);
    expect(addCard.mock.calls[0][0].due_date).toBeNull();
  });

  it('preserves a valid dueDate unchanged (no behavior change to valid data)', async () => {
    const { svc, addCard } = make();
    await svc.addCard('board-1', { title: 't', columnId: 'col-1', dueDate: '2026-05-10' });
    expect(addCard.mock.calls[0][0].due_date).toBe('2026-05-10');
  });

  it('maps a missing dueDate to null', async () => {
    const { svc, addCard } = make();
    await svc.addCard('board-1', { title: 't', columnId: 'col-1' });
    expect(addCard.mock.calls[0][0].due_date).toBeNull();
  });
});

// ── 2. Report fix — every due_date::date cast is guarded ────────────────────
describe('DrizzleKanbanStatsRepository — due_date::date casts are guarded (no unguarded cast)', () => {
  let repo: DrizzleKanbanStatsRepository;

  beforeEach(() => {
    repo = new DrizzleKanbanStatsRepository();
  });

  async function renderSql(fn: () => Promise<unknown>): Promise<string> {
    mockRunQuery.mockReset();
    mockRunQuery.mockResolvedValue({ rows: [{}] } as unknown as Awaited<ReturnType<typeof runQuery>>);
    await fn();
    const dialect = new PgDialect();
    return mockRunQuery.mock.calls
      .map((c) => dialect.sqlToQuery(c[0]).sql)
      .join('\n---\n');
  }

  const methods: [string, () => Promise<unknown>][] = [
    ['getTaskStats',          () => repo.getTaskStats()],
    ['getOverdueInbox',       () => repo.getOverdueInbox()],
    ['getOverdueCards',       () => repo.getOverdueCards()],
    ['getProductivityReport', () => repo.getProductivityReport()],
    ['getOverdueReport',      () => repo.getOverdueReport()],
    ['getAnalyticsSummary',   () => repo.getAnalyticsSummary()],
  ];

  it.each(methods)('%s guards its cast (regex + substring) and has no bare due_date::date', async (_name, fn) => {
    const rendered = await renderSql(fn);
    // regex guard present (backslashes doubled in TS source -> single in SQL)
    expect(rendered).toContain("~ '^\\d{4}-\\d{2}-\\d{2}'");
    // safe substring cast present
    expect(rendered).toContain('FROM 1 FOR 10)::date');
    // no unguarded cast survived (catches both `due_date::date` and `kc.due_date::date`)
    expect(rendered).not.toContain('due_date::date');
  });

  it('guards exactly 6 cast sites in total across the report methods', async () => {
    let count = 0;
    for (const [, fn] of methods) {
      const rendered = await renderSql(fn);
      count += (rendered.match(/FROM 1 FOR 10\)::date/g) ?? []).length;
    }
    expect(count).toBe(6);
  });
});
