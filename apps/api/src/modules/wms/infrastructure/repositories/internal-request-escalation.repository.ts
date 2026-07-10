/**
 * @module internal-request-escalation.repository
 * @description WMS #32 (vizyon 10-warehouse.md #32) — "Rohler chaqiruv" (ichki material/uskuna
 *   so'rovi) 15/30/60 daqiqa eskalatsiya data-access qatlami. Bajarilmagan (pending) so'rovlar
 *   yoshini (created_at) o'lchaydi va allaqachon yuborilgan eng yuqori eskalatsiya darajasini
 *   `notifications` jadvalidan (reference_type='internal_request_escalation', type suffiksi
 *   `_l1/_l2/_l3`) aniqlaydi — shu bilan qayta-yuborishni oldini oladi (dedup manba-haqiqati =
 *   notifications; YANGI USTUN/JADVAL YO'Q — Q-35). Egasi-data (org head_user_id) ga bog'liq emas.
 *
 * NOTE: Raw SQL — LEFT JOIN + FILTERli MAX(CASE...) agregatsiya (allaqachon-yuborilgan daraja) va
 *   NOT EXISTS dedup INSERT; Drizzle query-builder buni ifodalay olmaydi. ARCHITECTURE_RULES.md Rule 4.
 *   notifications.body NOT NULL (jadval cheklovi) — shuning uchun body har doim yoziladi.
 * @layer Repository (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export interface EscalatableRequestRow {
  id: number;
  request_no: string;
  material_name: string;
  urgency: string;
  elapsed_min: number;
  last_level: number;
}

@Injectable()
export class InternalRequestEscalationRepository {
  private readonly logger = new Logger(InternalRequestEscalationRepository.name);

  /**
   * Bajarilmagan (pending) material/uskuna so'rovlari — 15 daqiqadan oshgan — va ular uchun
   * allaqachon yuborilgan eng yuqori eskalatsiya darajasi (0 = hech qanaqasi yuborilmagan).
   */
  async findEscalatable(limit = 50): Promise<EscalatableRequestRow[]> {
    const r = await runQuery<{
      id: number;
      request_no: string;
      material_name: string;
      urgency: string;
      elapsed_min: number;
      last_level: number;
    }>(sql`
      SELECT ir.id, ir.request_no, ir.material_name, ir.urgency,
             ROUND(EXTRACT(EPOCH FROM (NOW() - ir.created_at)) / 60)::int AS elapsed_min,
             COALESCE(MAX(CASE WHEN n.type = 'wms_rohler_escl_l3' THEN 3
                               WHEN n.type = 'wms_rohler_escl_l2' THEN 2
                               WHEN n.type = 'wms_rohler_escl_l1' THEN 1 ELSE 0 END), 0) AS last_level
      FROM internal_requests ir
      LEFT JOIN notifications n
        ON n.reference_type = 'internal_request_escalation' AND n.reference_id = ir.id
      WHERE ir.status = 'pending'
        AND ir.request_type IN ('material', 'equipment')
        AND ir.created_at < NOW() - INTERVAL '15 minutes'
      GROUP BY ir.id, ir.request_no, ir.material_name, ir.urgency, ir.created_at
      ORDER BY ir.created_at ASC
      LIMIT ${limit}
    `);
    return r.rows.map((x) => ({
      id: Number(x.id),
      request_no: String(x.request_no),
      material_name: String(x.material_name),
      urgency: String(x.urgency),
      elapsed_min: Number(x.elapsed_min),
      last_level: Number(x.last_level),
    }));
  }

  /**
   * Bitta javobgar foydalanuvchiga eskalatsiya bildirishnomasini yozadi — per so'rov×daraja×foydalanuvchi
   * NOT EXISTS dedup bilan (takror yubormaydi). Yozildi bo'lsa true. body NOT NULL bo'lgani uchun
   * har doim to'ldiriladi (title_uz/message_uz ham FE i18n uchun beriladi, stock-alert.cron.ts namunasi).
   */
  async insertEscalationNotification(
    userId: number,
    requestId: number,
    typeTag: string,
    title: string,
    body: string,
    priority: string,
  ): Promise<boolean> {
    const r = await runQuery<{ id: number }>(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, priority, title_uz, message_uz,
         reference_id, reference_type, created_at)
      SELECT ${userId}, ${typeTag}, ${title}, ${body}, FALSE, ${priority}, ${title}, ${body},
             ${requestId}, 'internal_request_escalation', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE reference_type = 'internal_request_escalation'
          AND reference_id = ${requestId} AND type = ${typeTag} AND user_id = ${userId}
      )
      RETURNING id
    `);
    return r.rows.length > 0;
  }
}
