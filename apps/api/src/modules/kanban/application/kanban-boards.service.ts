/**
 * @module kanban-boards.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
  KanbanBoard,
  KanbanBoardDetail,
  KanbanCard,
  KanbanColumn,
} from '../domain/repositories/i-kanban-boards.repo';
import { KanbanRobotService } from './kanban-robot.service';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class KanbanBoardsService {
  constructor(
    @Inject(KANBAN_BOARDS_REPO)
    private readonly boardsRepo: IKanbanBoardsRepo,
    private readonly robotSvc: KanbanRobotService,
  ) {}

  getBoards(): Promise<Result<KanbanBoard[]>> {
    return this.boardsRepo.getBoards();
  }

  getBoardById(boardId: string): Promise<Result<KanbanBoardDetail>> {
    return this.boardsRepo.getBoardById(boardId);
  }

  createBoard(body: Record<string, unknown>): Promise<Result<KanbanBoard>> {
    return this.boardsRepo.createBoard({
      name: String(body.name || 'Yangi Doska'),
      type: String(body.type || 'custom'),
      description: body.description != null ? String(body.description) : null,
    });
  }

  deleteBoard(boardId: string): Promise<Result<void>> {
    return this.boardsRepo.deleteBoard(boardId);
  }

  async addColumn(boardId: string, body: Record<string, unknown>): Promise<Result<KanbanColumn>> {
    const maxOrderResult = await this.boardsRepo.getMaxColumnOrder(boardId);
    const maxOrder = maxOrderResult.ok ? maxOrderResult.data : 0;
    return this.boardsRepo.addColumn({
      board_id: boardId,
      name: String(body.name || 'Yangi Ustun'),
      sort_order: maxOrder + 1,
      color: body.color != null ? String(body.color) : null,
    });
  }

  updateColumn(boardId: string, columnId: string, body: Record<string, unknown>): Promise<Result<KanbanColumn>> {
    return this.boardsRepo.updateColumn(boardId, columnId, {
      name: body.name != null ? String(body.name) : null,
      color: body.color != null ? String(body.color) : null,
      sort_order: body.sort_order != null ? Number(body.sort_order) : null,
    });
  }

  deleteColumn(boardId: string, columnId: string): Promise<Result<void>> {
    return this.boardsRepo.deleteColumn(boardId, columnId);
  }

  updateCard(id: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    const str = (v: unknown) => (v != null && v !== '' ? String(v) : null);
    const num = (v: unknown) => (v != null && v !== '' ? Number(v) || null : null);
    return this.boardsRepo.updateCard(id, {
      title:               str(body.title),
      description:         body.description !== undefined ? str(body.description) : null,
      priority:            str(body.priority),
      due_date:            str(body.dueDate ?? body.due_date),
      start_date:          str(body.startDate ?? body.start_date),
      owner_user_id:       str(body.ownerUserId ?? body.owner_user_id),
      estimated_time:      num(body.estimatedTime ?? body.estimated_time),
      parent_card_id:      num(body.parentCardId ?? body.parent_card_id),
      project_id:          num(body.projectId ?? body.project_id),
      related_type:        str(body.relatedType ?? body.related_type),
      related_id:          num(body.relatedId ?? body.related_id),
      recurrence_pattern:  str(body.recurrencePattern ?? body.recurrence_pattern),
      recurrence_interval: num(body.recurrenceInterval ?? body.recurrence_interval),
      recurrence_end_date: str(body.recurrenceEndDate ?? body.recurrence_end_date),
    });
  }

  async moveCard(id: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    const newColumnId = (body.columnId ?? body.column_id) != null
      ? String(body.columnId ?? body.column_id) : null;

    // Eski column_id va board_id ni olish (robot uchun kerak)
    let boardId: string | undefined;
    let ownerUserId: string | null = null;
    try {
      const rows = await runQuery<{ board_id: string; owner_user_id: string | null }>(
        sql`SELECT board_id, owner_user_id FROM kanban_cards WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`,
      );
      boardId      = rows.rows[0]?.board_id;
      ownerUserId  = rows.rows[0]?.owner_user_id ?? null;
    } catch { /* ignore, robot trigger ixtiyoriy */ }

    const result = await this.boardsRepo.moveCard(id, {
      column_id:  newColumnId,
      sort_order: (body.sortOrder ?? body.sort_order) != null ? Number(body.sortOrder ?? body.sort_order) : null,
    });

    // Robot trigger (card_moved)
    if (result.ok && boardId && newColumnId) {
      this.robotSvc.onCardMoved({
        cardId: id, boardId, newColumnId, ownerUserId,
      }).catch(() => {/* silent */});
    }
    return result;
  }

  async addCard(boardId: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    const rawCol   = body.columnId ?? body.column_id;
    const columnId = rawCol != null ? String(rawCol) : null;
    const rawOwner = body.ownerUserId ?? body.owner_user_id;
    const ownerUserId = rawOwner != null ? String(rawOwner) : null;
    const rawDue   = body.dueDate ?? body.due_date;

    const result = await this.boardsRepo.addCard({
      board_id: boardId,
      column_id: columnId,
      title: String(body.title || 'Yangi vazifa'),
      description: body.description != null ? String(body.description) : null,
      priority: String(body.priority || 'normal'),
      due_date: rawDue != null ? String(rawDue) : null,
      owner_user_id: ownerUserId,
    });

    if (result.ok && columnId) {
      this.robotSvc.onCardCreated({ cardId: result.data.id!, boardId, columnId, ownerUserId }).catch(() => {});
    }
    return result;
  }

  deleteCard(id: string): Promise<Result<void>> {
    return this.boardsRepo.deleteCard(id);
  }
}
