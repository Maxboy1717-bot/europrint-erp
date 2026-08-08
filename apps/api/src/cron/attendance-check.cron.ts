/**
 * @module attendance-check.cron
 * @description Kelmagan (bugun check-in qilmagan) xodimlar — bevosita menejerga xabar.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har kuni "✅
 *   muvaffaqiyatli" deb log yozardi. Eski izohdagi "HR boshlig'iga attendance report" qismi
 *   ⛔ qurilmadi — bu alohida hisobot-generatsiya funksiyasi (report-generate.cron.ts bilan bir
 *   xil, ancha kattaroq ish), bu croni yagona vazifasi — real-vaqt "kelmadi" signali.
 *
 * QARORLAR
 *   - Kanonik jadval — `attendance` (`drizzle-hr-base.repo.ts saveAttendance()` yozadi;
 *     `attendance_logs` EMAS — o'sha jadvalda `status`/`date` ustunlari umuman yo'q, uni
 *     ishlatgan `manager.repo.ts getTeamForManager()` har chaqiruvda yiqiladi — alohida
 *     tuzatish kerak, bu faylning ko'lamidan tashqarida qoldirilib qayd etildi).
 *   - "Kelmagan" = bugun (`attendance_date = CURRENT_DATE`) qatori UMUMAN YO'Q — chunki
 *     `saveAttendance()` faqat check-in bo'lganda yoziladi (default `status='present'`),
 *     proaktiv "absent" qatori oldindan yaratilmaydi. Shuning uchun "status='absent' qidirish"
 *     hech qachon ishlamasdi (bunday qator hech qachon yozilmaydi) — qatorning O'ZI yo'qligi
 *     tekshiriladi.
 *   - Eslatma manzili — `employees.manager_id` → o'sha menejerning `user_id`i (advance-reminder
 *     bilan bir xil ikki-bosqichli join).
 *   - Ishga tushirish vaqti (10:00) o'zgartirilmadi — xodim ertalab kech kelishi mumkinligi
 *     uchun yetarli bufer (eski izohdagi tanlov saqlandi).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'

interface AbsentEmployeeRow {
  id: number
  full_name: string | null
  manager_user_id: number | null
}

@Injectable()
export class AttendanceCheckCron {
  private readonly logger = new Logger(AttendanceCheckCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** 10:00 — bugun check-in qilmagan aktiv xodimlarni tekshirish. */
  @Cron('0 10 * * *')
  async run(): Promise<void> {
    try {
      const r = await runQuery<AbsentEmployeeRow>(sql`
        SELECT e.id, e.full_name, m.user_id AS manager_user_id
        FROM employees e
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE e.status = 'active'
          AND m.user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM attendance a
            WHERE a.employee_id = e.id AND a.attendance_date = CURRENT_DATE
          )
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'employee_absent_today'
              AND n.reference_id = e.id
              AND n.created_at::date = CURRENT_DATE
          )
        ORDER BY e.full_name
        LIMIT 200
      `)

      if (r.rows.length === 0) {
        this.logger.log('AttendanceCheck: bugun barcha aktiv xodimlar check-in qilgan')
        return
      }

      let sent = 0
      for (const emp of r.rows) {
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(emp.manager_user_id),
            'Xodim bugun kelmadi',
            `${emp.full_name ?? `Xodim #${emp.id}`} bugun hali check-in qilmagan.`,
            'hr_employee_absent',
            String(emp.id),
            'employee_absent_today',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Xodim #${emp.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`AttendanceCheck: ${r.rows.length} ta xodim kelmagan, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`AttendanceCheck cron xatosi: ${String(err)}`)
    }
  }
}
