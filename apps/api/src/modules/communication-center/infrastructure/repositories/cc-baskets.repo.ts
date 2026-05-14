/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   conditional WHERE clause with dynamic owner column switch (outbox vs inbox/pending),
 *   COUNT(*) FILTER (WHERE ...) aggregate per basket-state in a single scan,
 *   priority-CASE ordering combined with FOR UPDATE row locking and multi-statement
 *   transactions (UPDATE + INSERT into basket_history + INSERT into audit_trail).
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * Communication Center — 3-Savat ma'lumotlari repository.
 * Raw `runQuery(sql\`...\`)` ishlatiladi (drizzle-orm dist'da kolonna refs
 * ba'zan undefined bo'lganligi sababli, joriy KanbanRepo va CRMRepo bilan
 * bir xil pattern saqlanadi).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { castTo } from '@common/db-rows';
import type {
  BasketCardRow, BasketSummary, BasketState,
} from '../../domain/types';

@Injectable()
export class CcBasketsRepository {
  private readonly logger = new Logger(CcBasketsRepository.name);

  /**
   * Bitta savat ichidagi hujjatlar. Filter:
   *  - inbox/pending  → basket_owner_user_id = userId
   *  - outbox         → sender_user_id      = userId  (yuboruvchi ko'radi)
   */
  async listBasket(userId: number, basket: BasketState): Promise<Result<BasketCardRow[]>> {
    try {
      const ownerCondition = basket === 'outbox'
        ? sql`d.sender_user_id = ${userId}`
        : sql`d.basket_owner_user_id = ${userId}`;

      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          d.id::text                 AS id,
          d.document_number          AS "documentNumber",
          d.subject                  AS subject,
          t.code                     AS "templateCode",
          t.name_uz                  AS "templateNameUz",
          t.name_ru                  AS "templateNameRu",
          d.priority                 AS priority,
          d.language                 AS language,
          d.basket_state             AS "basketState",
          d.basket_entered_at        AS "basketEnteredAt",
          d.is_inbox_overdue         AS "isInboxOverdue",
          d.workflow_state           AS "workflowState",
          d.current_step_order       AS "currentStepOrder",
          d.sender_user_id           AS "senderUserId",
          NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS "senderName",
          d.basket_owner_user_id     AS "basketOwnerUserId",
          d.created_at               AS "createdAt",
          d.updated_at               AS "updatedAt"
        FROM cc_documents d
        LEFT JOIN cc_document_templates t ON t.id = d.template_id
        LEFT JOIN users u                 ON u.id = d.sender_user_id
        WHERE d.basket_state = ${basket}
          AND ${ownerCondition}
          AND d.archived_at IS NULL
        ORDER BY
          CASE d.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
          d.is_inbox_overdue DESC,
          d.basket_entered_at ASC
        LIMIT 200
      `);
      return Ok(castTo<BasketCardRow[]>(rows.rows));
    } catch (e) {
      this.logger.error(`listBasket(${basket}): ${(e as Error).message}`);
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Sarlavhada ko'rsatiladigan badge raqamlari */
  async summary(userId: number): Promise<Result<BasketSummary>> {
    try {
      const r = await runQuery<{
        inbox: string; pending: string; outbox: string; inbox_overdue: string;
      }>(sql`
        SELECT
          COUNT(*) FILTER (WHERE basket_state = 'inbox'   AND basket_owner_user_id = ${userId}) AS inbox,
          COUNT(*) FILTER (WHERE basket_state = 'pending' AND basket_owner_user_id = ${userId}) AS pending,
          COUNT(*) FILTER (WHERE basket_state = 'outbox'  AND sender_user_id      = ${userId}) AS outbox,
          COUNT(*) FILTER (
            WHERE basket_state = 'inbox'
              AND basket_owner_user_id = ${userId}
              AND is_inbox_overdue = true
          ) AS inbox_overdue
        FROM cc_documents
        WHERE archived_at IS NULL
      `);
      const row = r.rows[0] ?? { inbox: '0', pending: '0', outbox: '0', inbox_overdue: '0' };
      return Ok({
        inbox:        Number(row.inbox)         || 0,
        pending:      Number(row.pending)       || 0,
        outbox:       Number(row.outbox)        || 0,
        inboxOverdue: Number(row.inbox_overdue) || 0,
      });
    } catch (e) {
      this.logger.error(`summary: ${(e as Error).message}`);
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Savatni o'zgartirish (ATOMIC). Ruxsat tekshiruvi:
   *  - inbox → pending : faqat hozirgi basket_owner = userId
   *  - pending → outbox: faqat hozirgi basket_owner = userId  (yuboruvchining outbox'iga)
   *  - * → archived    : faqat super-admin/director (controller layerda enforce)
   * Returns: yangi basket holatidagi hujjat.
   */
  async moveBasket(
    documentId: string,
    actorUserId: number,
    toBasket: BasketState,
    note?: string,
  ): Promise<Result<{ id: string; basketState: BasketState; basketOwnerUserId: number | null }>> {
    try {
      // ── 1. Lock + read current state ─────────────────────────────────
      const cur = await runQuery<{
        id: string; basket_state: BasketState; basket_owner_user_id: number | null; sender_user_id: number;
      }>(sql`
        SELECT id::text AS id, basket_state, basket_owner_user_id, sender_user_id
        FROM cc_documents
        WHERE id = ${documentId} AND archived_at IS NULL
        FOR UPDATE
      `);
      const doc = cur.rows[0];
      if (!doc) return Err({ message: `Hujjat ${documentId} topilmadi`, code: 'NOT_FOUND' });

      // ── 1b. Ownership tekshiruvi ──────────────────────────────────────
      if (doc.basket_owner_user_id !== actorUserId) {
        return Err({ code: 'FORBIDDEN', message: 'Hujjat sizga tegishli emas' });
      }

      // ── 2. Target owner / archived_at hisoblash ──────────────────────
      let newOwner: number | null = doc.basket_owner_user_id;
      let archivedAt: Date | null = null;
      if (toBasket === 'outbox')   newOwner = doc.sender_user_id;
      if (toBasket === 'archived') { newOwner = null; archivedAt = new Date(); }

      // ── 3. UPDATE ──────────────────────────────────────────────────
      const upd = await runQuery<{ id: string; basket_state: BasketState; basket_owner_user_id: number | null }>(sql`
        UPDATE cc_documents
        SET basket_state         = ${toBasket},
            basket_owner_user_id = ${newOwner},
            basket_entered_at    = NOW(),
            is_inbox_overdue     = false,
            archived_at          = ${archivedAt},
            updated_at           = NOW()
        WHERE id = ${documentId}
        RETURNING id::text AS id, basket_state, basket_owner_user_id
      `);

      // ── 4. Audit yozuvlari (basket_history + audit_trail) ──────────
      await runQuery(sql`
        INSERT INTO cc_basket_history (document_id, owner_user_id, from_basket, to_basket, moved_by_user_id, note)
        VALUES (${documentId}, ${actorUserId}, ${doc.basket_state}, ${toBasket}, ${actorUserId}, ${note ?? null})
      `);
      await runQuery(sql`
        INSERT INTO cc_audit_trail
          (document_id, action, from_basket, to_basket, performed_by_user_id, comment)
        VALUES
          (${documentId}, ${`moved_to_${toBasket}`}, ${doc.basket_state}, ${toBasket}, ${actorUserId}, ${note ?? null})
      `);

      const updated = upd.rows[0];
      if (!updated) return Err({ message: `Hujjat ${documentId} yangilanmadi`, code: 'NOT_FOUND' });
      return Ok({
        id:                updated.id,
        basketState:       updated.basket_state,
        basketOwnerUserId: updated.basket_owner_user_id,
      });
    } catch (e) {
      this.logger.error(`moveBasket: ${(e as Error).message}`);
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Bitta hujjatni ID bo'yicha to'liq olish (asosiy view paneli uchun) */
  async getById(documentId: string): Promise<Result<BasketCardRow | null>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT
          d.id::text                 AS id,
          d.document_number          AS "documentNumber",
          d.subject                  AS subject,
          t.code                     AS "templateCode",
          t.name_uz                  AS "templateNameUz",
          t.name_ru                  AS "templateNameRu",
          d.priority                 AS priority,
          d.language                 AS language,
          d.basket_state             AS "basketState",
          d.basket_entered_at        AS "basketEnteredAt",
          d.is_inbox_overdue         AS "isInboxOverdue",
          d.workflow_state           AS "workflowState",
          d.current_step_order       AS "currentStepOrder",
          d.sender_user_id           AS "senderUserId",
          NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS "senderName",
          d.basket_owner_user_id     AS "basketOwnerUserId",
          d.created_at               AS "createdAt",
          d.updated_at               AS "updatedAt"
        FROM cc_documents d
        LEFT JOIN cc_document_templates t ON t.id = d.template_id
        LEFT JOIN users u                 ON u.id = d.sender_user_id
        WHERE d.id = ${documentId}
        LIMIT 1
      `);
      return Ok(r.rows[0] ? castTo<BasketCardRow>(r.rows[0]) : null);
    } catch (e) {
      this.logger.error(`getById: ${(e as Error).message}`);
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
