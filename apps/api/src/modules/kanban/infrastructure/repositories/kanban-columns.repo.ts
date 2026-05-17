/**
 * @module kanban-columns.repo
 * @description Repository / data-access layer for Kanban columns. Wraps Drizzle ORM queries; returns Result<T>.
 *              Extracted from kanban-boards.repo as part of Rule 13/16 split (column concerns).
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { and, eq, isNull, max, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { execKanbanColumnSoftDelete } from '@common/database/queries-kanban';
import { Result, Ok, Err } from '@common/result';
import {
  CreateColumnInput,
  KanbanColumn,
  UpdateColumnInput,
} from '../../domain/repositories/i-kanban-boards.repo';
import { kanbanColumns } from '../kanban-tables';

@Injectable()
export class KanbanColumnsRepository {
  private readonly logger = new Logger(KanbanColumnsRepository.name);

  async getMaxColumnOrder(boardId: string): Promise<Result<number>> {
    try {
      const rows = await db
        .select({ max: max(kanbanColumns.sort_order) })
        .from(kanbanColumns)
        .where(and(eq(kanbanColumns.board_id, Number(boardId)), isNull(kanbanColumns.deleted_at)));
      return Ok(Number(rows[0]?.max ?? 0));
    } catch (error) {
      this.logger.error('getMaxColumnOrder: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async addColumn(input: CreateColumnInput): Promise<Result<KanbanColumn>> {
    try {
      const rows = await db
        .insert(kanbanColumns)
        .values({
          board_id:   Number(input.board_id),
          name:       input.name,
          sort_order: input.sort_order,
          color:      input.color,
        })
        .returning();
      const row = rows[0];
      if (!row) return Err({ message: 'Column yaratilmadi', code: 'DB_ERROR' });
      return Ok(castTo<KanbanColumn>(row));
    } catch (error) {
      this.logger.error('addColumn: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async updateColumn(boardId: string, columnId: string, input: UpdateColumnInput): Promise<Result<KanbanColumn>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_columns
        SET name = COALESCE(${input.name ?? null}, name), color = COALESCE(${input.color ?? null}, color),
            sort_order = COALESCE(${input.sort_order ?? null}, sort_order), updated_at = NOW()
        WHERE id = ${columnId} AND board_id = ${boardId} AND deleted_at IS NULL RETURNING *
      `);
      if (!rows.rows[0]) return Err({ message: `Column ${columnId} topilmadi`, code: 'NOT_FOUND' });
      return Ok(castTo<KanbanColumn>(rows.rows[0]));
    } catch (error) {
      this.logger.error('updateColumn: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async deleteColumn(boardId: string, columnId: string): Promise<Result<void>> {
    try {
      await execKanbanColumnSoftDelete(columnId, boardId);
      return Ok(undefined);
    } catch (error) {
      this.logger.error('deleteColumn: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }
}
