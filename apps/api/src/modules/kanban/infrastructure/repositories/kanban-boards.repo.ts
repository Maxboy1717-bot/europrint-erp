import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { execKanbanColumnSoftDelete, execKanbanCardSoftDelete } from '@common/database/queries-kanban';
import { Result, Ok, Err } from '@common/result';
import {
  IKanbanBoardsRepo,
  KanbanBoard,
  KanbanBoardDetail,
  KanbanCard,
  KanbanColumn,
  CreateBoardInput,
  CreateCardInput,
  CreateColumnInput,
  MoveCardInput,
  UpdateCardInput,
  UpdateColumnInput,
} from '../../domain/repositories/i-kanban-boards.repo';

@Injectable()
export class KanbanBoardsRepository implements IKanbanBoardsRepo {
  private readonly logger = new Logger(KanbanBoardsRepository.name);

  async getBoards(): Promise<Result<KanbanBoard[]>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT id, name, type, description, created_at, updated_at
        FROM kanban_boards WHERE deleted_at IS NULL ORDER BY created_at DESC
      `);
      return Ok(castTo<KanbanBoard[]>(rows.rows));
    } catch (error) {
      this.logger.error('getBoards: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async getBoardById(boardId: string): Promise<Result<KanbanBoardDetail>> {
    try {
      const boardRows = await runQuery<Record<string, unknown>>(sql`
        SELECT id, name, type, description, created_at, updated_at
        FROM kanban_boards WHERE id = ${boardId} AND deleted_at IS NULL
      `);
      const board = boardRows.rows[0];
      if (!board) return Err({ message: `Board ${boardId} topilmadi`, code: 'NOT_FOUND' });

      const [columnsRows, cardsRows] = await Promise.all([
        db.execute<Record<string, unknown>>(sql`
          SELECT id, board_id, name, sort_order, color, created_at
          FROM kanban_columns WHERE board_id = ${boardId} AND deleted_at IS NULL ORDER BY sort_order ASC
        `),
        db.execute<Record<string, unknown>>(sql`
          SELECT id, board_id, column_id, title, description, priority, due_date,
                 sort_order, owner_user_id, related_type, related_id, source,
                 start_date, estimated_time, created_at, updated_at
          FROM kanban_cards WHERE board_id = ${boardId} AND deleted_at IS NULL ORDER BY sort_order ASC
        `),
      ]);

      return Ok({ ...(castTo<KanbanBoard>(board)), columns: castTo<KanbanColumn[]>(columnsRows.rows), cards: castTo<KanbanCard[]>(cardsRows.rows)});
    } catch (error) {
      this.logger.error('getBoardById: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async createBoard(input: CreateBoardInput): Promise<Result<KanbanBoard>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_boards (name, type, description) VALUES (${input.name}, ${input.type}, ${input.description}) RETURNING *
      `);
      return Ok(castTo<KanbanBoard>(rows.rows[0]));
    } catch (error) {
      this.logger.error('createBoard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async getMaxColumnOrder(boardId: string): Promise<Result<number>> {
    try {
      const rows = await runQuery<{ max: string }>(sql`
        SELECT COALESCE(MAX(sort_order), 0) AS max FROM kanban_columns WHERE board_id = ${boardId} AND deleted_at IS NULL
      `);
      return Ok(Number(rows.rows[0]?.max ?? 0));
    } catch (error) {
      this.logger.error('getMaxColumnOrder: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async addColumn(input: CreateColumnInput): Promise<Result<KanbanColumn>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_columns (board_id, name, sort_order, color) VALUES (${input.board_id}, ${input.name}, ${input.sort_order}, ${input.color}) RETURNING *
      `);
      return Ok(castTo<KanbanColumn>(rows.rows[0]));
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

  async addCard(input: CreateCardInput): Promise<Result<KanbanCard>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_cards (board_id, column_id, title, description, priority, due_date, owner_user_id, sort_order)
        VALUES (${input.board_id}, ${input.column_id}, ${input.title}, ${input.description}, ${input.priority}, ${input.due_date}, ${input.owner_user_id}, 0)
        RETURNING *
      `);
      return Ok(castTo<KanbanCard>(rows.rows[0]));
    } catch (error) {
      this.logger.error('addCard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async updateCard(id: string, input: UpdateCardInput): Promise<Result<KanbanCard>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET title = COALESCE(${input.title ?? null}, title), description = COALESCE(${input.description ?? null}, description),
            priority = COALESCE(${input.priority ?? null}, priority), due_date = COALESCE(${input.due_date ?? null}, due_date),
            owner_user_id = COALESCE(${input.owner_user_id ?? null}, owner_user_id), updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL RETURNING *
      `);
      if (!rows.rows[0]) return Err({ message: `Card ${id} topilmadi`, code: 'NOT_FOUND' });
      return Ok(castTo<KanbanCard>(rows.rows[0]));
    } catch (error) {
      this.logger.error('updateCard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async moveCard(id: string, input: MoveCardInput): Promise<Result<KanbanCard>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards SET column_id = ${input.column_id}, sort_order = COALESCE(${input.sort_order ?? null}, sort_order), updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL RETURNING *
      `);
      if (!rows.rows[0]) return Err({ message: `Card ${id} topilmadi`, code: 'NOT_FOUND' });
      return Ok(castTo<KanbanCard>(rows.rows[0]));
    } catch (error) {
      this.logger.error('moveCard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async deleteCard(id: string): Promise<Result<void>> {
    try {
      await execKanbanCardSoftDelete(id);
      return Ok(undefined);
    } catch (error) {
      this.logger.error('deleteCard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }
}
