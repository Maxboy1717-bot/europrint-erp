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
  KanbanViewerContext,
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
import { hasFullKanbanVisibility, kanbanCardVisibilityPredicate } from '../kanban-visibility.helper';

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

  async getBoardById(boardId: string, viewer?: KanbanViewerContext): Promise<Result<KanbanBoardDetail>> {
    try {
      const boardRows = await runQuery<Record<string, unknown>>(sql`
        SELECT id, name, type, description, created_at, updated_at
        FROM kanban_boards WHERE id = ${boardId} AND deleted_at IS NULL
      `);
      const board = boardRows.rows[0];
      if (!board) return Err({ message: `Board ${boardId} topilmadi`, code: 'NOT_FOUND' });

      // Org-sxema bo'yicha karta ko'rinishi (M0) — super_admin/director butun
      // boardni ko'radi; qolganlar faqat kanbanCardVisibilityPredicate doirasida.
      const visible = viewer && !hasFullKanbanVisibility(viewer.role)
        ? kanbanCardVisibilityPredicate(Number(viewer.id))
        : sql`TRUE`;

      const [columnsRows, cardsRows] = await Promise.all([
        db.execute<Record<string, unknown>>(sql`
          SELECT id, board_id, name, sort_order, color, created_at
          FROM kanban_columns WHERE board_id = ${boardId} AND deleted_at IS NULL ORDER BY sort_order ASC
        `),
        db.execute<Record<string, unknown>>(sql`
          SELECT kc.id, kc.board_id, kc.column_id, kc.title, kc.description, kc.priority, kc.due_date,
                 kc.sort_order, kc.owner_user_id, kc.related_type, kc.related_id, kc.related_ref, kc.source,
                 kc.start_date, kc.estimated_time, kc.accepted_at, kc.completed_at,
                 kc.rating, kc.completion_report,
                 kc.created_at, kc.updated_at,
                 (SELECT row_to_json(t) FROM kanban_time_tracks t
                  WHERE t.card_id = kc.id::text AND t.is_running = true
                  LIMIT 1) AS active_time_track,
                 (SELECT COALESCE(SUM(t.duration_minutes), 0)
                  FROM kanban_time_tracks t
                  WHERE t.card_id = kc.id::text AND t.is_running = false
                 ) AS total_tracked_time,
                 (SELECT COUNT(*)::int FROM kanban_checklists cl
                  WHERE cl.card_id = kc.id::text
                 ) AS subtasks_count,
                 (SELECT COUNT(*)::int FROM kanban_checklists cl
                  JOIN kanban_checklist_items ci ON ci.checklist_id = cl.id::text
                  WHERE cl.card_id = kc.id::text AND ci.is_completed = true
                 ) AS subtasks_completed,
                 (SELECT COUNT(*)::int FROM kanban_card_comments cc
                  WHERE cc.card_id = kc.id::text
                 ) AS comments_count,
                 (SELECT COUNT(*)::int FROM kanban_files kf
                  WHERE kf.card_id = kc.id::text AND kf.deleted_at IS NULL
                 ) AS files_count
          FROM kanban_cards kc
          WHERE kc.board_id = ${boardId} AND kc.deleted_at IS NULL AND ${visible}
          ORDER BY kc.sort_order ASC
        `),
      ]);

      // Map DB snake_case counter columns to the camelCase names the FE expects
      const cards = (cardsRows.rows as Record<string, unknown>[]).map((row) => ({
        ...row,
        subtasksCount:     row['subtasks_count']     ?? 0,
        subtasksCompleted: row['subtasks_completed']  ?? 0,
        commentsCount:     row['comments_count']      ?? 0,
        filesCount:        row['files_count']         ?? 0,
      }));
      return Ok({ ...(castTo<KanbanBoard>(board)), columns: castTo<KanbanColumn[]>(columnsRows.rows), cards: castTo<KanbanCard[]>(cards)});
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
