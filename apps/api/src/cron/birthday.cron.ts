/**
 * @module birthday.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger, Optional } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, hrEmployees, hrDepartments } from '@shared/db'
import { and, eq, isNotNull, isNull, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { TelegramService } from '../telegram/telegram.service'
import { CronStatusService } from './cron-status.service'

const BIRTHDAY_MANAGER_NOTIFY_LIMIT = 20

const managers = alias(hrEmployees, 'mgr')

@Injectable()
export class BirthdayCron {
  private readonly logger = new Logger(BirthdayCron.name)
  constructor(@Optional() private readonly telegram: TelegramService, private readonly cronStatus: CronStatusService) {}

  @Cron('0 20 * * *')
  async checkTomorrowBirthdays(): Promise<void> {
    const jobName = 'BirthdayCron.checkTomorrow'
    try {
      const employees = await db
        .select({
          id: hrEmployees.id,
          first_name: hrEmployees.first_name,
          last_name: hrEmployees.last_name,
          department_name: hrDepartments.name,
          telegram_chat_id: hrEmployees.telegram_chat_id,
          manager_telegram_chat_id: managers.telegram_chat_id,
        })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .leftJoin(managers, eq(managers.id, hrEmployees.manager_id))
        .where(
          and(
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            isNotNull(hrEmployees.birth_date),
            sql`EXTRACT(month FROM ${hrEmployees.birth_date}) = EXTRACT(month FROM CURRENT_DATE + INTERVAL '1 day')`,
            sql`EXTRACT(day FROM ${hrEmployees.birth_date}) = EXTRACT(day FROM CURRENT_DATE + INTERVAL '1 day')`,
          ),
        )
      let sent = 0
      for (const emp of employees) {
        if (emp.manager_telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(emp.manager_telegram_chat_id, `🎂 <b>Tug'ilgan kun eslatmasi</b>\n\nErtaga <b>${emp.first_name} ${emp.last_name}</b> (${emp.department_name ?? 'Bo\'lim ko\'rsatilmagan'}) ning tug'ilgan kuni!\n\nTabrikni unutmang. 🎉\n\n<i>EuroPrint HR tizimi</i>`).catch(e => this.logger.warn(`Birthday reminder Telegram failed for mgr of emp ${emp.id}: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ BirthdayCron.checkTomorrow: found=${employees.length}, notified_managers=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ BirthdayCron.checkTomorrow error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }

  /**
   * 07:30 — Bugungi tug'ilgan kunlar HAMMA xodimlar'ga (PRD Q195).
   * Manager'lar emas, balki barcha aktiv xodimlar telegram_chat_id orqali xabar oladi.
   * Tug'ilgan kun egasiga xabar bormaydi (uning o'ziga 18:00'da boshqa cron yuboradi).
   */
  @Cron('30 7 * * *')
  async announceToday(): Promise<void> {
    const jobName = 'BirthdayCron.announceToday'
    try {
      const employees = await db
        .select({
          id: hrEmployees.id,
          first_name: hrEmployees.first_name,
          last_name: hrEmployees.last_name,
          department_name: hrDepartments.name,
        })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(
          and(
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            isNotNull(hrEmployees.birth_date),
            sql`EXTRACT(month FROM ${hrEmployees.birth_date}) = EXTRACT(month FROM CURRENT_DATE)`,
            sql`EXTRACT(day FROM ${hrEmployees.birth_date}) = EXTRACT(day FROM CURRENT_DATE)`,
          ),
        )
      if (employees.length === 0) { this.cronStatus.recordSuccess(jobName); return }

      const safeEmployees = Array.isArray(employees) ? employees : []
      const birthdayUserIds = safeEmployees.map(e => e.id).filter(Boolean) as number[]
      const nameList = safeEmployees.map(e =>
        `• ${e.first_name} ${e.last_name} (${e.department_name ?? 'Bo\'lim ko\'rsatilmagan'})`
      ).join('\n')
      const message = `🎉 <b>Bugun tug'ilgan kunlari!</b>\n\n${nameList}\n\nUlarni tabriklab qo'ying!🎂\n\n<i>EuroPrint HR tizimi</i>`

      // BARCHA aktiv xodimlar (tug'ilgan kun egalaridan tashqari) — Q195
      const recipients = await db
        .select({ id: hrEmployees.id, telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(
          and(
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            isNotNull(hrEmployees.telegram_chat_id),
            birthdayUserIds.length > 0
              ? sql`${hrEmployees.id} NOT IN (${sql.join(birthdayUserIds.map(id => sql`${id}`), sql`, `)})`
              : sql`true`,
          ),
        )

      const safeRecipients = Array.isArray(recipients) ? recipients : []
      let sent = 0
      for (const r of safeRecipients) {
        if (this.telegram && r.telegram_chat_id) {
          await this.telegram.sendMessage(r.telegram_chat_id, message)
            .catch(e => this.logger.warn(`Birthday announce failed for emp ${r.id}: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ BirthdayCron.announceToday: birthdays=${safeEmployees.length}, recipients=${safeRecipients.length}, sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ BirthdayCron.announceToday error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }

  @Cron('0 18 * * *')
  async greetBirthdayPersonEvening(): Promise<void> {
    const jobName = 'BirthdayCron.greetEvening'
    try {
      const employees = await db
        .select({
          id: hrEmployees.id,
          first_name: hrEmployees.first_name,
          telegram_chat_id: hrEmployees.telegram_chat_id,
        })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(
          and(
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            isNotNull(hrEmployees.birth_date),
            isNotNull(hrEmployees.telegram_chat_id),
            sql`EXTRACT(month FROM ${hrEmployees.birth_date}) = EXTRACT(month FROM CURRENT_DATE)`,
            sql`EXTRACT(day FROM ${hrEmployees.birth_date}) = EXTRACT(day FROM CURRENT_DATE)`,
          ),
        )
      let sent = 0
      for (const emp of employees) {
        if (!emp.telegram_chat_id || !this.telegram) continue
        await this.telegram.sendMessage(emp.telegram_chat_id, `🎂 <b>Tug'ilgan kuningiz bilan, ${emp.first_name}!</b>\n\nBugun siz uchun atoqli kun. EuroPrint jamoasi siz bilan faxrlanadi va sizga ko'p yillik baxt, sog'lik hamda muvaffaqiyatlar tilaymiz!🎉🌟\n\n<i>EuroPrint HR tizimi</i>`).catch(e => this.logger.warn(`Birthday evening greet failed for emp ${emp.id}: ${String(e)}`))
        sent++
      }
      this.logger.log(`✅ BirthdayCron.greetEvening: found=${employees.length}, sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ BirthdayCron.greetEvening error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
