/**
 * @module queries-kanban
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { kanban_columns, kanban_cards } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

export async function execKanbanColumnSoftDelete(columnId: unknown, boardId: unknown): Promise<void> {
  await db.update(kanban_columns)
    .set({ deleted_at: sql`NOW()` })
    .where(and(eq(kanban_columns.id, columnId as number), eq(kanban_columns.board_id, boardId as number)));
}

export async function execKanbanCardSoftDelete(id: unknown): Promise<void> {
  await db.update(kanban_cards)
    .set({ deleted_at: sql`NOW()` })
    .where(eq(kanban_cards.id, id as number));
}
