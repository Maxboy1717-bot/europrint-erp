/**
 * @module qc-certificate-expiry.cron
 * @description Vision 09-qc.md #28 — "Cron tunda sertifikat muddat tekshiradi; sifat
 *   boshlig'i+direktor; muddat o'tsa buyurtma blok (SD ham)". Discovery sweep 2026-08-03
 *   fix ("QC mahsulot sertifikati muddati tekshirilmaydi, SD blok yo'q"): certificates
 *   never had an expiry_date set (see QcCertificatePdfService.persistCertificate /
 *   QcNewRepository.insertCertificate — both now stamp one via
 *   QC_CERTIFICATE_DEFAULT_VALIDITY_DAYS) and nothing ever scanned for expired ones.
 *
 *   Daily sweep: any order-linked certificate still 'active' whose expiry_date has
 *   passed flips to 'expired' and notifies qc_manager + director (CreateNotificationCommand
 *   — same role-notify pattern as FpCycleCronService.notifyRoles). The actual "buyurtma
 *   blok (SD ham)" half of this vision item is enforced synchronously at delivery time —
 *   see DeliveriesService.updateStatus() / ISdDeliveriesRepository.hasExpiredCertificate()
 *   — not via this cron, so a delivery attempted BEFORE the nightly sweep runs is still
 *   correctly blocked (it reads expiry_date live, not the 'expired' status flag).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { CronStatusService } from './cron-status.service'

interface ExpiredCertRow {
  id: number
  cert_number: string | null
  order_id: number | null
  product_name: string | null
}

interface EmployeeIdRow {
  id: number
}

const NOTIFY_ROLES = ['qc_manager', 'director']

@Injectable()
export class QcCertificateExpiryCron {
  private readonly logger = new Logger(QcCertificateExpiryCron.name)

  constructor(
    private readonly commandBus: CommandBus,
    private readonly cronStatus: CronStatusService,
  ) {}

  /** 04:00 daily — after CardStalenessCron (03:00), ahead of morning digests. */
  @Cron('0 4 * * *')
  async checkExpiredCertificates(): Promise<void> {
    const jobName = 'QcCertificateExpiryCron'
    try {
      const expired = await runQuery<ExpiredCertRow>(sql`
        UPDATE certificates
           SET status = 'expired', updated_at = NOW()
         WHERE status = 'active'
           AND order_id IS NOT NULL
           AND expiry_date IS NOT NULL
           AND expiry_date::date < CURRENT_DATE
        RETURNING id, cert_number, order_id, product_name
      `)

      if (expired.rows.length === 0) {
        this.logger.log('✅ QcCertificateExpiryCron: no newly-expired certificates')
        this.cronStatus.recordSuccess(jobName)
        return
      }

      const idsResult = await runQuery<EmployeeIdRow>(sql`
        SELECT id FROM employees WHERE role = ANY(${NOTIFY_ROLES}::text[]) AND status = 'active' LIMIT 100
      `)
      const recipientIds = idsResult.rows.map((r) => r.id).filter((id) => Number.isInteger(id) && id > 0)

      for (const cert of expired.rows) {
        const title = `⚠️ Sertifikat muddati tugadi — ${cert.cert_number ?? `#${cert.id}`}`
        const body = `Buyurtma #${cert.order_id ?? '-'} (${cert.product_name ?? 'mahsulot noma\'lum'}) sertifikati muddati o'tdi. Yangi yetkazib berish shu sertifikat bilan bloklanadi.`
        await Promise.allSettled(
          recipientIds.map((userId) =>
            this.commandBus.execute(
              new CreateNotificationCommand(String(userId), title, body, 'qc_certificate_expired', String(cert.id), 'certificate'),
            ),
          ),
        )
      }

      this.logger.log(
        `✅ QcCertificateExpiryCron: ${expired.rows.length} certificate(s) expired, ${recipientIds.length} recipient(s) notified`,
      )
      this.cronStatus.recordSuccess(jobName)
    } catch (e) {
      const message = (e as Error)?.message ?? String(e)
      this.logger.error(`❌ QcCertificateExpiryCron error: ${message}`)
      this.cronStatus.recordFailure(jobName, message)
    }
  }
}
