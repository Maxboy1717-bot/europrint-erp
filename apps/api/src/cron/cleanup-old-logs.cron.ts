/**
 * @module cleanup-old-logs.cron
 * @description Eski so'rov-loglarini (`audit_log`) hisoblash va — egasi yoqsa — o'chirish.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har yakshanba "✅ muvaffaqiyatli"
 *   deb log yozardi (`iot-data-cleanup.cron.ts` bilan bir xil naqsh).
 *
 * QARORLAR
 *   - Kanonik jadval — `audit_log` (birlik). `audit-all.interceptor.ts`/`audit.interceptor.ts`
 *     har HTTP so'rovni yozadi (controller/method/ip/duration_ms) — eski izohdagi
 *     "System logs, API logs" aynan shu. `audit_logs` (ko'plik) — BOSHQA jadval, entity
 *     o'zgarish-tarixi (kim nimani o'zgartirdi) — bu retention-tozalash uchun MOS EMAS
 *     (muvofiqlik/audit maqsadida saqlanishi kerak, avtomatik o'chirilmasin).
 *   - Boshqa "log/audit" jadvallar (`agents_audit_log`, `hr_daily_report_audit`,
 *     `pos_audit_log`, `cc_audit_trail`, ...) qasddan qamrab olinmadi — har biri o'z modulining
 *     domen-audit tarixi, "eski loglarni o'chirish" bilan bir xil emas.
 *   - `iot-data-cleanup.cron.ts` bilan bir xil xavfsiz naqsh: default'da faqat SANAYDI,
 *     o'chirish `business_settings.audit.log_retention_enabled` orqali egasi yoqmaguncha
 *     ISHLAMAYDI (agregat/arxiv jadvali yo'q — o'chirish qaytarib bo'lmaydi).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** `business_settings.audit.log_retention_days` — fallback qiymat. */
const RETENTION_DAYS_FALLBACK = 90
/** `business_settings.audit.log_retention_enabled` — fallback (0 = faqat hisoblaydi). */
const RETENTION_ENABLED_FALLBACK = 0

@Injectable()
export class CleanupOldLogsCron {
  private readonly logger = new Logger(CleanupOldLogsCron.name)

  @Cron('0 2 * * 0')
  async run(): Promise<void> {
    try {
      const retentionDays = await getBusinessSettingNumber('audit.log_retention_days', RETENTION_DAYS_FALLBACK)
      const deleteEnabled = (await getBusinessSettingNumber('audit.log_retention_enabled', RETENTION_ENABLED_FALLBACK)) === 1

      const cutoff = sql`NOW() - (${retentionDays}::int * INTERVAL '1 day')`
      const countRes = await runQuery<{ n: string }>(
        sql`SELECT COUNT(*)::text AS n FROM audit_log WHERE created_at < ${cutoff}`,
      )
      const expired = Number(countRes.rows[0]?.n ?? 0)

      if (!deleteEnabled) {
        this.logger.log(
          `CleanupOldLogs: saqlash muddati ${retentionDays} kun — ${expired} qator muddati o'tgan. ` +
            `O'chirish O'CHIRILGAN (business_settings.audit.log_retention_enabled=0) — hech narsa o'chirilmadi.`,
        )
        return
      }

      if (expired === 0) {
        this.logger.log('CleanupOldLogs: muddati o\'tgan yozuv topilmadi')
        return
      }

      const delRes = await runQuery<{ n: string }>(
        sql`WITH d AS (DELETE FROM audit_log WHERE created_at < ${cutoff} RETURNING 1)
            SELECT COUNT(*)::text AS n FROM d`,
      )
      const deleted = Number(delRes.rows[0]?.n ?? 0)
      this.logger.warn(`CleanupOldLogs: ${deleted} ta eski audit_log yozuvi o'chirildi (>${retentionDays} kun)`)
    } catch (err) {
      this.logger.error(`CleanupOldLogs cron xatosi: ${String(err)}`)
    }
  }
}
