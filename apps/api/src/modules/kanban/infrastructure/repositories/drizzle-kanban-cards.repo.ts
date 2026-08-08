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
 */

import { Injectable } from '@nestjs/common';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import {
  kanbanChecklists, kanbanChecklistItems,
  kanbanCardComments, kanbanCardWatchers, kanbanNotifications,
} from '@shared/db';
import { safeCall, Err, Ok, Result, AppErr } from '@common/result';
import { castTo } from '@common/db-rows';
import { KANBAN_MAX_URGENT_PER_DAY } from '@common/constants/business.constants';

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
      // Vision §15 #16 (cascade-freeze): checklist items are an ORDERED chain, so each
      // new item takes the next sequential position. The create endpoint carries no
      // position, so without this every item defaulted to 0 and the ordering/freeze
      // logic in toggleChecklistItem below would have nothing to order by.
      const [maxRow] = await db
        .select({ maxPos: sql<number>`COALESCE(MAX(${kanbanChecklistItems.position}), -1)` })
        .from(kanbanChecklistItems)
        .where(eq(kanbanChecklistItems.checklistId, checklistId));
      const nextPos = Number(maxRow?.maxPos ?? -1) + 1;
      const [row] = await db.insert(kanbanChecklistItems)
        .values({ checklistId, title, position: nextPos }).returning();
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
    try {
      // Vision §15 #16 — cascade-freeze. Checklist items form an ordered process
      // chain. Two coupled rules, applied atomically:
      //   • toggle-to-complete: blocked while any EARLIER-position item is still
      //     incomplete (a later step cannot close before an earlier one).
      //   • toggle-to-reopen (step N): every LATER step (position > N) is re-locked
      //     to is_completed=false (cascade-freeze); they only re-open once N is
      //     completed again.
      // FOR UPDATE on the target row serialises concurrent toggles of the same item.
      const outcome = await db.transaction(async (tx) => {
        const cur = await tx
          .select({
            checklistId: kanbanChecklistItems.checklistId,
            position:    kanbanChecklistItems.position,
            isCompleted: kanbanChecklistItems.isCompleted,
          })
          .from(kanbanChecklistItems)
          .where(eq(kanbanChecklistItems.id, itemId))
          .limit(1)
          .for('update');
        const item = cur[0];
        if (!item) return { kind: 'not_found' as const };

        const willComplete = !item.isCompleted;
        if (willComplete) {
          const earlier = await tx
            .select({ id: kanbanChecklistItems.id })
            .from(kanbanChecklistItems)
            .where(and(
              eq(kanbanChecklistItems.checklistId, item.checklistId),
              lt(kanbanChecklistItems.position, item.position),
              eq(kanbanChecklistItems.isCompleted, false),
            ))
            .limit(1);
          if (earlier[0]) return { kind: 'blocked' as const };
        }

        const [row] = await tx.update(kanbanChecklistItems)
          .set({ isCompleted: willComplete })
          .where(eq(kanbanChecklistItems.id, itemId))
          .returning();

        let cascadeFrozen = 0;
        if (!willComplete) {
          const reset = await tx.update(kanbanChecklistItems)
            .set({ isCompleted: false })
            .where(and(
              eq(kanbanChecklistItems.checklistId, item.checklistId),
              gt(kanbanChecklistItems.position, item.position),
              eq(kanbanChecklistItems.isCompleted, true),
            ))
            .returning({ id: kanbanChecklistItems.id });
          cascadeFrozen = reset.length;
        }
        return { kind: 'ok' as const, row: { ...(row ?? { id: itemId }), cascadeFrozen } };
      });

      if (outcome.kind === 'not_found') return Err(AppErr('NOT_FOUND', 'Checklist elementi topilmadi'));
      if (outcome.kind === 'blocked') {
        return Err(AppErr('VALIDATION', "Bu qadamni bajarilgan deb belgilash mumkin emas — oldingi qadam(lar) hali bajarilmagan."));
      }
      return Ok(outcome.row as Record<string, unknown>);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
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
      // §15 #46: @mention → xabar. Parse @username tokens from the comment, resolve them
      // against real usernames (all users have one) and fan out a 'mention' notification
      // to each mentioned user — excluding the author (no self-notify) and any token that
      // is not a real username. Mirrors the in-band notification inserts in
      // acceptCard/completeCard above.
      const mentionTokens = Array.from(new Set(
        (content.match(/@([a-zA-Z0-9_.-]+)/g) ?? []).map((t) => t.slice(1)),
      ));
      if (mentionTokens.length > 0) {
        const mentioned = await runQuery<{ id: number }>(sql`
          SELECT id FROM users
          WHERE username = ANY(${mentionTokens}::text[]) AND id <> ${userId}
        `);
        const preview = content.length > 140 ? `${content.slice(0, 140)}…` : content;
        for (const m of mentioned.rows) {
          await db.insert(kanbanNotifications).values({
            userId:  Number(m.id),
            cardId,
            type:    'mention',
            title:   'Izohda eslatildingiz',
            message: preview,
          });
        }
      }
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
      // EP-KAN §15 #29 (C29): kunlik "Shoshilinch" (urgent) limiti — bir topshiruvchi
      // (assigner) bir kunda ko'pi bilan KANBAN_MAX_URGENT_PER_DAY ta urgent karta
      // yaratadi. assigner yo'q yoki normal-prioritetli kartalar cheklovga tushmaydi.
      if (priority === 'urgent' && assignerId != null) {
        const used = await runQuery<{ cnt: string }>(sql`
          SELECT COUNT(*)::text AS cnt FROM kanban_cards
          WHERE priority = 'urgent' AND assigner_user_id = ${assignerId}
            AND deleted_at IS NULL AND created_at::date = CURRENT_DATE
        `);
        if (Number(used.rows[0]?.cnt ?? 0) >= KANBAN_MAX_URGENT_PER_DAY) {
          return Err(AppErr(
            'VALIDATION',
            `Bir kunda ko'pi bilan ${KANBAN_MAX_URGENT_PER_DAY} ta "Shoshilinch" vazifa yaratish mumkin.`,
          ));
        }
      }
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
      // Vizyon §15 #72: kuzatuvchilarga FAQAT muhim hodisada (yakunlash) xabar —
      // oddiy ustun ko'chirish jim qoladi. Har kuzatuvchiga bitta bildirishnoma
      // (yakunlagan foydalanuvchining o'zi bundan mustasno). INSERT...SELECT —
      // Drizzle boshqa jadvaldan SELECT bilan INSERT ni ifodalay olmaydi (Rule 4).
      const obsTitle = `"${String(card.title)}" yakunlandi`;
      const obsMsg   = completionReport ?? 'Karta yakunlandi';
      await runQuery(sql`
        INSERT INTO kanban_notifications (user_id, card_id, type, title, message)
        SELECT o.user_id, ${cardId}, 'status_changed', ${obsTitle}, ${obsMsg}
        FROM kanban_observers o
        WHERE o.card_id = ${cardId} AND o.user_id <> ${userId}
      `);
      return Ok(castTo<Record<string, unknown>>(rows.rows[0]));
    } catch (e) {
      return Err(String(e));
    }
  }

  // ─── Bulk assign (EP-KAN A24: ta'til / 50+ vazifa ommaviy tayinlash) ──────
  // Bir userga ko'p kartani bitta UPDATE bilan tayinlaydi (owner_user_id).
  // IN-ro'yxati sql.join orqali parametrlangan (loyihada `= ANY(${arr})` JS massivni
  // satr-kortejga mis-bind qiladi — notification-routing.repository.ts:143). deleted_at
  // IS NULL guard soft-delete kartalarni chetlab o'tadi; RETURNING haqiqiy sonni beradi.
  async bulkAssignCards(
    cardIds: number[], ownerUserId: number | null,
  ): Promise<Result<{ updated: number; ids: number[] }>> {
    try {
      const ids = (Array.isArray(cardIds) ? cardIds : [])
        .map((v) => Number(v))
        .filter((v) => Number.isInteger(v) && v > 0);
      if (ids.length === 0) return Err(AppErr('VALIDATION', 'Kamida bitta karta ID kerak'));
      const owner = ownerUserId != null && Number.isInteger(Number(ownerUserId)) ? Number(ownerUserId) : null;
      const idList = sql.join(ids.map((v) => sql`${v}`), sql`, `);
      const rows = await runQuery<{ id: number; owner_user_id: number | null }>(sql`
        UPDATE kanban_cards
        SET owner_user_id = ${owner}, updated_at = NOW()
        WHERE id IN (${idList}) AND deleted_at IS NULL
        RETURNING id, owner_user_id
      `);
      return Ok({ updated: rows.rows.length, ids: rows.rows.map((r) => Number(r.id)) });
    } catch (e) {
      return Err(String(e));
    }
  }

  // ─── Reject (qaytarish) ───────────────────────────────────────────────────

  /**
   * EP-KAN-118: bajaruvchi (owner_user_id) vazifani sabab bilan topshiruvchiga
   * (assigner_user_id) qaytaradi — egalik teskari almashadi
   * (owner_user_id ← assigner_user_id), sabab kanban_card_comments qatori sifatida
   * saqlanadi, topshiruvchiga bildirishnoma yuboriladi.
   */
  async rejectCard(cardId: string, userId: number, reason: string): Promise<Result<Record<string, unknown>>> {
    try {
      const pre = await runQuery<{ owner_user_id: number | null; assigner_user_id: number | null }>(sql`
        SELECT owner_user_id, assigner_user_id
        FROM kanban_cards WHERE id = ${cardId} AND deleted_at IS NULL LIMIT 1
      `);
      if (!pre.rows[0]) return Err(AppErr('NOT_FOUND', 'Karta topilmadi'));
      const owner    = pre.rows[0].owner_user_id;
      const assigner = pre.rows[0].assigner_user_id;
      if (assigner == null) {
        return Err(AppErr('VALIDATION', "Kartada topshiruvchi ko'rsatilmagan — qaytarib bo'lmaydi."));
      }
      // Faqat joriy bajaruvchi (owner) vazifani qaytara oladi.
      if (owner != null && Number(owner) !== userId) {
        return Err(AppErr('FORBIDDEN', 'Faqat vazifa bajaruvchisi uni qaytara oladi.'));
      }
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET owner_user_id = assigner_user_id, updated_at = NOW()
        WHERE id = ${cardId} AND deleted_at IS NULL
        RETURNING id, title, owner_user_id, assigner_user_id, column_id
      `);
      if (!rows.rows[0]) return Err(AppErr('NOT_FOUND', 'Karta topilmadi'));
      const card = rows.rows[0];
      // Sabab — izoh sifatida saqlanadi (kanban_card_comments).
      await db.insert(kanbanCardComments).values({
        cardId: String(cardId),
        userId,
        content: `Vazifa qaytarildi: ${reason}`,
      });
      // Topshiruvchiga (yangi egaga) bildirishnoma.
      await db.insert(kanbanNotifications).values({
        userId: Number(assigner),
        cardId: String(cardId),
        type: 'status_changed',
        title: `"${String(card.title)}" qaytarildi`,
        message: reason,
      });
      return Ok(castTo<Record<string, unknown>>(rows.rows[0]));
    } catch (e) {
      return Err(String(e));
    }
  }
}
