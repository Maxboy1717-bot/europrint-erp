/**
 * @module cert-expiry.cron
 * @description Item #62 (discovery sweep 2026-08-05) — "Sertifikat muddati tugashidan oldingi
 *   eskalatsiya (7/5/3 kun) yo'q". Previously a literal no-op stub: ran daily, logged
 *   "processed=0" and returned success=true without ever querying the DB (Q-46 fake-success).
 *
 *   Separately, `CertExpiryHandler.checkExpiringCertificates` (lms/infrastructure/event-handlers/
 *   cert-expiry.handler.ts) already sweeps for ALREADY-expired certs at midnight and flips
 *   status='expired'. This cron is the missing PRE-expiry half: warns the certificate holder +
 *   HR before expiry, at three configurable thresholds (default 7/5/3 days — business_settings,
 *   Q-40, migration lms-cert-expiry-warning-thresholds-2026-08-05.sql). Scoped to LMS training
 *   certs only (course_id IS NOT NULL AND order_id IS NULL) — QC product certs (order_id-based)
 *   have their own cron (qc-certificate-expiry.cron.ts), same NOTIFY-role pattern.
 *
 *   Exact-day match (expiry_date::date = today+N) rather than a "within N days" range, so each
 *   certificate is warned exactly once per threshold crossing without needing a separate
 *   "already warned" tracking column.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { CronStatusService } from './cron-status.service'

interface ExpiringCertRow {
  certificate_id: number
  employee_id: number | null
  course_id: number
  course_name: string | null
  expiry_date: string
  user_id: number | null
}

interface RoleUserIdRow {
  id: number
}

const NOTIFY_ROLES = ['hr_manager']

@Injectable()
export class CertExpiryCron {
  private readonly logger = new Logger(CertExpiryCron.name)

  constructor(
    private readonly commandBus: CommandBus,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron('0 8 * * *')
  async run(): Promise<void> {
    const jobName = 'CertExpiryCron'
    try {
      const days1 = await getBusinessSettingNumber('lms.cert_expiry_warn_days_1', 7)
      const days2 = await getBusinessSettingNumber('lms.cert_expiry_warn_days_2', 5)
      const days3 = await getBusinessSettingNumber('lms.cert_expiry_warn_days_3', 3)
      const thresholds = [...new Set([days1, days2, days3])].filter((d) => Number.isFinite(d) && d > 0)

      const hrIdsResult = await runQuery<RoleUserIdRow>(sql`
        SELECT id FROM employees WHERE role = ANY(${NOTIFY_ROLES}::text[]) AND status = 'active' LIMIT 100
      `)
      const hrRecipientIds = hrIdsResult.rows.map((r) => r.id).filter((id) => Number.isInteger(id) && id > 0)

      let totalWarned = 0
      for (const days of thresholds) {
        const rows = await this.findExpiringExactlyInDays(days)
        for (const cert of rows) {
          const title = `⏰ Sertifikat muddati ${days} kunda tugaydi — ${cert.course_name ?? `#${cert.course_id}`}`
          const body = `"${cert.course_name ?? cert.course_id}" kursi sertifikati ${cert.expiry_date} sanasida tugaydi (${days} kun qoldi). Yangilash/qayta topshirish kerak.`
          const recipientIds = [...hrRecipientIds]
          if (cert.user_id) recipientIds.push(cert.user_id)
          await Promise.allSettled(
            [...new Set(recipientIds)].map((userId) =>
              this.commandBus.execute(
                new CreateNotificationCommand(String(userId), title, body, 'lms_cert_expiring', String(cert.certificate_id), 'certificate'),
              ),
            ),
          )
          totalWarned++
        }
      }

      this.logger.log(`✅ CertExpiryCron: ${totalWarned} certificate(s) warned across ${thresholds.length} threshold(s) [${thresholds.join('/')} kun]`)
      this.cronStatus.recordSuccess(jobName)
    } catch (err) {
      const message = (err as Error)?.message ?? String(err)
      this.logger.error(`❌ CertExpiry error: ${message}`)
      this.cronStatus.recordFailure(jobName, message)
    }
  }

  private async findExpiringExactlyInDays(days: number): Promise<ExpiringCertRow[]> {
    const r = await runQuery<ExpiringCertRow>(sql`
      SELECT cert.id AS certificate_id, cert.employee_id, cert.course_id, c.title_uz AS course_name,
             cert.expiry_date, e.user_id
        FROM certificates cert
        JOIN courses c ON c.id = cert.course_id
        LEFT JOIN employees e ON e.id = cert.employee_id
       WHERE cert.is_active = true
         AND cert.course_id IS NOT NULL
         AND cert.order_id IS NULL
         AND cert.expiry_date IS NOT NULL
         AND cert.expiry_date::date = (CURRENT_DATE + (${days})::integer)
         AND COALESCE(cert.status, '') <> 'expired'
       ORDER BY cert.expiry_date ASC
    `)
    return r.rows
  }
}
