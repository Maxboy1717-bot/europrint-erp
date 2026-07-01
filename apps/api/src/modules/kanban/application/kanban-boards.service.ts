/**
 * @module kanban-boards.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err, AppErr } from '@common/result';
import { statusFromColumnName, KanbanStatus } from '../domain/kanban-status';
import {
  IKanbanBoardsRepo,
  KANBAN_BOARDS_REPO,
  KanbanBoard,
  KanbanBoardDetail,
  KanbanCard,
  KanbanColumn,
  KanbanViewerContext,
} from '../domain/repositories/i-kanban-boards.repo';
import { KanbanRobotService } from './kanban-robot.service';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class KanbanBoardsService {
  private readonly logger = new Logger(KanbanBoardsService.name);

  constructor(
    @Inject(KANBAN_BOARDS_REPO)
    private readonly boardsRepo: IKanbanBoardsRepo,
    private readonly robotSvc: KanbanRobotService,
  ) {}

  getBoards(): Promise<Result<KanbanBoard[]>> {
    return this.boardsRepo.getBoards();
  }

  getBoardById(boardId: string, viewer?: KanbanViewerContext): Promise<Result<KanbanBoardDetail>> {
    return this.boardsRepo.getBoardById(boardId, viewer);
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
    try {
      const maxOrderResult = await this.boardsRepo.getMaxColumnOrder(boardId);
      const maxOrder = maxOrderResult.ok ? maxOrderResult.data : 0;
      return await this.boardsRepo.addColumn({
        board_id: boardId,
        name: String(body.name || 'Yangi Ustun'),
        sort_order: maxOrder + 1,
        color: body.color != null ? String(body.color) : null,
      });
    } catch (error) {
      this.logger.error(
        { method: 'addColumn', boardId, columnName: body.name, error },
        'Database query failed',
      );
      return Err(`Failed to add column: ${(error as Error).message}`);
    }
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

    // owner_user_id uchun maxsus mantiq:
    // - kalit body da mavjud VA qiymati null/''  → '__CLEAR__' sentinel (DB da NULL ga o'zgartiriladi)
    // - kalit body da mavjud VA qiymati bor     → String(value)
    // - kalit body da umuman yo'q               → null (COALESCE eski qiymatni saqlaydi)
    const ownerRaw = 'ownerUserId' in body ? body.ownerUserId
                   : 'owner_user_id' in body ? body.owner_user_id
                   : undefined;
    const ownerUserId: string | null =
      ownerRaw === undefined
        ? null                         // kalit yo'q → o'zgarmaydi (COALESCE)
        : (ownerRaw == null || ownerRaw === '')
          ? '__CLEAR__'                // null/'' → sentinel → DB da NULL
          : String(ownerRaw);          // qiymat bor → normal string

    return this.boardsRepo.updateCard(id, {
      title:               str(body.title),
      description:         body.description !== undefined ? str(body.description) : null,
      priority:            str(body.priority),
      due_date:            str(body.dueDate ?? body.due_date),
      start_date:          str(body.startDate ?? body.start_date),
      owner_user_id:       ownerUserId,
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

  async moveCard(
    id: string,
    body: Record<string, unknown>,
    actingUserId?: number,
  ): Promise<Result<KanbanCard>> {
    const newColumnId = (body.columnId ?? body.column_id) != null
      ? String(body.columnId ?? body.column_id) : null;

    // Eski column_id va board_id ni olish (robot uchun kerak)
    let boardId: string | undefined;
    let ownerUserId: string | null = null;
    let assignerUserId: string | null = null;
    try {
      const rows = await runQuery<{
        board_id: string; owner_user_id: string | null; assigner_user_id: string | null;
      }>(
        sql`SELECT board_id, owner_user_id, assigner_user_id
            FROM kanban_cards WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`,
      );
      boardId        = rows.rows[0]?.board_id;
      ownerUserId    = rows.rows[0]?.owner_user_id ?? null;
      assignerUserId = rows.rows[0]?.assigner_user_id ?? null;
    } catch { /* ignore, robot trigger ixtiyoriy */ }

    // ─── Assigner-confirm guard (EP-KAN-027/032) ───────────────────────────────
    // The board is column-based; a card's stage = its column NAME mapped onto the
    // 4 canonical stages. Moving INTO the terminal "Bajarildi" stage is the
    // CONFIRMATION step and may only be performed by the assigner (topshiruvchi),
    // never by the assignee. The assignee can only move a card to "Tekshiruvda"
    // to request confirmation.
    if (newColumnId) {
      const guard = await this.assertCanMoveTo(newColumnId, {
        actingUserId,
        ownerUserId,
        assignerUserId,
      });
      if (!guard.ok) return guard as Result<KanbanCard>;
    }

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

  /**
   * Enforces the assigner-confirm rule when a card is moved.
   * Only the terminal "Bajarildi" (done) stage is restricted; all other moves
   * (reja/jarayonda/tekshiruvda and any unmapped custom column) are allowed for
   * any permitted user — non-regressive (Q-39).
   *
   * Rule (EP-KAN-027/032): moving INTO a "Bajarildi" column is the CONFIRMATION
   * step. It may only be done by the assigner (assigner_user_id). The assignee
   * (owner_user_id) is explicitly forbidden from self-confirming and must move
   * the card to "Tekshiruvda" instead. Cards with NO assigner recorded
   * (legacy/null) remain freely movable to avoid blocking existing rows.
   *
   * @param destColumnId destination column id
   * @param ctx acting user + card's owner/assigner ids (strings from DB)
   * @returns Ok(void) when allowed, Err(FORBIDDEN) -> HTTP 403 when blocked
   */
  private async assertCanMoveTo(
    destColumnId: string,
    ctx: { actingUserId?: number; ownerUserId: string | null; assignerUserId: string | null },
  ): Promise<Result<void>> {
    // Resolve destination column NAME -> canonical stage.
    let destName: string | null = null;
    try {
      const rows = await runQuery<{ name: string }>(
        sql`SELECT name FROM kanban_columns WHERE id = ${destColumnId} AND deleted_at IS NULL LIMIT 1`,
      );
      destName = rows.rows[0]?.name ?? null;
    } catch { /* if we cannot resolve the column, do not block the move */ }

    if (statusFromColumnName(destName) !== KanbanStatus.BAJARILDI) {
      return { ok: true, data: undefined };
    }

    // Terminal "Bajarildi": only the assigner may confirm.
    const assigner = ctx.assignerUserId != null ? Number(ctx.assignerUserId) : null;
    const owner    = ctx.ownerUserId != null ? Number(ctx.ownerUserId) : null;
    const acting   = ctx.actingUserId ?? null;

    // No assigner recorded -> legacy card, keep movable (non-regression).
    if (assigner == null) return { ok: true, data: undefined };

    // Acting user is the assigner -> this is a valid confirmation.
    if (acting != null && acting === assigner) return { ok: true, data: undefined };

    // Acting user is the assignee trying to self-confirm -> forbidden.
    if (acting != null && owner != null && acting === owner) {
      return Err(AppErr(
        'FORBIDDEN',
        "Bajaruvchi vazifani o'zi \"Bajarildi\"ga o'tkaza olmaydi. " +
        "Avval \"Tekshiruvda\"ga o'tkazing — topshiruvchi tasdiqlaydi.",
      ));
    }

    // Any other (non-assigner) user moving to done -> forbidden.
    return Err(AppErr(
      'FORBIDDEN',
      "Faqat topshiruvchi (assigner) vazifani \"Bajarildi\"ga o'tkaza oladi.",
    ));
  }

  async addCard(
    boardId: string,
    body: Record<string, unknown>,
    creatorUserId?: number,
  ): Promise<Result<KanbanCard>> {
    try {
      const rawCol   = body.columnId ?? body.column_id;
      const columnId = rawCol != null ? String(rawCol) : null;
      const rawOwner = body.ownerUserId ?? body.owner_user_id;
      const ownerUserId = rawOwner != null ? String(rawOwner) : null;
      const rawDue   = body.dueDate ?? body.due_date;
      // EP-KAN-027: assigner = explicit body value, else the creating user.
      const rawAssigner = body.assignerUserId ?? body.assigner_user_id;
      const assignerUserId = rawAssigner != null
        ? String(rawAssigner)
        : (creatorUserId != null ? String(creatorUserId) : null);

      const result = await this.boardsRepo.addCard({
        board_id: boardId,
        column_id: columnId,
        title: String(body.title || 'Yangi vazifa'),
        description: body.description != null ? String(body.description) : null,
        priority: String(body.priority || 'normal'),
        due_date: rawDue != null ? String(rawDue) : null,
        owner_user_id: ownerUserId,
        assigner_user_id: assignerUserId,
      });

      if (result.ok && columnId && result.data?.id) {
        this.robotSvc.onCardCreated({ cardId: result.data.id, boardId, columnId, ownerUserId }).catch(() => {});
      }
      return result;
    } catch (error) {
      this.logger.error(
        { method: 'addCard', boardId, title: body.title, error },
        'Database query failed',
      );
      return Err(`Failed to add card: ${(error as Error).message}`);
    }
  }

  deleteCard(id: string): Promise<Result<void>> {
    return this.boardsRepo.deleteCard(id);
  }
}
