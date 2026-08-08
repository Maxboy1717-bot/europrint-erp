/**
 * @module pos-gl-reconciliation.cron
 * @description Discovery sweep 2026-08-03 fix ("GL kanonik 'entries' mirror atomik emas —
 *   best-effort, avto-reconciliation yo'q"). AutoGlPostingService.postForMovement() writes the
 *   atomic pos_gl_postings subledger, then best-effort mirrors the same legs into the canonical
 *   `entries` ledger — a mirror failure is only logger.warn'd (deliberately non-blocking, so a
 *   Finance ledger hiccup never blocks POS movement approval), which meant the two ledgers could
 *   silently diverge with nothing ever finding or fixing it.
 *
 *   Daily sweep: AutoGlPostingService.reconcileMissingCanonicalEntries() finds subledger-posted
 *   movements with no matching canonical entry and retries the mirror (safe — postJournal is
 *   idempotent on its `POS-<movementNumber>` reference). Anything still failing after the retry
 *   is notified to finance_manager + director (same role-notify pattern as
 *   QcCertificateExpiryCron's NOTIFY_ROLES) so a persistent problem gets human attention instead
 *   of silently rotting.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { AutoGlPostingService } from '../modules/pos/application/services/auto-gl-posting.service'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { CronStatusService } from './cron-status.service'

interface EmployeeIdRow {
  id: number
}

const NOTIFY_ROLES = ['finance_manager', 'director']
const SWEEP_LIMIT = 200

@Injectable()
export class PosGlReconciliationCron {
  private readonly logger = new Logger(PosGlReconciliationCron.name)

  constructor(
    private readonly autoGlPosting: AutoGlPostingService,
    private readonly commandBus: CommandBus,
    private readonly cronStatus: CronStatusService,
  ) {}

  /** 05:00 daily — after QcCertificateExpiryCron (04:00). */
  @Cron('0 5 * * *')
  async reconcile(): Promise<void> {
    const jobName = 'PosGlReconciliationCron'
    try {
      const result = await this.autoGlPosting.reconcileMissingCanonicalEntries(SWEEP_LIMIT)
      if (!result.ok) {
        this.logger.error(`❌ PosGlReconciliationCron error: ${result.error.message}`)
        this.cronStatus.recordFailure(jobName, result.error.message)
        return
      }
      const { checked, posted, stillFailing } = result.data

      if (checked === 0) {
        this.logger.log('✅ PosGlReconciliationCron: no divergence found')
        this.cronStatus.recordSuccess(jobName)
        return
      }

      this.logger.log(
        `✅ PosGlReconciliationCron: ${checked} checked, ${posted} backfilled, ${stillFailing.length} still failing`,
      )

      if (stillFailing.length > 0) {
        const idsResult = await runQuery<EmployeeIdRow>(sql`
          SELECT id FROM employees WHERE role = ANY(${NOTIFY_ROLES}::text[]) AND status = 'active' LIMIT 100
        `)
        const recipientIds = idsResult.rows.map((r) => r.id).filter((id) => Number.isInteger(id) && id > 0)
        const title = `⚠️ GL rekonsiliatsiya: ${stillFailing.length} ta harakat kanonik yozuvsiz qoldi`
        const body = `Harakatlar: ${stillFailing.slice(0, 20).join(', ')}${stillFailing.length > 20 ? ` va yana ${stillFailing.length - 20} ta` : ''}. pos_gl_postings subledger yozildi, lekin entries kanonik ledgeriga ko'chirilmadi — qo'lda tekshiring.`
        await Promise.allSettled(
          recipientIds.map((userId) =>
            this.commandBus.execute(
              new CreateNotificationCommand(String(userId), title, body, 'pos_gl_reconciliation_failed', undefined, 'pos_gl_posting'),
            ),
          ),
        )
      }

      this.cronStatus.recordSuccess(jobName)
    } catch (e) {
      const message = (e as Error)?.message ?? String(e)
      this.logger.error(`❌ PosGlReconciliationCron error: ${message}`)
      this.cronStatus.recordFailure(jobName, message)
    }
  }
}
