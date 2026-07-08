/**
 * @module drizzle-kanban-cards.repo
 * @description Checklists / Comments / Watchers / Card creation / Accept-Complete
 *   sub-repository — split out of `DrizzleKanbanCoreRepository` to keep
 *   individual files under 300 lines (Rule 16). Public method names preserved;
 *   the parent repo delegates.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - jsonb_build_object() user payload construction inline with LEFT JOIN
 *     for comment listings (avoids N+1 user lookups from frontend).
 *   - COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email, 'Foydalanuvchi')
 *     full-name derivation used across comments projections.
 *   - sql<boolean>`NOT ${column}` toggle expression inside .set() for checklist
 *     item toggle (Drizzle has no native boolean-flip operator).
 */

import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import {
  kanbanChecklists, kanbanChecklistItems,
  kanbanCardComments, kanbanCardWatchers, kanbanNotifications,
} from '@shared/db';
import { safeCall, Err, Ok, Result, AppErr } from '@common/result';
import { castTo } from '@common/db-rows';

@Injectable()
export class DrizzleKanbanCardsRepository {

  // ─── Checklists ───────────────────────────────────────────────────────────

  async getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanChecklists)
      .where(eq(kanbanChecklists.cardId, cardId))
      .orderBy(kanbanChecklists.position));
  }

  async createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(kanbanChecklists).values({ cardId, title }).returning();
      if (!row) return Err('Cheklistni yaratishda xato');
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateChecklist(id: string, title: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklists)
        .set({ title })
        .where(eq(kanbanChecklists.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteChecklist(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(kanbanChecklists).where(eq(kanbanChecklists.id, id)); });
  }

  async getChecklistItems(checklistId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanChecklistItems)
      .where(eq(kanbanChecklistItems.checklistId, checklistId))
      .orderBy(kanbanChecklistItems.position));
  }

  async createChecklistItem(checklistId: string, title: string): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(kanbanChecklistItems).values({ checklistId, title }).returning();
      if (!row) return Err('Checklist elementi yaratishda xato');
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateChecklistItem(
    checklistId: string, itemId: string, title: string, isCompleted: boolean,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklistItems)
        .set({ title, isCompleted })
        .where(and(eq(kanbanChecklistItems.checklistId, checklistId), eq(kanbanChecklistItems.id, itemId)))
        .returning();
      return row ?? { id: itemId };
    });
  }

  async deleteChecklistItem(checklistId: string, itemId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.delete(kanbanChecklistItems)
        .where(and(eq(kanbanChecklistItems.checklistId, checklistId), eq(kanbanChecklistItems.id, itemId)));
    });
  }

  async toggleChecklistItem(itemId: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklistItems)
        .set({ isCompleted: sql<boolean>`NOT ${kanbanChecklistItems.isCompleted}` })
        .where(eq(kanbanChecklistItems.id, itemId))
        .returning();
      return row ?? { id: itemId };
    });
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  async getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          c.id, c.card_id, c.user_id,
          c.content AS message,
          'user'    AS "messageType",
          c.created_at,
          CASE WHEN u.id IS NOT NULL THEN jsonb_build_object(
            'id',              u.id,
            'fullName',        COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email, 'Foydalanuvchi'),
            'profileImageUrl', u.profile_image_url
          ) ELSE NULL END AS "user"
        FROM kanban_card_comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.card_id = ${cardId}
        ORDER BY c.created_at ASC
      `);
      return rows.rows;
    });
  }

  async addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(kanbanCardComments).values({ cardId, userId, content }).returning();
      if (!row) return Err("Izoh qo'shishda xato");
      // Return with user info so the frontend can display immediately without re-fetch
      const userRows = await runQuery<Record<string, unknown>>(sql`
        SELECT id,
          COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email, 'Foydalanuvchi') AS "fullName",
          profile_image_url AS "profileImageUrl"
        FROM users WHERE id = ${userId}
      `);
      return Ok({
        ...row,
        message: content,
        messageType: 'user',
        user: userRows.rows[0] ?? null,
      } as Record<string, unknown>);
    } catch (e) {
      return Err(String(e));
    }
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  async getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanCardWatchers)
      .where(eq(kanbanCardWatchers.cardId, cardId)));
  }

  async addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(kanbanCardWatchers).values({ cardId, userId }).returning();
      if (!row) return Err("Kuzatuvchi qo'shishda xato");
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err(String(e));
    }
  }

  // ─── Card creation (flat endpoint) ────────────────────────────────────────

  async createCardFlat(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const boardId     = String(data.boardId   ?? data.board_id   ?? '');
      const columnId    = String(data.columnId  ?? data.column_id  ?? '');
      const title       = String(data.title     ?? 'Yangi vazifa');
      const description = data.description ? String(data.description) : null;
      const priority    = String(data.priority  ?? 'normal');
      const rawOwner    = data.ownerUserId ?? data.owner_user_id ?? data.assignedTo;
      const ownerId     = rawOwner != null && rawOwner !== '' ? Number(rawOwner) : null;
      // EP-KAN-027: topshiruvchi (assigner)
      const rawAssigner = data.assignerUserId ?? data.assigner_user_id;
      const assignerId  = rawAssigner != null && rawAssigner !== '' ? Number(rawAssigner) : null;
      // Vision #18 / §15 #46: a sub-task spawned from a card's chat message carries its
      // parent link (parent_card_id) + inherited deadline (due_date). The FE
      // (createTaskFromMessage) sends parentCardId/dueDate and the controller schema accepts
      // them, but this INSERT dropped both — the sub-task was silently orphaned (Q-40/Q-43).
      // Normalize ''→null like ownerId above (also keeps due_date out of the '' state that
      // would break the report ::date casts).
      const rawParent     = data.parentCardId ?? data.parent_card_id;
      const parentCardId  = rawParent != null && rawParent !== '' ? Number(rawParent) : null;
      const rawDue        = data.dueDate ?? data.due_date;
      const dueDate       = rawDue != null && rawDue !== '' ? String(rawDue) : null;
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_cards
          (board_id, column_id, title, description, priority, owner_user_id, assigner_user_id, parent_card_id, due_date, sort_order)
        VALUES
          (${boardId}, ${columnId}, ${title}, ${description}, ${priority}, ${ownerId}, ${assignerId}, ${parentCardId}, ${dueDate}, 0)
        RETURNING *
      `);
      if (!rows.rows[0]) return Err('Karta yaratishda xato');
      return Ok(rows.rows[0]);
    } catch (e) {
      return Err(String(e));
    }
  }

  // ─── Accept / Complete ────────────────────────────────────────────────────

  async acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    try {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET accepted_at = NOW(), accepted_by_id = ${String(userId)}, updated_at = NOW()
        WHERE id = ${cardId} AND deleted_at IS NULL
        RETURNING id, title, accepted_at, accepted_by_id, column_id, owner_user_id
      `);
      if (!rows.rows[0]) return Err('Karta topilmadi');
      // Egasiga bildirishnoma
      const card = rows.rows[0];
      if (card.owner_user_id && Number(card.owner_user_id) !== userId) {
        await db.insert(kanbanNotifications).values({
          userId: Number(card.owner_user_id),
          cardId,
          type: 'status_changed',
          title: `"${String(card.title)}" qabul qilindi`,
          message: `Karta ${userId}-foydalanuvchi tomonidan qabul qilindi`,
        });
      }
      return Ok(castTo<Record<string, unknown>>(rows.rows[0]));
    } catch (e) {
      return Err(String(e));
    }
  }

  async completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> {
    try {
      // Assigner-confirm guard (EP-KAN-027): only the assigner (topshiruvchi) may
      // mark a card done. The assignee (owner_user_id) cannot self-complete.
      // Cards with no assigner recorded (legacy/null) stay completable.
      const pre = await runQuery<{ owner_user_id: number | null; assigner_user_id: number | null }>(sql`
        SELECT owner_user_id, assigner_user_id
        FROM kanban_cards WHERE id = ${cardId} AND deleted_at IS NULL LIMIT 1
      `);
      if (!pre.rows[0]) return Err(AppErr('NOT_FOUND', 'Karta topilmadi'));
      const assigner = pre.rows[0].assigner_user_id;
      const owner    = pre.rows[0].owner_user_id;
      if (assigner != null && Number(assigner) !== userId) {
        if (owner != null && Number(owner) === userId) {
          return Err(AppErr(
            'FORBIDDEN',
            "Bajaruvchi vazifani o'zi yakunlay olmaydi — topshiruvchi tasdiqlaydi.",
          ));
        }
        return Err(AppErr('FORBIDDEN', "Faqat topshiruvchi (assigner) vazifani yakunlay oladi."));
      }

      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET completed_at = NOW(),
            completion_report = ${completionReport ?? null},
            updated_at = NOW()
        WHERE id = ${cardId} AND deleted_at IS NULL
        RETURNING id, title, completed_at, column_id, owner_user_id
      `);
      if (!rows.rows[0]) return Err(AppErr('NOT_FOUND', 'Karta topilmadi'));
      const card = rows.rows[0];
      if (card.owner_user_id && Number(card.owner_user_id) !== userId) {
        await db.insert(kanbanNotifications).values({
          userId: Number(card.owner_user_id),
          cardId,
          type: 'status_changed',
          title: `"${String(card.title)}" yakunlandi`,
          message: completionReport ?? 'Karta muvaffaqiyatli yakunlandi',
        });
      }
      return Ok(castTo<Record<string, unknown>>(rows.rows[0]));
    } catch (e) {
      return Err(String(e));
    }
  }
}
