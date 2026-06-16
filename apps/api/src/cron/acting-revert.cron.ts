/**
 * @module acting-revert.cron
 * @description EP-ORG-060 — daily housekeeping that physically deactivates i.o./acting employee_cards
 *   links whose end date has passed. The on-read guard (CardRepository: ended_at > now()) already
 *   excludes expired acting links from salary sums + occupancy, so this is a tidy-up mirror, not the
 *   source of truth (correctness holds even if a run is missed). Delegates to the repository (Qoida 15).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CardRepository } from '../modules/org-structure/card.repository'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class ActingRevertCron {
  private readonly logger = new Logger(ActingRevertCron.name)
  constructor(
    private readonly cards: CardRepository,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron('0 1 * * *')
  async revertExpiredActing(): Promise<void> {
    const jobName = 'ActingRevertCron'
    const r = await this.cards.revertExpiredActing()
    if (!r.ok) {
      this.logger.error(`❌ ActingRevertCron error: ${r.error.message}`)
      this.cronStatus.recordFailure(jobName, r.error.message)
      return
    }
    if (r.data > 0) this.logger.log(`✅ ActingRevertCron: reverted ${r.data} expired acting link(s)`)
    else this.logger.log('✅ ActingRevertCron: no expired acting links')
    this.cronStatus.recordSuccess(jobName)
  }
}
