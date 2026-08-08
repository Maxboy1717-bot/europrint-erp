/**
 * @module reminder-send.cron
 * @description Bugun muddati tugaydigan, hali bajarilmagan Kanban vazifalari — egaga eslatma.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi, va nega "1 soat" TALABI TO'LIQ BAJARILMAYDI
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har soat "✅ muvaffaqiyatli"
 *   deb log yozardi. Eski izoh "Muddati 1 soat qolganda → eslatma" deb talab qilgan edi, lekin
 *   `kanban_cards.due_date` — `character varying`, faqat `YYYY-MM-DD` (SANA, VAQT EMAS) —
 *   `kanban-cron.processor.ts`ning o'zi ham shu ustunni faqat kun aniqligida solishtiradi
 *   (`substring(due_date,1,10)::date < CURRENT_DATE`, OVERDUE_ESCALATION uchun). "1 soat
 *   qolganda" ni bu ustundan hisoblash MUMKIN EMAS — bu ma'lumot yo'qligi (Q-40: yo'q vaqtni
 *   o'ylab topib "1 soat" deb da'vo qilish fabrikatsiya bo'lardi). Vaqt aniqligi kerak bo'lsa,
 *   `due_date` timestamp'ga ko'chirilishi yoki alohida `due_time` ustuni qo'shilishi kerak —
 *   bu Q-35 (sxema o'zgarishi — egasi qarori).
 *
 *   Shu sababli bu cron **eng yaqin haqiqiy signalga** qurildi: "bugun muddati tugaydi"
 *   (kun aniqligida — mavjud ma'lumotning haqiqiy aniqligi). Bu `OVERDUE_ESCALATION`
 *   (`kanban-cron.processor.ts`, "due_date < BUGUN") bilan bir xil EMAS — u allaqachon
 *   O'TGAN muddatlarni eslatadi, bu esa BUGUN tugaydiganlarni oldindan ogohlantiradi (Q-46:
 *   dublikat emas, to'ldiruvchi).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'

interface DueTodayCardRow {
  id: number
  title: string | null
  owner_user_id: number | null
  priority: string | null
}

@Injectable()
export class ReminderSendCron {
  private readonly logger = new Logger(ReminderSendCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** Har soatning boshida — bugun muddati tugaydigan, hali bajarilmagan vazifalarni tekshirish. */
  @Cron('0 * * * *')
  async run(): Promise<void> {
    try {
      const r = await runQuery<DueTodayCardRow>(sql`
        SELECT c.id, c.title, c.owner_user_id, c.priority
        FROM kanban_cards c
        WHERE c.completed_at IS NULL
          AND c.deleted_at IS NULL
          AND c.owner_user_id IS NOT NULL
          AND c.due_date ~ '^\\d{4}-\\d{2}-\\d{2}'
          AND substring(c.due_date FROM 1 FOR 10)::date = CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'kanban_card'
              AND n.reference_id = c.id
              AND n.type = 'kanban_due_today'
              AND n.created_at::date = CURRENT_DATE
          )
        ORDER BY CASE c.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END
        LIMIT 200
      `)

      if (r.rows.length === 0) {
        this.logger.log('ReminderSend: bugun muddati tugaydigan vazifa topilmadi')
        return
      }

      let sent = 0
      for (const card of r.rows) {
        const label = (card.title ?? 'Vazifa').slice(0, 80)
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(card.owner_user_id),
            'Vazifa muddati bugun tugaydi',
            `«${label}» vazifasi bugun tugashi kerak.`,
            'kanban_due_today',
            String(card.id),
            'kanban_card',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Karta #${card.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`ReminderSend: ${r.rows.length} ta vazifa bugun tugaydi, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`ReminderSend cron xatosi: ${String(err)}`)
    }
  }
}
