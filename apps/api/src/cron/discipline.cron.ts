/**
 * @module discipline.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, discipline_records } from '@shared/db'
import { and, eq, lt, sql } from 'drizzle-orm'
import { CronStatusService } from './cron-status.service'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

@Injectable()
export class DisciplineCron {
  private readonly logger = new Logger(DisciplineCron.name)
  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 1 * * *')
  async expireOldRecords(): Promise<void> {
    const jobName = 'DisciplineCron'
    try {
      // Owner directive 2026-07-13 (HR Nazorat fix): 6-month window is business_settings-driven
      // (hr.discipline_archive_after_months), not hardcoded — Q-40.
      const archiveMonths = await getBusinessSettingNumber('hr.discipline_archive_after_months', 6)
      const expired = await db
        .update(discipline_records)
        .set({ isExpired: true })
        .where(
          and(
            eq(discipline_records.isExpired, false),
            eq(discipline_records.isSoftDeleted, false),
            lt(discipline_records.issuedDate, sql`CURRENT_DATE - (${archiveMonths} * INTERVAL '1 month')`),
          ),
        )
        .returning({ id: discipline_records.id })
      const count = expired.length
      this.logger.log(`✅ DisciplineCron: expired_count=${count} old discipline records`)

      // Vision (owner 2026-07-13): reprimands auto soft-archive after the same window —
      // hidden from the active Intizom list (findDisciplineRecords / discipline-records-compat
      // getDisciplineRecords filter is_archived=false) but never hard-deleted (Q-46), and the
      // cumulative escalation count (discipline-escalation.helper.ts) still includes them.
      const archived = await db
        .update(discipline_records)
        .set({ isArchived: true, archivedAt: new Date() })
        .where(
          and(
            eq(discipline_records.isArchived, false),
            eq(discipline_records.isSoftDeleted, false),
            sql`LOWER(${discipline_records.disciplineType}) = 'reprimand'`,
            lt(discipline_records.issuedDate, sql`CURRENT_DATE - (${archiveMonths} * INTERVAL '1 month')`),
          ),
        )
        .returning({ id: discipline_records.id })
      this.logger.log(`✅ DisciplineCron: archived_count=${archived.length} reprimand records (>${archiveMonths}mo, soft-archived not deleted)`)

      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ DisciplineCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
