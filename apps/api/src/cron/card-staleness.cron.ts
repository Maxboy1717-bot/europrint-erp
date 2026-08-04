/**
 * @module card-staleness.cron
 * @description EP-ORG-137 — daily scan for cards whose annual review is overdue
 *   (org_departments.last_reviewed_at IS NULL or > 1 year old). Publishes CardExpiredEvent
 *   per stale card so consumers (HR digest, notifications — future wiring) can react.
 *   Delegates to CardRepository.listStaleCards() (Qoida 15). Read-only — never mutates
 *   current_state; a stale card keeps whatever state it's currently in. The owner clears the
 *   flag per-card via CardService.markReviewed() (resets last_reviewed_at).
 *
 *   Gap fixed (discovery sweep 2026-08-03, "CardStatusChangedEvent/CardExpiredEvent yo'q"):
 *   org_departments.last_reviewed_at + the is_stale SELECT expression already existed
 *   (EP-ORG-137), but nothing ever SCANNED for stale cards or emitted a signal — the field
 *   was read-only decoration on card.findById()/list(), never actively checked. Mirrors
 *   ActingRevertCron (../modules/org-structure/card.repository.ts revertExpiredActing) — same
 *   CardRepository provider, same CronStatusService monitoring hookup.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CardRepository } from '../modules/org-structure/card.repository'
import { CARD_EXPIRED_EVENT, CardExpiredEvent } from '../modules/org-structure/card-lifecycle.events'
import { CronStatusService } from './cron-status.service'

@Injectable()
export class CardStalenessCron {
  private readonly logger = new Logger(CardStalenessCron.name)

  constructor(
    private readonly cards: CardRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly cronStatus: CronStatusService,
  ) {}

  /** 03:00 daily — after ActingRevertCron (01:00), ahead of morning HR digests. */
  @Cron('0 3 * * *')
  async checkStaleCards(): Promise<void> {
    const jobName = 'CardStalenessCron'
    const r = await this.cards.listStaleCards()
    if (!r.ok) {
      this.logger.error(`❌ CardStalenessCron error: ${r.error.message}`)
      this.cronStatus.recordFailure(jobName, r.error.message)
      return
    }

    let emitted = 0
    for (const row of r.data) {
      const cardId = Number(row.id)
      if (!Number.isInteger(cardId) || cardId <= 0) continue
      const lastReviewedAt = row.last_reviewed_at != null ? String(row.last_reviewed_at) : null
      try {
        this.eventEmitter.emit(
          CARD_EXPIRED_EVENT,
          new CardExpiredEvent(cardId, String(row.position_name ?? ''), lastReviewedAt),
        )
        emitted++
      } catch (e) {
        this.logger.warn(`org.card.expired emit skipped (card=${cardId}): ${String(e)}`)
      }
    }

    if (emitted > 0) this.logger.log(`✅ CardStalenessCron: ${emitted} stale card(s) flagged (org.card.expired)`)
    else this.logger.log('✅ CardStalenessCron: no stale cards')
    this.cronStatus.recordSuccess(jobName)
  }
}
