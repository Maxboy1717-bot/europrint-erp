/**
 * @module ai-interview.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, hr_interview_sessions } from '@shared/db'
import { and, inArray, lt, sql } from 'drizzle-orm'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class AiInterviewCron {
  private readonly logger = new Logger(AiInterviewCron.name)
  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 * * * *')
  async expireOldSessions(): Promise<void> {
    const jobName = 'AiInterviewCron'
    try {
      const expired = await db
        .update(hr_interview_sessions)
        .set({ status: 'expired' })
        .where(
          and(
            inArray(hr_interview_sessions.status, ['pending', 'active']),
            lt(hr_interview_sessions.created_at, sql`NOW() - INTERVAL '24 hours'`),
          ),
        )
        .returning({ id: hr_interview_sessions.id })
      const count = expired.length
      if (count > 0) this.logger.log(`✅ AiInterviewCron: expired=${count} stale AI interview sessions`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ AiInterviewCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
