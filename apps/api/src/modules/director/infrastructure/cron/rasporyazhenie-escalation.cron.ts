/**
 * @module rasporyazhenie-escalation.cron
 * @description Coordination / Council — rasporyajeniye (директор farmoyishi) muddat-eskalatsiyasi.
 *   Vizyon (Coordination Q77/Q89/Q116): muddati o'tgan farmoyish avtomatik belgilanadi va
 *   ijrochi + chiqaruvchiga eskalatsiya-bildirishnomasi yuboriladi. Tekshiruv (2026-06-27)
 *   `rasporyazhenie` uchun overdue FAQAT read-vaqtida SELECT CASE bilan hisoblanardi —
 *   majburlovchi cron YO'Q edi. Bu cron shu bo'shliqni yopadi (cc-sla.cron pattern bilan bir xil).
 *
 *   Dedup: status='overdue' ga o'tkaziladi → keyingi yurishda qayta eskalatsiya qilinmaydi
 *   (yangi schema-ustun shart emas; read-CASE allaqachon shu qiymatni chiqaradi → mos).
 *
 * NOTE: Raw SQL — UPDATE ... RETURNING bilan bir o'tishda overdue belgilash + qatorlarni
 *   bildirishnoma uchun qaytarish; CURRENT_DATE sana-arifmetikasi (deadline = date).
 *   See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Director / Coordination)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

@Injectable()
export class RasporyazhenieEscalationCron {
  private readonly logger = new Logger(RasporyazhenieEscalationCron.name);

  /**
   * Har kuni 09:00 — muddati o'tgan (deadline < bugun, hali bajarilmagan) farmoyishlarni
   * 'overdue' deb belgilash va ijrochi + chiqaruvchiga bildirishnoma yuborish.
   * deadline `date` tipida → kunlik tekshiruv yetarli.
   */
  @Cron('0 9 * * *')
  async escalateOverdue(): Promise<void> {
    try {
      const r = await runQuery<{
        id: number; from_user_id: number | null; to_user: string | null; task: string | null;
      }>(sql`
        UPDATE rasporyazhenie
        SET status = 'overdue', updated_at = NOW()
        WHERE status NOT IN ('done', 'overdue', 'cancelled')
          AND deadline IS NOT NULL
          AND deadline < CURRENT_DATE
          AND deleted_at IS NULL
        RETURNING id, from_user_id, to_user::text AS to_user, task
      `);
      if (r.rows.length === 0) return;
      this.logger.warn(`Rasporyazhenie eskalatsiya: ${r.rows.length} farmoyish muddati o'tdi`);

      // Pattern 2: har qatorning bildirishnomalari mustaqil — parallel yuboriladi.
      await Promise.all(r.rows.map(async (row) => {
        const taskShort = (row.task ?? 'Farmoyish').slice(0, 80);
        // Ijrochi (to_user — appUsers.id'ning text ko'rinishi)
        const assigneeId = row.to_user && /^\d+$/.test(row.to_user) ? Number(row.to_user) : null;
        if (assigneeId) {
          await this.notify(assigneeId, row.id, 'rasporyazhenie_overdue',
            'Farmoyish muddati o\'tdi',
            `«${taskShort}» farmoyishi muddati o'tib ketdi. Iltimos, zudlik bilan bajaring.`,
            'high');
        }
        // Chiqaruvchi (from_user_id)
        if (row.from_user_id) {
          await this.notify(row.from_user_id, row.id, 'rasporyazhenie_overdue_issuer',
            'Sizning farmoyishingiz muddati o\'tdi',
            `«${taskShort}» farmoyishi belgilangan muddatda bajarilmadi.`,
            'normal');
        }
      }));
    } catch (e) {
      this.logger.error(`escalateOverdue: ${(e as Error).message}`);
    }
  }

  private async notify(
    userId: number, raspId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    // notifications NOT NULL: user_id, type, title, body, is_read. reference_*/priority — havola.
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${raspId}, 'rasporyazhenie', ${priority}, NOW())
    `);
  }
}
