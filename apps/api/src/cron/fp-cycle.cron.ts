/**
 * @module fp-cycle.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger, Optional } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, hrEmployees, hrDepartments } from '@shared/db'
import { and, count, eq, inArray, ilike, isNotNull, isNull, or } from 'drizzle-orm'
import { TelegramService } from '../telegram/telegram.service'
import { CronStatusService } from './cron-status.service'

interface ManagerRow { id: number; first_name: string | null; last_name: string | null; telegram_chat_id: string | null }

@Injectable()
export class FpCycleCron {
  private readonly logger = new Logger(FpCycleCron.name)
  constructor(@Optional() private readonly telegram: TelegramService, private readonly cronStatus: CronStatusService) {}

  @Cron('0 9 * * 2')
  async sendZvsReminder(): Promise<void> {
    const jobName = 'FpCycle.sendZvsReminder'
    try {
      const deptManagers = await db
        .select({ manager_id: hrDepartments.manager_id })
        .from(hrDepartments)
        .where(isNotNull(hrDepartments.manager_id))
      const mgrIds = [...new Set((Array.isArray(deptManagers) ? deptManagers : []).map(r => r.manager_id).filter((id): id is NonNullable<typeof id> => id != null))]
      const managers: ManagerRow[] = mgrIds.length > 0
        ? await db
            .select({ id: hrEmployees.id, first_name: hrEmployees.first_name, last_name: hrEmployees.last_name, telegram_chat_id: hrEmployees.telegram_chat_id })
            .from(hrEmployees)
            .where(and(eq(hrEmployees.status, 'active'), isNull(hrEmployees.deleted_at), isNotNull(hrEmployees.telegram_chat_id), inArray(hrEmployees.id, mgrIds)))
        : []
      let sent = 0
      for (const mgr of managers) {
        if (mgr.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(mgr.telegram_chat_id, `📋 <b>ЗВС Eslatmasi (Seshanba)</b>\n\nHurmatli ${mgr.first_name} ${mgr.last_name},\n\nBu hafta uchun Zaxira Vazifalar Sxemasini (ЗВС) tekshiring va yangilang.\nMuddati: <b>Ushbu hafta Chorshanba</b> kuni.\n\n<i>EuroPrint HR tizimi</i>`).catch(e => this.logger.warn(`ZVS Telegram failed for mgr ${mgr.id}: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ FpCycle ZVS (Seshanba 09:00): managers=${managers.length}, sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ FpCycle ZVS reminder error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }

  @Cron('0 9 * * 3')
  async sendFpDayReminder(): Promise<void> {
    const jobName = 'FpCycle.sendFpDayReminder'
    try {
      const financeUsers: ManagerRow[] = await db
        .selectDistinct({ id: hrEmployees.id, first_name: hrEmployees.first_name, last_name: hrEmployees.last_name, telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .innerJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(and(eq(hrEmployees.status, 'active'), isNull(hrEmployees.deleted_at), isNotNull(hrEmployees.telegram_chat_id), ilike(hrDepartments.name, '%moliya%')))
        .limit(10)
      let sent = 0
      for (const u of financeUsers) {
        if (u.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(u.telegram_chat_id, `💼 <b>FP Kuni Eslatmasi (Chorshanba)</b>\n\nBugun Fond Pensiya (FP) hisob-kitoblari kuni.\nBarcha hisob-kitoblarni tekshirib tasdiqlang.\n\n<i>EuroPrint Moliya tizimi</i>`).catch(e => this.logger.warn(`FP-day Telegram failed for ${u.id}: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ FpCycle FP-day (Chorshanba 09:00): users=${financeUsers.length}, sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ FpCycle FP-day reminder error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }

  @Cron('0 9 * * 4')
  async sendBankPaymentReminder(): Promise<void> {
    const jobName = 'FpCycle.sendBankPaymentReminder'
    try {
      const [countResult, cashiers] = await Promise.all([
        db.select({ total: count() }).from(hrEmployees).where(and(eq(hrEmployees.status, 'active'), isNull(hrEmployees.deleted_at))),
        db.selectDistinct({ id: hrEmployees.id, first_name: hrEmployees.first_name, last_name: hrEmployees.last_name, telegram_chat_id: hrEmployees.telegram_chat_id })
          .from(hrEmployees)
          .innerJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
          .where(and(eq(hrEmployees.status, 'active'), isNull(hrEmployees.deleted_at), isNotNull(hrEmployees.telegram_chat_id), or(ilike(hrDepartments.name, '%moliya%'), ilike(hrDepartments.name, '%kassir%'))))
          .limit(5) as Promise<ManagerRow[]>,
      ])
      const totalEmployees = countResult[0]?.total ?? 0
      let sent = 0
      for (const u of cashiers) {
        if (u.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(u.telegram_chat_id, `🏦 <b>Bank To'lov Eslatmasi (Payshanba)</b>\n\n👥 Xodimlar soni: <b>${totalEmployees}</b>\n📅 Bugun bank orqali oylik to'lovlarni o'tkazing.\n\n<i>EuroPrint Moliya tizimi</i>`).catch(e => this.logger.warn(`Bank payment Telegram failed: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ FpCycle bank payment (Payshanba 09:00): sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ FpCycle bank payment reminder error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }

  @Cron('0 9 * * 1')
  async sendCashPaymentReminder(): Promise<void> {
    const jobName = 'FpCycle.sendCashPaymentReminder'
    try {
      const cashiers: ManagerRow[] = await db
        .selectDistinct({ id: hrEmployees.id, first_name: hrEmployees.first_name, last_name: hrEmployees.last_name, telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .innerJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(and(eq(hrEmployees.status, 'active'), isNull(hrEmployees.deleted_at), isNotNull(hrEmployees.telegram_chat_id), or(ilike(hrDepartments.name, '%moliya%'), ilike(hrDepartments.name, '%kassir%'))))
        .limit(5)
      let sent = 0
      for (const u of cashiers) {
        if (u.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(u.telegram_chat_id, `💵 <b>Naqd To'lov Eslatmasi (Dushanba)</b>\n\n📅 Bugun naqd pul orqali to'lovlarni amalga oshiring.\nKassir bilan kelishib oling.\n\n<i>EuroPrint Moliya tizimi</i>`).catch(e => this.logger.warn(`Cash payment Telegram failed: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ FpCycle cash payment (Dushanba 09:00): sent=${sent}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ FpCycle cash payment reminder error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
