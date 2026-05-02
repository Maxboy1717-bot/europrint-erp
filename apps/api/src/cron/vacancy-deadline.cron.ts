import { Injectable, Logger, Optional } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, vacancies, hrDepartments, hrEmployees } from '@shared/db'
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { TelegramService } from '../telegram/telegram.service'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class VacancyDeadlineCron {
  private readonly logger = new Logger(VacancyDeadlineCron.name)
  constructor(@Optional() private readonly telegram: TelegramService, private readonly cronStatus: CronStatusService) {}

  @Cron('0 9 * * *')
  async remindUpcomingDeadlines(): Promise<void> {
    const jobName = 'VacancyDeadlineCron'
    try {
      const rows = await db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          closing_date: vacancies.closing_date,
          department_id: vacancies.department_id,
          manager_id: hrDepartments.manager_id,
        })
        .from(vacancies)
        .leftJoin(hrDepartments, eq(hrDepartments.id, vacancies.department_id))
        .where(
          and(
            inArray(vacancies.status, ['active', 'open']),
            isNotNull(vacancies.closing_date),
            sql`${vacancies.closing_date}::date = CURRENT_DATE + INTERVAL '3 days'`,
          ),
        )

      const managerIds = [...new Set((rows ?? []).map(r => r.manager_id).filter(Boolean) as number[])]
      const managerMap = new Map<number, { telegram_chat_id: string | null; first_name: string | null }>()
      if (managerIds.length > 0) {
        const mgrRows = await db
          .select({ id: hrEmployees.id, telegram_chat_id: hrEmployees.telegram_chat_id, first_name: hrEmployees.first_name })
          .from(hrEmployees)
          .where(inArray(hrEmployees.id, managerIds))
        for (const m of mgrRows) managerMap.set(m.id, m)
      }

      let sent = 0
      for (const vac of rows) {
        const mgr = vac.manager_id ? managerMap.get(vac.manager_id) : null
        if (mgr?.telegram_chat_id && this.telegram && vac.closing_date) {
          const closingDate = new Date(vac.closing_date).toLocaleDateString('uz-UZ')
          await this.telegram.sendMessage(mgr.telegram_chat_id, `⏳ <b>Vakansiya Muddati Yaqinlashmoqda!</b>\n\n📋 Vakansiya: <b>${vac.title}</b>\n📅 Yopilish sanasi: <b>${closingDate}</b>\n\nNomzodlarni ko'rib chiqishni yoki muddatni uzaytirishni unutmang.\n\n<i>EuroPrint HR tizimi</i>`).catch(e => this.logger.warn(`Vacancy deadline Telegram failed for vacancy ${vac.id}: ${String(e)}`))
          sent++
        }
      }
      if (rows.length > 0) this.logger.log(`✅ VacancyDeadlineCron: found=${rows.length} vacancies closing within 3 days, notified=${sent}`)
      else this.logger.log(`✅ VacancyDeadlineCron: no vacancies closing in next 3 days`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ VacancyDeadlineCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
