/**
 * @module kanban-boards.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

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
                 start_date, estimated_time, accepted_at, completed_at,
                 created_at, updated_at,
                 (SELECT row_to_json(t) FROM kanban_time_tracks t
                  WHERE t.card_id = kanban_cards.id::text AND t.is_running = true
                  LIMIT 1) AS active_time_track
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

  async deleteBoard(boardId: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE kanban_boards SET deleted_at = NOW() WHERE id = ${boardId} AND deleted_at IS NULL
      `);
      return Ok(undefined);
    } catch (error) {
      this.logger.error('deleteBoard: ' + (error as Error).message);
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
      // sort_order: ustundagi MAX + 1 — har doim oxirga qo'shiladi
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_cards (board_id, column_id, title, description, priority, due_date, owner_user_id, sort_order)
        VALUES (
          ${input.board_id}, ${input.column_id}, ${input.title}, ${input.description},
          ${input.priority}, ${input.due_date}, ${input.owner_user_id},
          COALESCE(
            (SELECT MAX(sort_order) FROM kanban_cards
             WHERE column_id = ${input.column_id} AND deleted_at IS NULL),
            -1
          ) + 1
        )
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
      // Note: due_date, start_date, recurrence_end_date are varchar in DB (not date type)
      //       parent_card_id, project_id, related_id are integer in DB
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards SET
          title               = COALESCE(${input.title ?? null},               title),
          description         = CASE WHEN ${input.description} IS NOT NULL THEN ${input.description} ELSE description END,
          priority            = COALESCE(${input.priority ?? null},             priority),
          due_date            = COALESCE(${input.due_date ?? null},             due_date),
          start_date          = COALESCE(${input.start_date ?? null},           start_date),
          owner_user_id       = COALESCE(${input.owner_user_id ?? null},        owner_user_id),
          estimated_time      = COALESCE(${input.estimated_time ?? null},       estimated_time),
          parent_card_id      = COALESCE(${input.parent_card_id ?? null},       parent_card_id),
          project_id          = COALESCE(${input.project_id ?? null},           project_id),
          related_type        = COALESCE(${input.related_type ?? null},         related_type),
          related_id          = COALESCE(${input.related_id ?? null},           related_id),
          recurrence_pattern  = COALESCE(${input.recurrence_pattern ?? null},   recurrence_pattern),
          recurrence_end_date = COALESCE(${input.recurrence_end_date ?? null},  recurrence_end_date),
          updated_at          = NOW()
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
      // sort_order berilgan bo'lsa — o'sha pozitsiyadagi va undan keyingi kartalarni siljitish
      if (input.sort_order != null && input.column_id) {
        await runQuery(sql`
          UPDATE kanban_cards
          SET sort_order = sort_order + 1, updated_at = NOW()
          WHERE column_id = ${input.column_id}
            AND sort_order >= ${input.sort_order}
            AND id::text != ${id}
            AND deleted_at IS NULL
        `);
      }
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET column_id  = COALESCE(${input.column_id ?? null},  column_id),
            sort_order = COALESCE(${input.sort_order ?? null}, sort_order),
            updated_at = NOW()
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
