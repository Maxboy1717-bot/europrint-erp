/**
 * @module kanban-overdue-escalation.cron
 * @description Kanban / Vazifa — muddati o'tgan vazifalarni eskalatsiya qilish.
 *   Vizyon (Kanban): muddati o'tgan, hali bajarilmagan vazifa bo'yicha ijrochi (owner) +
 *   topshiruvchi (assigner) ogohlantiriladi. Tekshiruv (2026-06-27): Kanban'da eskalatsiya
 *   cron'i UMUMAN YO'Q edi (faqat `kanban-recurring.cron` mavjud). Bu cron shu bo'shliqni yopadi.
 *
 *   Dedup: yangi schema-ustun QO'SHILMAYDI — har karta uchun bugun allaqachon 'kanban_overdue'
 *   bildirishnomasi bo'lsa, qayta yuborilmaydi (notifications NOT EXISTS). due_date `varchar`
 *   bo'lgani uchun xavfsiz cast (regex tekshiruv → substring(1,10)::date).
 *
 * NOTE: Raw SQL — varchar due_date'ni xavfsiz date'ga cast + NOT EXISTS dedup; bularni
 *   Drizzle query-builder ifodalay olmaydi. See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Kanban)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

@Injectable()
export class KanbanOverdueEscalationCron {
  private readonly logger = new Logger(KanbanOverdueEscalationCron.name);

  /**
   * Har kuni 09:00 — muddati o'tgan (due_date < bugun, completed_at NULL) vazifalarni topib,
   * ijrochi + topshiruvchiga bildirishnoma yuborish. Bir karta = kuniga bir bildirishnoma.
   */
  @Cron('0 9 * * *')
  async escalateOverdue(): Promise<void> {
    try {
      const r = await runQuery<{
        id: number; title: string | null; owner_user_id: number | null; assigner_user_id: number | null;
      }>(sql`
        SELECT c.id, c.title, c.owner_user_id, c.assigner_user_id
        FROM kanban_cards c
        WHERE c.completed_at IS NULL
          AND c.due_date ~ '^\\d{4}-\\d{2}-\\d{2}'
          AND substring(c.due_date FROM 1 FOR 10)::date < CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'kanban_card'
              AND n.reference_id = c.id
              AND n.type = 'kanban_overdue'
              AND n.created_at::date = CURRENT_DATE
          )
      `);
      if (r.rows.length === 0) return;
      this.logger.warn(`Kanban eskalatsiya: ${r.rows.length} vazifa muddati o'tdi`);

      // Pattern 2: har qatorning bildirishnomalari mustaqil — parallel.
      await Promise.all(r.rows.map(async (row) => {
        const t = (row.title ?? 'Vazifa').slice(0, 80);
        if (row.owner_user_id) {
          await this.notify(row.owner_user_id, row.id, 'kanban_overdue',
            'Vazifa muddati o\'tdi',
            `«${t}» vazifasi muddati o'tib ketdi. Iltimos, bajaring yoki muddatni yangilang.`,
            'high');
        }
        if (row.assigner_user_id && row.assigner_user_id !== row.owner_user_id) {
          await this.notify(row.assigner_user_id, row.id, 'kanban_overdue',
            'Topshirgan vazifangiz muddati o\'tdi',
            `«${t}» vazifasi belgilangan muddatda bajarilmadi.`,
            'normal');
        }
        // Vizyon §15 #72: kuzatuvchilarga FAQAT muhim hodisada (muddat o'tishi) xabar.
        // owner/assigner yuqorida allaqachon xabar oldi — ular ro'yxatdan chiqariladi;
        // oddiy ustun ko'chirish esa umuman xabar bermaydi ("faqat muhim hodisa").
        const obs = await runQuery<{ user_id: number }>(sql`
          SELECT user_id FROM kanban_observers WHERE card_id = ${String(row.id)}
        `);
        await Promise.all(obs.rows
          .filter((o) => o.user_id !== row.owner_user_id && o.user_id !== row.assigner_user_id)
          .map((o) => this.notify(
            o.user_id, row.id, 'kanban_overdue',
            'Kuzatayotgan vazifangiz muddati o\'tdi',
            `«${t}» vazifasi belgilangan muddatda bajarilmadi.`,
            'normal')));
      }));
    } catch (e) {
      this.logger.error(`escalateOverdue: ${(e as Error).message}`);
    }
  }

  private async notify(
    userId: number, cardId: number, type: string, title: string, body: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
  ): Promise<void> {
    await runQuery(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
      VALUES
        (${userId}, ${type}, ${title}, ${body}, false, ${cardId}, 'kanban_card', ${priority}, NOW())
    `);
  }
}
