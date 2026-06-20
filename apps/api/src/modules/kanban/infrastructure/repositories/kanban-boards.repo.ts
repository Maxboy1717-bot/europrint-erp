/**
 * @module kanban-boards.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *              Umbrella facade implementing {@link IKanbanBoardsRepo}: board-level methods
 *              are handled inline; column and card concerns delegate to dedicated
 *              {@link KanbanColumnsRepository} and {@link KanbanCardsRepository}.
 *              Split out as part of Rule 13/16 (file size + single concern).
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
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
  CreateKanbanForOrderInput,
  MoveCardInput,
  UpdateCardInput,
  UpdateColumnInput,
} from '../../domain/repositories/i-kanban-boards.repo';
import { kanbanBoards } from '../kanban-tables';
import { KanbanColumnsRepository } from './kanban-columns.repo';
import { KanbanCardsRepository } from './kanban-cards.repo';

@Injectable()
export class KanbanBoardsRepository implements IKanbanBoardsRepo {
  private readonly logger = new Logger(KanbanBoardsRepository.name);

  constructor(
    private readonly columnsRepo: KanbanColumnsRepository,
    private readonly cardsRepo:   KanbanCardsRepository,
  ) {}

  async getBoards(): Promise<Result<KanbanBoard[]>> {
    try {
      const rows = await db
        .select({
          id:          kanbanBoards.id,
          name:        kanbanBoards.name,
          type:        kanbanBoards.type,
          description: kanbanBoards.description,
          created_at:  kanbanBoards.created_at,
          updated_at:  kanbanBoards.updated_at,
        })
        .from(kanbanBoards)
        .where(isNull(kanbanBoards.deleted_at))
        .orderBy(desc(kanbanBoards.created_at));
      return Ok(castTo<KanbanBoard[]>(rows));
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
                 rating, completion_report,
                 created_at, updated_at,
                 (SELECT row_to_json(t) FROM kanban_time_tracks t
                  WHERE t.card_id = kanban_cards.id::text AND t.is_running = true
                  LIMIT 1) AS active_time_track,
                 (SELECT COALESCE(SUM(t.duration_minutes), 0)
                  FROM kanban_time_tracks t
                  WHERE t.card_id = kanban_cards.id::text AND t.is_running = false
                 ) AS total_tracked_time
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
      const rows = await db
        .insert(kanbanBoards)
        .values({
          name:        input.name,
          type:        input.type,
          description: input.description,
        })
        .returning();
      const row = rows[0];
      if (!row) return Err({ message: 'Board yaratilmadi', code: 'DB_ERROR' });
      return Ok(castTo<KanbanBoard>(row));
    } catch (error) {
      this.logger.error('createBoard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  async deleteBoard(boardId: string): Promise<Result<void>> {
    try {
      await db
        .update(kanbanBoards)
        .set({ deleted_at: sql`NOW()` })
        .where(and(eq(kanbanBoards.id, Number(boardId)), isNull(kanbanBoards.deleted_at)));
      return Ok(undefined);
    } catch (error) {
      this.logger.error('deleteBoard: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  // ── Column concerns — delegated to KanbanColumnsRepository ──────────────────
  getMaxColumnOrder(boardId: string): Promise<Result<number>> {
    return this.columnsRepo.getMaxColumnOrder(boardId);
  }
  addColumn(input: CreateColumnInput): Promise<Result<KanbanColumn>> {
    return this.columnsRepo.addColumn(input);
  }
  updateColumn(boardId: string, columnId: string, input: UpdateColumnInput): Promise<Result<KanbanColumn>> {
    return this.columnsRepo.updateColumn(boardId, columnId, input);
  }
  deleteColumn(boardId: string, columnId: string): Promise<Result<void>> {
    return this.columnsRepo.deleteColumn(boardId, columnId);
  }

  // ── Card concerns — delegated to KanbanCardsRepository ──────────────────────
  addCard(input: CreateCardInput): Promise<Result<KanbanCard>> {
    return this.cardsRepo.addCard(input);
  }
  updateCard(id: string, input: UpdateCardInput): Promise<Result<KanbanCard>> {
    return this.cardsRepo.updateCard(id, input);
  }
  moveCard(id: string, input: MoveCardInput): Promise<Result<KanbanCard>> {
    return this.cardsRepo.moveCard(id, input);
  }
  deleteCard(id: string): Promise<Result<void>> {
    return this.cardsRepo.deleteCard(id);
  }
  createKanbanForOrder(input: CreateKanbanForOrderInput): Promise<Result<void>> {
    return this.cardsRepo.createKanbanForOrder(input);
  }
  moveOrderCardToCancelled(orderId: number, orderNumber: string): Promise<Result<void>> {
    return this.cardsRepo.moveOrderCardToCancelled(orderId, orderNumber);
  }
}
