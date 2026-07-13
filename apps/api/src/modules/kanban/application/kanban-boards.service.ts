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
import { runQuery, db, kanbanWipOverrides } from '@shared/db';
import { sql } from 'drizzle-orm';
import { KANBAN_MAX_URGENT_PER_DAY } from '@common/constants/business.constants';

/**
 * WIP (work-in-progress) cap for any column mapped to the JARAYONDA (in-progress)
 * stage. Owner vision (TASDIQ-2146 §15 #8): "Jarayonda"da ko'pi bilan 3 ta vazifa.
 * Named constant per Qoida 12 (no bare magic number for a business rule).
 * Owner decision 2026-07-13 (chat): this is now only the FALLBACK default — used
 * when a column's own `kanban_columns.wip_limit` is unset (NULL). See
 * assertCanMoveTo() below; CRUD via PATCH /kanban/boards/:boardId/columns/:columnId.
 */
const KANBAN_WIP_LIMIT_JARAYONDA = 3;

/**
 * Roles allowed to bypass an at-limit "Jarayonda" column instead of being blocked
 * (owner decision 2026-07-13, chat): the move is allowed and logged to
 * `kanban_wip_overrides` (mirrors qc_override_log's shape/naming — see
 * qc-override.repository.ts / qc-override-log-2026-07-11.sql). Comparison is
 * case-insensitive, same convention as RolesGuard (roles.guard.ts) and the
 * class-level `@Roles('admin', 'manager', 'supervisor', ...)` list on
 * KanbanBoardsController.
 */
const KANBAN_WIP_OVERRIDE_ROLES = ['supervisor'];

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
      // Owner decision 2026-07-13 (chat): per-column WIP-limit override (nullable —
      // unset falls back to KANBAN_WIP_LIMIT_JARAYONDA, see assertCanMoveTo()).
      const rawWipLimit = body.wipLimit ?? body.wip_limit;
      return await this.boardsRepo.addColumn({
        board_id: boardId,
        name: String(body.name || 'Yangi Ustun'),
        sort_order: maxOrder + 1,
        color: body.color != null ? String(body.color) : null,
        wip_limit: rawWipLimit != null ? Number(rawWipLimit) : null,
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
    // Owner decision 2026-07-13 (chat): per-column WIP-limit override (nullable —
    // unset/omitted leaves the column's current value unchanged, repo uses COALESCE).
    const rawWipLimit = body.wipLimit ?? body.wip_limit;
    return this.boardsRepo.updateColumn(boardId, columnId, {
      name: body.name != null ? String(body.name) : null,
      color: body.color != null ? String(body.color) : null,
      sort_order: body.sort_order != null ? Number(body.sort_order) : null,
      wip_limit: rawWipLimit != null ? Number(rawWipLimit) : null,
    });
  }

  deleteColumn(boardId: string, columnId: string): Promise<Result<void>> {
    return this.boardsRepo.deleteColumn(boardId, columnId);
  }

  updateCard(id: string, body: Record<string, unknown>): Promise<Result<KanbanCard>> {
    const str = (v: unknown) => (v != null && v !== '' ? String(v) : null);
    const num = (v: unknown) => (v != null && v !== '' ? Number(v) || null : null);
    const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);

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

    // is_confidential (owner 2026-07-13): kalit body da yo'q bo'lsa o'zgarmaydi (COALESCE);
    // bor bo'lsa (hatto false bo'lsa ham) aynan shu qiymat yoziladi — owner_user_id'dagi
    // NULL-clear sentinel kerak emas, chunki ustun NOT NULL DEFAULT false (bekor qilish = false).
    const confidentialRaw = 'isConfidential' in body ? body.isConfidential
                           : 'is_confidential' in body ? body.is_confidential
                           : undefined;
    const isConfidential: boolean | null = confidentialRaw === undefined ? null : Boolean(confidentialRaw);

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
      // Owner 4-field request (2026-07-13): Tiraj/progress, stansiya-operator, Izoh-belgi.
      progress:             num(body.progress),
      station_operator_id:  num(body.stationOperatorId ?? body.station_operator_id),
      comment_flag:         bool(body.commentFlag ?? body.comment_flag),
      is_confidential:      isConfidential,
    });
  }

  async moveCard(
    id: string,
    body: Record<string, unknown>,
    actingUserId?: number,
    actingUserRole?: string,
  ): Promise<Result<KanbanCard>> {
    const newColumnId = (body.columnId ?? body.column_id) != null
      ? String(body.columnId ?? body.column_id) : null;

    // Eski column_id va board_id ni olish (robot uchun kerak)
    let boardId: string | undefined;
    let ownerUserId: string | null = null;
    let assignerUserId: string | null = null;
    let dueDate: string | null = null;
    let currentColumnId: string | null = null;
    try {
      const rows = await runQuery<{
        board_id: string; owner_user_id: string | null; assigner_user_id: string | null; due_date: string | null; column_id: string | null;
      }>(
        sql`SELECT board_id, owner_user_id, assigner_user_id, due_date, column_id
            FROM kanban_cards WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`,
      );
      boardId         = rows.rows[0]?.board_id;
      ownerUserId     = rows.rows[0]?.owner_user_id ?? null;
      assignerUserId  = rows.rows[0]?.assigner_user_id ?? null;
      dueDate         = rows.rows[0]?.due_date ?? null;
      currentColumnId = rows.rows[0]?.column_id ?? null;
    } catch { /* ignore, robot trigger ixtiyoriy */ }

    // ─── Assigner-confirm guard (EP-KAN-027/032) ───────────────────────────────
    // The board is column-based; a card's stage = its column NAME mapped onto the
    // 4 canonical stages. Moving INTO the terminal "Bajarildi" stage is the
    // CONFIRMATION step and may only be performed by the assigner (topshiruvchi),
    // never by the assignee. The assignee can only move a card to "Tekshiruvda"
    // to request confirmation.
    if (newColumnId) {
      const guard = await this.assertCanMoveTo(newColumnId, {
        cardId: id,
        currentColumnId,
        actingUserId,
        actingUserRole,
        ownerUserId,
        assignerUserId,
        dueDate,
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
   * Enforces two owner-vision move gates:
   *  1. C6 (EP-KAN §15 #6): moving INTO "Jarayonda" requires the card to have
   *     BOTH an executor (owner_user_id) and a deadline (due_date).
   *  2. Assigner-confirm: only the terminal "Bajarildi" (done) confirm is
   *     restricted to the assigner.
   * Reja / Tekshiruvda / unmapped custom columns stay freely movable (Q-39).
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
    ctx: {
      cardId: string;
      currentColumnId: string | null;
      actingUserId?: number;
      actingUserRole?: string;
      ownerUserId: string | null;
      assignerUserId: string | null;
      dueDate: string | null;
    },
  ): Promise<Result<void>> {
    // Resolve destination column NAME (+ its own WIP-limit override) -> canonical stage.
    let destName: string | null = null;
    let destWipLimit: number | null = null;
    try {
      const rows = await runQuery<{ name: string; wip_limit: number | null }>(
        sql`SELECT name, wip_limit FROM kanban_columns WHERE id = ${destColumnId} AND deleted_at IS NULL LIMIT 1`,
      );
      destName = rows.rows[0]?.name ?? null;
      destWipLimit = rows.rows[0]?.wip_limit ?? null;
    } catch { /* if we cannot resolve the column, do not block the move */ }

    const destStatus = statusFromColumnName(destName);

    // ─── C6 guard (EP-KAN §15 #6): entering "Jarayonda" requires ijrochi+muddat ──
    // A card may only be pulled INTO the "Jarayonda" (in-progress) stage once it
    // has BOTH an executor (owner_user_id) and a deadline (due_date). Reja /
    // Tekshiruvda / unmapped custom columns are unaffected (Q-39 non-regression).
    if (destStatus === KanbanStatus.JARAYONDA) {
      const hasOwner = ctx.ownerUserId != null && ctx.ownerUserId !== '';
      const hasDue   = ctx.dueDate != null && ctx.dueDate !== '';
      if (!hasOwner || !hasDue) {
        return Err(AppErr(
          'VALIDATION',
          "\"Jarayonda\"ga o'tkazish uchun ijrochi (owner) va muddat (due_date) to'ldirilishi shart.",
        ));
      }
      // ─── WIP limit guard (TASDIQ-2146 §15 #8) — per-column, default 3 ──────────
      // Owner decision 2026-07-13 (chat): the cap is now per-column
      // (kanban_columns.wip_limit, CRUD via the existing POST/PATCH
      // /kanban/boards/:boardId/columns[/:columnId] endpoints). NULL (unset) falls
      // back to the historical global default KANBAN_WIP_LIMIT_JARAYONDA=3 — every
      // existing board/column keeps behaving exactly as before (additive, Q-46
      // non-regression). A real ENTRY is capped; reordering within the same column
      // is never blocked (Q-39 non-regression). The moving card is excluded from the
      // count. The count query failing must not block the move (fail-open).
      if (String(ctx.currentColumnId) !== String(destColumnId)) {
        const wipLimit = destWipLimit != null ? Number(destWipLimit) : KANBAN_WIP_LIMIT_JARAYONDA;
        try {
          const countRows = await runQuery<{ n: number }>(
            sql`SELECT COUNT(*)::int AS n FROM kanban_cards
                WHERE column_id = ${destColumnId} AND id <> ${ctx.cardId} AND deleted_at IS NULL`,
          );
          const inProgress = Number(countRows.rows[0]?.n ?? 0);
          if (inProgress >= wipLimit) {
            // Owner decision 2026-07-13 (chat): a supervisor-role acting user bypasses
            // the block — the move is allowed and logged to kanban_wip_overrides
            // instead (mirrors qc_override_log's shape/naming convention). Role
            // comparison is case-insensitive, same convention RolesGuard uses
            // (roles.guard.ts).
            const actingRole = ctx.actingUserRole ? ctx.actingUserRole.toLowerCase() : null;
            if (actingRole != null && KANBAN_WIP_OVERRIDE_ROLES.includes(actingRole) && ctx.actingUserId != null) {
              try {
                await db.insert(kanbanWipOverrides).values({
                  cardId: Number(ctx.cardId),
                  columnId: Number(destColumnId),
                  overriddenByUserId: ctx.actingUserId,
                  reason: `WIP limiti (${wipLimit}) supervisor tomonidan oshirib o'tkazildi`,
                });
              } catch (logErr) {
                // Log-write failure must not undo the already-authorized override move.
                this.logger.warn(
                  { method: 'assertCanMoveTo.wipOverride', cardId: ctx.cardId, destColumnId, error: String(logErr) },
                  'kanban_wip_overrides insert failed — move still allowed (fail-open)',
                );
              }
              return { ok: true, data: undefined };
            }
            return Err(AppErr(
              'CONFLICT',
              `"Jarayonda" ustunida bir vaqtda ko'pi bilan ${wipLimit} ta ` +
              `vazifa bo'lishi mumkin. Avval mavjud vazifani yakunlang yoki "Tekshiruvda"ga o'tkazing.`,
            ));
          }
        } catch { /* count failed -> do not block the move (fail-open, non-regression) */ }
      }
      return { ok: true, data: undefined };
    }

    if (destStatus !== KanbanStatus.BAJARILDI) {
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

  /**
   * EP-KAN §15 #29 (C29): kunlik shoshilinch (urgent) kvota tekshiruvi.
   * assigner_user_id bugungi kunda yaratgan 'urgent' kartalar sonini hisoblaydi;
   * KANBAN_MAX_URGENT_PER_DAY ga yetgan bo'lsa 400 (VALIDATION) qaytaradi.
   * Tekshiruv so'rovi xato bersa yaratishni bloklamaydi (non-regress, Q-39).
   */
  private async assertUrgentQuotaAvailable(assignerUserId: number): Promise<Result<void>> {
    try {
      const rows = await runQuery<{ cnt: string }>(sql`
        SELECT COUNT(*)::text AS cnt
        FROM kanban_cards
        WHERE priority = 'urgent'
          AND assigner_user_id = ${assignerUserId}
          AND deleted_at IS NULL
          AND created_at::date = CURRENT_DATE
      `);
      const used = Number(rows.rows[0]?.cnt ?? 0);
      if (used >= KANBAN_MAX_URGENT_PER_DAY) {
        return Err(AppErr(
          'VALIDATION',
          `Bir kunda ko'pi bilan ${KANBAN_MAX_URGENT_PER_DAY} ta "Shoshilinch" vazifa yaratish mumkin (bugun ${used} ta yaratilgan).`,
        ));
      }
      return { ok: true, data: undefined };
    } catch (e) {
      this.logger.warn(
        { method: 'assertUrgentQuotaAvailable', assignerUserId, error: String(e) },
        'urgent quota check failed — allowing create',
      );
      return { ok: true, data: undefined };
    }
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
      const priority = String(body.priority || 'normal');
      // Owner 4-field request (2026-07-13): Tiraj/progress, stansiya-operator, Izoh-belgi.
      const progress = body.progress != null && body.progress !== '' ? Number(body.progress) : null;
      const rawStationOperator = body.stationOperatorId ?? body.station_operator_id;
      const stationOperatorId = rawStationOperator != null && rawStationOperator !== ''
        ? String(rawStationOperator) : null;
      const rawCommentFlag = body.commentFlag ?? body.comment_flag;
      const commentFlag = typeof rawCommentFlag === 'boolean' ? rawCommentFlag : false;
      const rawConfidential = body.isConfidential ?? body.is_confidential;
      const isConfidential = rawConfidential != null ? Boolean(rawConfidential) : null;

      // EP-KAN §15 #29 (C29): kunlik "Shoshilinch" (urgent) limiti. Bir topshiruvchi
      // (assigner) bir kunda ko'pi bilan KANBAN_MAX_URGENT_PER_DAY ta urgent karta
      // yarata oladi; keyingisi rad etiladi. assigner yo'q (legacy/tizim) yoki
      // normal-prioritetli kartalar cheklovga tushmaydi (non-regress, Q-39).
      if (priority === 'urgent' && assignerUserId != null) {
        const quota = await this.assertUrgentQuotaAvailable(Number(assignerUserId));
        if (!quota.ok) return quota as Result<KanbanCard>;
      }

      const result = await this.boardsRepo.addCard({
        board_id: boardId,
        column_id: columnId,
        title: String(body.title || 'Yangi vazifa'),
        description: body.description != null ? String(body.description) : null,
        priority,
        // Normalize ''→null (mirrors updateCard's str() + createCardFlat): an empty-string
        // due_date breaks the report ::date casts (''::date throws). Keep it out of the DB.
        due_date: rawDue != null && rawDue !== '' ? String(rawDue) : null,
        owner_user_id: ownerUserId,
        assigner_user_id: assignerUserId,
        progress,
        station_operator_id: stationOperatorId,
        comment_flag: commentFlag,
        is_confidential: isConfidential,
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
