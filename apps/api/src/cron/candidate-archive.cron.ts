/**
 * @module candidate-archive.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { db, candidates } from '@shared/db'
import { and, eq, lt, sql } from 'drizzle-orm'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class CandidateArchiveCron {
  private readonly logger = new Logger(CandidateArchiveCron.name)
  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 2 * * *')
  async archiveRejectedCandidates(): Promise<void> {
    const jobName = 'CandidateArchiveCron'
    try {
      const archived = await db
        .update(candidates)
        .set({ status: 'archived' })
        .where(
          and(
            eq(candidates.status, 'rejected'),
            lt(candidates.updated_at, sql`NOW() - INTERVAL '6 months'`),
          ),
        )
        .returning({ id: candidates.id })
      const count = archived.length
      if (count > 0) this.logger.log(`✅ CandidateArchiveCron: archived ${count} rejected candidates older than 6 months`)
      else this.logger.log(`✅ CandidateArchiveCron: no candidates to archive`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) { this.logger.error(`❌ CandidateArchiveCron error: ${String(err)}`); this.cronStatus.recordFailure(jobName, String(err)) }
  }
}
