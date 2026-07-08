/**
 * test/kanban/kanban-cards-create-flat.repo.spec.ts
 *
 * Vision #18 / §15 #46: a sub-task spawned from a card's chat message must carry its
 * parent link (parent_card_id) + inherited deadline (due_date). The FE
 * (createTaskFromMessage) sends parentCardId/dueDate, but createCardFlat's INSERT dropped
 * both -> the sub-task was silently orphaned (Q-43 fake-save). These render tests pin the
 * INSERT to include + bind both columns, and prove the ''-> null normalization.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn(), db: {} }));

import { runQuery } from '@shared/db';
import { PgDialect } from 'drizzle-orm/pg-core';
import { DrizzleKanbanCardsRepository } from '../../src/modules/kanban/infrastructure/repositories/drizzle-kanban-cards.repo';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe('DrizzleKanbanCardsRepository.createCardFlat — parent_card_id + due_date (vision #18)', () => {
  let repo: DrizzleKanbanCardsRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    mockRunQuery.mockResolvedValue({ rows: [{ id: 17 }] } as unknown as Awaited<ReturnType<typeof runQuery>>);
    repo = new DrizzleKanbanCardsRepository();
  });

  it('includes + binds parentCardId and dueDate in the INSERT (were silently dropped)', async () => {
    await repo.createCardFlat({ boardId: 2, columnId: 16, title: 'sub', parentCardId: 13, dueDate: '2026-08-01' });

    const q = new PgDialect().sqlToQuery(mockRunQuery.mock.calls[0][0]);
    expect(q.sql).toContain('parent_card_id');
    expect(q.sql).toContain('due_date');
    expect(q.params).toContain(13);           // parentCardId -> integer bound
    expect(q.params).toContain('2026-08-01'); // dueDate -> varchar bound
  });

  it('normalizes a missing parent + empty dueDate to null (no NaN, no empty string)', async () => {
    await repo.createCardFlat({ boardId: 2, columnId: 16, title: 'x', dueDate: '' });

    const q = new PgDialect().sqlToQuery(mockRunQuery.mock.calls[0][0]);
    expect(q.params).toContain(null);          // parent + due bound as null
    expect(q.params).not.toContain('');        // empty dueDate NOT stored as '' (would break report ::date casts)
    expect(q.params.some((p) => Number.isNaN(p as number))).toBe(false); // parent not NaN
  });
});
