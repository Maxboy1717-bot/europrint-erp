/**
 * @module gtd-flag.repository
 * @description Vision 10-warehouse#10 — GTD (bojxona yuk deklaratsiyasi) yetishmovchilik
 *   bayrog'i data-access qatlami. Kanonik jadval = goods_receipts (mm_goods_receipts = VIEW).
 *   gtd_missing STORED-generated ustun (gtd_due_date IS NOT NULL AND gtd_number IS NULL) —
 *   repo unga hech qachon YOZMAYDI, faqat gtd_number/gtd_due_date ni boshqaradi. Eskalatsiya
 *   dedup manba-haqiqati = notifications (reference_type='gtd_missing_escalation', type=
 *   'wms_gtd_missing_escl'); w10-gtd-missing-flag.sql migratsiyadan tashqari YANGI USTUN/JADVAL YO'Q.
 *
 * NOTE: Raw SQL — generated-ustun derivatsiyasi, EXISTS holat va NOT EXISTS dedup INSERT;
 *   Drizzle query-builder buni to'liq ifodalay olmaydi. ARCHITECTURE_RULES.md Rule 4.
 *   notifications.body NOT NULL — shuning uchun body har doim yoziladi.
 * @layer Repository (WMS)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export interface OverdueMissingGtdRow {
  id: number;
  receipt_number: string;
  gtd_due_date: string;
  days_overdue: number;
  already_notified: boolean;
}

@Injectable()
export class GtdFlagRepository {
  /**
   * Import qabulini "GTD talab qilinadi" deb belgilaydi: due_date = receipt_date/created_at + N kun.
   * Faqat hali qo'yilmagan bo'lsa qo'yadi (idempotent) — qayta-yozib eskalatsiya soatini tiklamaydi.
   */
  async markRequired(receiptId: number, dueDays: number): Promise<{ id: number; gtd_due_date: string } | null> {
    const r = await runQuery<{ id: number; gtd_due_date: string }>(sql`
      UPDATE goods_receipts
      SET gtd_due_date = (COALESCE(NULLIF(receipt_date, '')::date, created_at::date) + (${dueDays})::int)
      WHERE id = ${receiptId} AND gtd_due_date IS NULL
      RETURNING id, gtd_due_date
    `);
    return r.rows[0] ?? null;
  }

  /** GTD raqamini yozadi — bu bilan gtd_missing (generated) avtomatik false bo'ladi. NOT_FOUND uchun null. */
  async setNumber(receiptId: number, gtdNumber: string): Promise<{ id: number; gtd_number: string; gtd_missing: boolean } | null> {
    const r = await runQuery<{ id: number; gtd_number: string; gtd_missing: boolean }>(sql`
      UPDATE goods_receipts SET gtd_number = ${gtdNumber}
      WHERE id = ${receiptId}
      RETURNING id, gtd_number, gtd_missing
    `);
    return r.rows[0] ?? null;
  }

  /** Muddati o'tgan (due_date < bugun) va GTD-yetishmayotgan qabullar + allaqachon-xabar-berilganmi. */
  async findOverdueMissing(limit = 100): Promise<OverdueMissingGtdRow[]> {
    const r = await runQuery<{
      id: number; receipt_number: string; gtd_due_date: string; days_overdue: number; already_notified: boolean;
    }>(sql`
      SELECT gr.id, gr.receipt_number, gr.gtd_due_date,
             (CURRENT_DATE - gr.gtd_due_date) AS days_overdue,
             EXISTS (SELECT 1 FROM notifications n
                     WHERE n.reference_type = 'gtd_missing_escalation'
                       AND n.reference_id = gr.id
                       AND n.type = 'wms_gtd_missing_escl') AS already_notified
      FROM goods_receipts gr
      WHERE gr.gtd_missing = TRUE AND gr.gtd_due_date < CURRENT_DATE
      ORDER BY gr.gtd_due_date ASC
      LIMIT ${limit}
    `);
    return r.rows.map((x) => ({
      id: Number(x.id),
      receipt_number: String(x.receipt_number),
      gtd_due_date: String(x.gtd_due_date),
      days_overdue: Number(x.days_overdue),
      already_notified: Boolean(x.already_notified),
    }));
  }

  /**
   * Bitta javobgar foydalanuvchiga GTD-yetishmovchilik eskalatsiyasini yozadi — per qabul×foydalanuvchi
   * NOT EXISTS dedup (takror yubormaydi). Yozildi bo'lsa true. body NOT NULL → doim to'ldiriladi
   * (title_uz/message_uz FE i18n uchun beriladi, internal-request-escalation.repository namunasi).
   */
  async insertEscalationNotification(
    userId: number, receiptId: number, title: string, body: string, priority: string,
  ): Promise<boolean> {
    const r = await runQuery<{ id: number }>(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, priority, title_uz, message_uz,
         reference_id, reference_type, created_at)
      SELECT ${userId}, 'wms_gtd_missing_escl', ${title}, ${body}, FALSE, ${priority}, ${title}, ${body},
             ${receiptId}, 'gtd_missing_escalation', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE reference_type = 'gtd_missing_escalation'
          AND reference_id = ${receiptId} AND type = 'wms_gtd_missing_escl' AND user_id = ${userId}
      )
      RETURNING id
    `);
    return r.rows.length > 0;
  }
}
