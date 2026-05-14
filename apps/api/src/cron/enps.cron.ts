/**
 * @module enps.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, Optional } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { TelegramService } from '../telegram/telegram.service'
import { CronStatusService } from './cron-status.service'
import { EnpsCronRepository } from './repositories/enps-cron.repository'

@Injectable()
export class EnpsCron {
  private readonly logger = new Logger(EnpsCron.name)
  constructor(
    @Optional() private readonly telegram: TelegramService,
    private readonly cronStatus: CronStatusService,
    private readonly enpsRepo: EnpsCronRepository,
  ) {}

  @Cron('0 9 1 1,4,7,10 *')
  async createQuarterlySurvey(): Promise<void> {
    const jobName = 'EnpsCron'
    try {
      const now = _time.now()
      const quarter = Math.ceil((now.getMonth() + 1) / 3)
      const year = now.getFullYear()
      const title = `eNPS So'rov — ${year} Q${quarter}`
      const startDate = now.toISOString().split('T')[0]
      const endDate = new Date(now.getTime() + 14 * 86400_000).toISOString().split('T')[0]

      const existing = await this.enpsRepo.findSurveyByTitle(title)
      if (existing) {
        this.logger.log(`✅ EnpsCron: survey already exists for "${title}"`)
        this.cronStatus.recordSuccess(jobName)
        return
      }

      const defaultQuestions = [
        { id: 1, text: "Kompaniyamizni do'stingizga yoki hamkasbingizga ishlash uchun qanchalik tavsiya qilasiz? (0-10)", type: 'nps_scale' },
        { id: 2, text: "Bu chorakda eng ko'p nimadan mamnun bo'ldingiz?", type: 'open_text' },
        { id: 3, text: 'Nima yaxshilanishi kerak deb hisoblaysiz?', type: 'open_text' },
      ]

      const surveyId = await this.enpsRepo.insertSurvey(
        title,
        `${year} yilning ${quarter}-choragiga mo'ljallangan xodim mamnunligi so'rovi`,
        defaultQuestions,
        startDate,
        endDate,
      )

      const employees = await this.enpsRepo.findActiveEmployeesWithTelegram()

      let sent = 0
      for (const emp of employees) {
        if (this.telegram) {
          await this.telegram.sendMessage(emp.telegram_chat_id, `📊 <b>Choraklik eNPS So'rov</b>\n\nHurmatli ${emp.first_name},\n\n${year} Q${quarter} uchun xodimlar mamnunligi so'rovi boshlandi.\nIltimos, fikringizni bildiring (14 kun ichida).\n\n<i>EuroPrint HR tizimi</i>`).catch(e => this.logger.warn(`eNPS Telegram failed for emp ${emp.id}: ${String(e)}`))
          sent++
        }
      }
      this.logger.log(`✅ EnpsCron: created survey id=${surveyId} "${title}", notified=${sent}/${employees.length}`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) {
      this.logger.error(`❌ EnpsCron error: ${String(err)}`)
      this.cronStatus.recordFailure(jobName, String(err))
    }
  }
}
