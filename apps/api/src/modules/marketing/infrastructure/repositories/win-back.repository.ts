/**
 * @module win-back.repository
 * @description Modul 14 Marketing — win-back avto-start (vision 14-marketing #46).
 *
 *   3 oydan beri buyurtma bermagan mijozlarni `sales_orders`'dan aniqlaydi, SD'da
 *   ochiq (terminal bo'lmagan) lead borligini tekshiradi va ochiq lead BO'LMAGAN
 *   mijozlar uchun kanban win-back vazifasini yaratadi. Vazifa egasi = mijozning
 *   eng oxirgi lead'idagi `manager_id` (XODIM id) -> `employees.user_id` orqali
 *   kanban `owner_user_id` (foydalanuvchi id) ga resolve qilinadi (org head_user_id
 *   marshrutlash EMAS). Dedup: `kanban_cards.related_type='winback_customer'` +
 *   `related_id=customer_id` (ochiq/yakunlanmagan karta bo'lsa qayta yaratmaydi).
 *
 * NOTE: Raw SQL — ko'p-CTE inactive-detection pipeline + kanban_cards INSERT
 *   (createCardFlat naqshini takrorlaydi). LOYIHA_QOIDALARI Rule 4.
 * @layer Repository (Marketing)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { CRM_LEAD_TERMINAL_STATUSES } from '@common/constants/business.constants';

export interface WinBackCandidate {
  customer_id: number;
  last_order: string | null;
  customer_name: string | null;
  owner_user_id: number | null;
}

export interface WinBackTarget {
  board_id: number;
  column_id: number;
}

@Injectable()
export class WinBackRepository {
  /**
   * `inactiveMonths` oydan ko'proq buyurtma bermagan, SD'da ochiq lead'i bo'lmagan
   * va hali ochiq win-back kartasi mavjud bo'lmagan mijozlar. manager_id (xodim)
   * -> employees.user_id ga resolve qilinadi.
   */
  async findInactiveCustomersToWinBack(inactiveMonths: number): Promise<Result<WinBackCandidate[]>> {
    try {
      const terminal = [...CRM_LEAD_TERMINAL_STATUSES];
      const rows = await runQuery<WinBackCandidate>(sql`
        WITH inactive AS (
          SELECT so.customer_id, MAX(so.order_date) AS last_order
          FROM sales_orders so
          WHERE so.deleted_at IS NULL AND so.customer_id IS NOT NULL
          GROUP BY so.customer_id
          HAVING MAX(so.order_date) < (CURRENT_DATE - make_interval(months => ${inactiveMonths}::int))
        ),
        open_lead AS (
          SELECT DISTINCT customer_id
          FROM crm_leads
          WHERE deleted_at IS NULL AND customer_id IS NOT NULL
            AND status <> ALL(${terminal}::text[])
        ),
        recent_lead AS (
          SELECT DISTINCT ON (customer_id) customer_id, manager_id
          FROM crm_leads
          WHERE deleted_at IS NULL AND customer_id IS NOT NULL
          ORDER BY customer_id, created_at DESC NULLS LAST, id DESC
        )
        SELECT
          i.customer_id  AS customer_id,
          i.last_order   AS last_order,
          cust.name      AS customer_name,
          e.user_id      AS owner_user_id
        FROM inactive i
        LEFT JOIN open_lead    ol   ON ol.customer_id = i.customer_id
        LEFT JOIN recent_lead  rl   ON rl.customer_id = i.customer_id
        LEFT JOIN employees    e    ON e.id = rl.manager_id
        LEFT JOIN sd_customers cust ON cust.id = i.customer_id
        WHERE ol.customer_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM kanban_cards kc
            WHERE kc.related_type = 'winback_customer'
              AND kc.related_id = i.customer_id
              AND kc.deleted_at IS NULL
              AND kc.completed_at IS NULL
          )
        ORDER BY i.customer_id
      `);
      return Ok(Array.isArray(rows.rows) ? rows.rows : []);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Standart kanban board + "kiruvchi" ustun (eng past board_id/sort_order). */
  async resolveDefaultBoardColumn(): Promise<Result<WinBackTarget | null>> {
    try {
      const rows = await runQuery<WinBackTarget>(sql`
        SELECT c.id AS column_id, c.board_id
        FROM kanban_columns c
        WHERE c.deleted_at IS NULL
        ORDER BY c.board_id ASC, c.sort_order ASC
        LIMIT 1
      `);
      return Ok(rows.rows[0] ?? null);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Win-back kanban vazifasini yaratadi. Egasi = candidate.owner_user_id (mavjud
   * bo'lsa), aks holda tayinlanmagan (board'da triage uchun qoladi). Dedup markeri:
   * related_type='winback_customer' + related_id=customer_id.
   */
  async createWinBackTask(target: WinBackTarget, cand: WinBackCandidate): Promise<Result<number>> {
    try {
      const name  = cand.customer_name && cand.customer_name.trim() !== '' ? cand.customer_name : `#${cand.customer_id}`;
      const title = `Win-back: ${name} — 3 oy buyurtma yo'q`;
      const description =
        `Ushbu mijoz oxirgi marta ${cand.last_order ?? '—'} sanasida buyurtma bergan va 3 oydan beri faol emas. ` +
        `SD'da ochiq lead yo'q — qaytarish (win-back) bo'yicha aloqa o'rnating.`;
      const rows = await runQuery<{ id: number }>(sql`
        INSERT INTO kanban_cards
          (board_id, column_id, title, description, priority, owner_user_id,
           related_type, related_id, source, sort_order, created_at, updated_at)
        VALUES
          (${target.board_id}, ${target.column_id}, ${title}, ${description}, 'high', ${cand.owner_user_id ?? null},
           'winback_customer', ${cand.customer_id}, 'winback',
           COALESCE((SELECT MAX(sort_order) + 1 FROM kanban_cards WHERE column_id = ${target.column_id} AND deleted_at IS NULL), 0),
           NOW(), NOW())
        RETURNING id
      `);
      const id = rows.rows[0]?.id;
      if (id == null) return Err({ message: 'Win-back karta yaratilmadi', code: 'DB_ERROR' });
      return Ok(Number(id));
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
