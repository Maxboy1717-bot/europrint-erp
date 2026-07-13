/**
 * @module kanban-cards.repo
 * @description Repository / data-access layer for Kanban cards. Wraps Drizzle ORM queries; returns Result<T>.
 *              Extracted from kanban-boards.repo as part of Rule 13/16 split (card concerns,
 *              plus the sales-order side-effect helpers createKanbanForOrder /
 *              moveOrderCardToCancelled which act on cards within a board).
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { and, asc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { execKanbanCardSoftDelete } from '@common/database/queries-kanban';
import { Result, Ok, Err } from '@common/result';
import {
  CreateCardInput,
  CreateKanbanForOrderInput,
  KanbanCard,
  MoveCardInput,
  UpdateCardInput,
} from '../../domain/repositories/i-kanban-boards.repo';
import { kanbanBoards, kanbanColumns, kanbanCards, kanbanStatusColumnMap } from '../kanban-tables';

@Injectable()
export class KanbanCardsRepository {
  private readonly logger = new Logger(KanbanCardsRepository.name);

  async addCard(input: CreateCardInput): Promise<Result<KanbanCard>> {
    try {
      // sort_order: ustundagi MAX + 1 — har doim oxirga qo'shiladi
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_cards (board_id, column_id, title, description, priority, due_date, owner_user_id, assigner_user_id, progress, station_operator_id, comment_flag, sort_order, is_confidential)
        VALUES (
          ${input.board_id}, ${input.column_id}, ${input.title}, ${input.description},
          ${input.priority}, ${input.due_date}, ${input.owner_user_id}, ${input.assigner_user_id},
          ${input.progress}, ${input.station_operator_id}, ${input.comment_flag},
          COALESCE(
            (SELECT MAX(sort_order) FROM kanban_cards
             WHERE column_id = ${input.column_id} AND deleted_at IS NULL),
            -1
          ) + 1,
          ${input.is_confidential ?? false}
        )
        RETURNING *
      `);
      const row = rows.rows[0];
      if (!row) return Err({ message: 'Card yaratilmadi', code: 'DB_ERROR' });
      return Ok(castTo<KanbanCard>(row));
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
          owner_user_id       = CASE
                                  WHEN ${input.owner_user_id} = '__CLEAR__' THEN NULL
                                  WHEN ${input.owner_user_id} IS NOT NULL    THEN ${input.owner_user_id}::integer
                                  ELSE owner_user_id
                                END,
          estimated_time      = COALESCE(${input.estimated_time ?? null},       estimated_time),
          parent_card_id      = COALESCE(${input.parent_card_id ?? null},       parent_card_id),
          project_id          = COALESCE(${input.project_id ?? null},           project_id),
          related_type        = COALESCE(${input.related_type ?? null},         related_type),
          related_id          = COALESCE(${input.related_id ?? null},           related_id),
          recurrence_pattern  = COALESCE(${input.recurrence_pattern ?? null},   recurrence_pattern),
          recurrence_end_date = COALESCE(${input.recurrence_end_date ?? null},  recurrence_end_date),
          progress             = COALESCE(${input.progress ?? null},             progress),
          station_operator_id  = COALESCE(${input.station_operator_id ?? null},  station_operator_id),
          comment_flag         = COALESCE(${input.comment_flag ?? null},         comment_flag),
          is_confidential      = COALESCE(${input.is_confidential ?? null},      is_confidential),
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

  /**
   * Atomically locates a sales board (`type='sales'` or fuzzy name match on
   * 'buyurtma' / 'order' / 'sotuv'), then its first (inbox) column, then
   * inserts a kanban card describing the freshly created sales order.
   *
   * If no board or column exists, the method returns Ok(void) — kanban is a
   * side-effect of order creation and must not block it.
   */
  async createKanbanForOrder(input: CreateKanbanForOrderInput): Promise<Result<void>> {
    try {
      const cardTitle = `\u{1F4E6} ${input.orderNumber}`;
      const description =
        `Buyurtma summasi: ${input.totalAmount.toLocaleString('uz-UZ')} so'm\n` +
        `Kompaniya ID: ${input.companyId}`;

      const outcome = await db.transaction(async (tx) => {
        const boardRows = await tx
          .select({ id: kanbanBoards.id })
          .from(kanbanBoards)
          .where(
            and(
              isNull(kanbanBoards.deleted_at),
              or(
                eq(kanbanBoards.type, 'sales'),
                ilike(kanbanBoards.name, '%buyurtma%'),
                ilike(kanbanBoards.name, '%order%'),
                ilike(kanbanBoards.name, '%sotuv%'),
              ),
            ),
          )
          .orderBy(asc(kanbanBoards.created_at))
          .limit(1);

        const boardId = boardRows[0]?.id;
        if (!boardId) return { ok: false as const, reason: 'no-board' };

        const colRows = await tx
          .select({ id: kanbanColumns.id })
          .from(kanbanColumns)
          .where(and(eq(kanbanColumns.board_id, boardId), isNull(kanbanColumns.deleted_at)))
          .orderBy(asc(kanbanColumns.sort_order))
          .limit(1);

        const columnId = colRows[0]?.id;
        if (!columnId) return { ok: false as const, reason: 'no-column', boardId };

        await tx.insert(kanbanCards).values({
          board_id:     boardId,
          column_id:    columnId,
          title:        cardTitle,
          description,
          priority:     'normal',
          related_type: 'sales_order',
          related_id:   String(input.orderId),
          sort_order:   0,
        });

        return { ok: true as const, boardId, columnId };
      });

      if (!outcome.ok) {
        if (outcome.reason === 'no-board') {
          this.logger.warn(
            `createKanbanForOrder: Savdo board'i topilmadi. ` +
            `Yangi board yaratish uchun type='sales' qilib board oching. ` +
            `orderId=${input.orderId}`,
          );
        } else {
          this.logger.warn(
            `createKanbanForOrder: Board ${outcome.boardId} da ustun topilmadi. orderId=${input.orderId}`,
          );
        }
        return Ok(undefined);
      }

      this.logger.log(
        `createKanbanForOrder: Karta yaratildi — ` +
        `orderId=${input.orderId}, boardId=${outcome.boardId}, columnId=${outcome.columnId}`,
      );
      return Ok(undefined);
    } catch (error) {
      this.logger.error('createKanbanForOrder: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Atomically moves every kanban card tied to `orderId` into its board's
   * "bekor"/"cancel" column (if present), appending a cancellation note to the
   * description. If no such column exists for a card's board the card is
   * soft-deleted instead.
   */
  async moveOrderCardToCancelled(orderId: number, orderNumber: string): Promise<Result<void>> {
    try {
      const cancelNote = `\n[Bekor qilindi: ${orderNumber}]`;
      const orderIdText = String(orderId);

      const moved = await db.transaction(async (tx) => {
        // Find all cards linked to this order (across any board).
        const linkedCards = await tx
          .select({ id: kanbanCards.id, board_id: kanbanCards.board_id })
          .from(kanbanCards)
          .where(
            and(
              eq(kanbanCards.related_type, 'sales_order'),
              eq(kanbanCards.related_id, orderIdText),
              isNull(kanbanCards.deleted_at),
            ),
          );

        if (linkedCards.length === 0) return { moved: 0, softDeleted: 0 };

        // Look up the "bekor"/"cancel" column for each unique board.
        const uniqueBoardIds = Array.from(new Set(linkedCards.map((c) => c.board_id)));
        const cancelColByBoard = new Map<number, number>();

        for (const boardId of uniqueBoardIds) {
          const cancelCols = await tx
            .select({ id: kanbanColumns.id })
            .from(kanbanColumns)
            .where(
              and(
                eq(kanbanColumns.board_id, boardId),
                isNull(kanbanColumns.deleted_at),
                or(ilike(kanbanColumns.name, '%bekor%'), ilike(kanbanColumns.name, '%cancel%')),
              ),
            )
            .orderBy(asc(kanbanColumns.created_at))
            .limit(1);

          const cancelColId = cancelCols[0]?.id;
          if (cancelColId) cancelColByBoard.set(boardId, cancelColId);
        }

        let moved = 0;
        let softDeleted = 0;

        for (const card of linkedCards) {
          const cancelColId = cancelColByBoard.get(card.board_id);
          if (cancelColId) {
            await tx
              .update(kanbanCards)
              .set({
                column_id:   cancelColId,
                description: sql`COALESCE(${kanbanCards.description}, '') || ${cancelNote}`,
                updated_at:  sql`NOW()`,
              })
              .where(eq(kanbanCards.id, card.id));
            moved += 1;
          } else {
            await tx
              .update(kanbanCards)
              .set({ deleted_at: sql`NOW()`, updated_at: sql`NOW()` })
              .where(eq(kanbanCards.id, card.id));
            softDeleted += 1;
          }
        }

        return { moved, softDeleted };
      });

      this.logger.log(
        `moveOrderCardToCancelled: orderId=${orderId} ` +
        `moved=${moved.moved}, soft-deleted=${moved.softDeleted}`,
      );
      return Ok(undefined);
    } catch (error) {
      this.logger.error('moveOrderCardToCancelled: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Golden-thread sync (§15 #127 / vision #22): when a sales order's status
   * changes, append a dated status note to every kanban card linked to that
   * order so the transition is visible/auditable on the card. Mirrors the
   * note-append half of {@link moveOrderCardToCancelled} (find by
   * related_type='sales_order' + related_id, `COALESCE(description,'') || note`)
   * but deliberately does NOT change column/stage — the status→column mapping is
   * an owner policy decision (Guruh-B). Best-effort: when no card is linked to
   * the order the UPDATE matches nothing and this is a no-op that still returns
   * Ok(void), so a sync miss can never break the SD status change.
   */
  async appendOrderStatusNote(
    orderId: number,
    oldStatus: string,
    newStatus: string,
  ): Promise<Result<void>> {
    try {
      // related_id is stored as text (createKanbanForOrder inserts String(orderId));
      // mirror moveOrderCardToCancelled's String(orderId) binding.
      const orderIdText = String(orderId);
      const note = `\n[${new Date().toISOString()}] Buyurtma holati: ${oldStatus} -> ${newStatus}`;

      const res = await runQuery<{ id: number }>(sql`
        UPDATE kanban_cards
        SET description = COALESCE(description, '') || ${note},
            updated_at  = NOW()
        WHERE related_type = 'sales_order'
          AND related_id   = ${orderIdText}
          AND deleted_at IS NULL
        RETURNING id
      `);

      const rows = Array.isArray(res.rows) ? res.rows : [];
      this.logger.log(
        `appendOrderStatusNote: orderId=${orderId} ${oldStatus}->${newStatus} cards=${rows.length}`,
      );
      return Ok(undefined);
    } catch (error) {
      this.logger.error('appendOrderStatusNote: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * SD status → Kanban column auto-move (owner-decisions batch item 4, Guruh-B).
   * INERT until the owner seeds `kanban_status_column_map`: this reads the mapping
   * rule for `newStatus` and, if one exists, moves every linked sales_order card to
   * the mapped column. With ZERO map rows (ships empty) this is a pure no-op that
   * returns Ok(void), so the status→column policy stays off until the owner enables
   * it. This is a SEPARATE mechanism from {@link appendOrderStatusNote} (which only
   * appends a note and must stay column-agnostic) — the two run side by side.
   *
   * Move guard: a card is moved ONLY when the mapped column lives on the card's own
   * board AND is a different column than the card currently sits in. sort_order is
   * placed at MAX+1 of the target column (appended last). Mirrors
   * {@link moveOrderCardToCancelled}'s transaction/style and its String(orderId)
   * binding for the drifted-to-varchar `related_id` (integer live). Best-effort:
   * any failure returns Err (never throws) so a move miss can't break the SD status
   * change.
   */
  async moveOrderCardByStatusMap(orderId: number, newStatus: string): Promise<Result<void>> {
    try {
      const orderIdText = String(orderId);

      const outcome = await db.transaction(async (tx) => {
        // 1. Owner-policy lookup: is there a mapping rule for this SD status?
        const mapRows = await tx
          .select({ kanban_column_id: kanbanStatusColumnMap.kanbanColumnId })
          .from(kanbanStatusColumnMap)
          .where(eq(kanbanStatusColumnMap.sdStatus, newStatus))
          .limit(1);

        const mappedColumnId = mapRows[0]?.kanban_column_id;
        // INERT: no rule for this status → no-op (this is the ships-empty default).
        if (mappedColumnId == null) return { mapped: false as const, moved: 0 };

        // 2. Resolve the mapped column's board (move stays within the card's board).
        const mappedColRows = await tx
          .select({ id: kanbanColumns.id, board_id: kanbanColumns.board_id })
          .from(kanbanColumns)
          .where(and(eq(kanbanColumns.id, mappedColumnId), isNull(kanbanColumns.deleted_at)))
          .limit(1);

        const mappedColBoardId = mappedColRows[0]?.board_id;
        if (mappedColBoardId == null) return { mapped: true as const, moved: 0 };

        // 3. Find all cards linked to this order (mirror moveOrderCardToCancelled's
        //    related_type + String(orderId) binding).
        const linkedCards = await tx
          .select({
            id:        kanbanCards.id,
            board_id:  kanbanCards.board_id,
            column_id: kanbanCards.column_id,
          })
          .from(kanbanCards)
          .where(
            and(
              eq(kanbanCards.related_type, 'sales_order'),
              eq(kanbanCards.related_id, orderIdText),
              isNull(kanbanCards.deleted_at),
            ),
          );

        let moved = 0;
        for (const card of linkedCards) {
          // Move ONLY within the same board and only when it actually changes column.
          if (card.board_id !== mappedColBoardId) continue;
          if (card.column_id === mappedColumnId) continue;

          // sort_order = MAX(sort_order)+1 in the target column (append at the end).
          const maxRows = await tx
            .select({ max_order: sql<number>`COALESCE(MAX(${kanbanCards.sort_order}), -1)` })
            .from(kanbanCards)
            .where(and(eq(kanbanCards.column_id, mappedColumnId), isNull(kanbanCards.deleted_at)));
          const nextOrder = Number(maxRows[0]?.max_order ?? -1) + 1;

          await tx
            .update(kanbanCards)
            .set({ column_id: mappedColumnId, sort_order: nextOrder, updated_at: sql`NOW()` })
            .where(eq(kanbanCards.id, card.id));
          moved += 1;
        }

        return { mapped: true as const, moved };
      });

      this.logger.log(
        `moveOrderCardByStatusMap: orderId=${orderId} status=${newStatus} ` +
        `mapped=${outcome.mapped} moved=${outcome.moved}`,
      );
      return Ok(undefined);
    } catch (error) {
      this.logger.error('moveOrderCardByStatusMap: ' + (error as Error).message);
      return Err({ message: (error as Error).message, code: 'DB_ERROR' });
    }
  }
}
