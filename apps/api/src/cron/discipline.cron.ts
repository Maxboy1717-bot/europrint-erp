/**
 * @module discipline.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, discipline_records } from '@shared/db'
import { and, eq, lt, sql } from 'drizzle-orm'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class DisciplineCron {
  private readonly logger = new Logger(DisciplineCron.name)
  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 1 * * *')
  async expireOldRecords(): Promise<void> {
    const jobName = 'DisciplineCron'
    try {
      const expired = await db
        .update(discipline_records)
        .set({ isExpired: true })
        .where(
          and(
            eq(discipline_records.isExpired, false),
            eq(discipline_records.isSoftDeleted, false),
            lt(discipline_records.issuedDate, sql`CURRENT_DATE - INTERVAL '6 months'`),
          ),
        )
        .returning({ id: discipline_records.id })
      const count = expired.length
      this.logger.log(`✅ DisciplineCron: expired_count=${count} old discipline records`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ DisciplineCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
