/**
 * @module iot-data-cleanup.cron
 * @description Telemetriya saqlash muddati (retention) — haftalik hisob va ixtiyoriy tozalash.
 *
 * AUDIT 2026-08-07 — NIMA UCHUN QAYTA YOZILDI
 *   Bu cron `cron.module.ts` da ro'yxatdan o'tgan va `cron-status.service.ts` da "bor" deb
 *   ko'rsatilardi, lekin metod tanasida **bironta DB so'rovi yo'q edi**: `processed = 0` qattiq
 *   yozilgan, `success = true` qo'yilgan va `✅ IotDataCleanup: processed=0` log chiqarilardi.
 *   Ya'ni tizim har shanba "tozalash muvaffaqiyatli" deb hisobot berardi, hech narsa qilmasdan —
 *   Qoida 10 / Q-40 ning eng aniq buzilishi ("yashil lekin noto'g'ri").
 *
 * NIMA UCHUN DEFAULT'DA O'CHIRMAYDI
 *   Jonli bazada agregat/xulosa jadvali YO'Q (`information_schema` tekshirildi: faqat xom
 *   `mes_telemetry`, `iot_sensor_readings`, `sensor_readings`). Demak xom qatorni o'chirish =
 *   ma'lumotni butunlay yo'qotish, orqaga qaytarib bo'lmaydi. Eski izohdagi "90 kun → coldstore
 *   (S3 Glacier)" arxiv-yo'li ham qurilmagan va uni bor deb ko'rsatish yana o'sha soxta-muvaffaqiyat
 *   bo'lardi.
 *
 *   Shuning uchun cron endi HAR DOIM real ish qiladi — chegaradan eski qatorlarni **sanaydi** va
 *   haqiqiy raqamni log qiladi — lekin **o'chirish faqat egasi `iot.telemetry_retention_enabled`
 *   ni 1 ga qo'yganda** bajariladi. Ikkala qiymat ham `business_settings` da, ya'ni CRUD orqali
 *   sozlanadi (egasi qoidasi: chegara qiymatlari hech qachon kodda qotib qolmaydi).
 *
 * NIMA UCHUN JADVAL RO'YXATI QO'LDA
 *   Uchala jadval ham `recorded_at` ustuniga ega (jonli tasdiqlangan). Yangi telemetriya jadvali
 *   qo'shilsa shu ro'yxatga qo'shiladi — avtomatik topish DDL-skanerlashni talab qiladi va
 *   tasodifan biznes-jadvalini o'chirib yuborish xavfini tug'diradi.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** Saqlash muddati (kun) — `business_settings.iot.telemetry_retention_days`. */
const RETENTION_DAYS_KEY = 'iot.telemetry_retention_days'
const RETENTION_DAYS_DEFAULT = 90

/** O'chirishni yoqish (1 = o'chir, 0 = faqat sana) — `business_settings.iot.telemetry_retention_enabled`. */
const RETENTION_ENABLED_KEY = 'iot.telemetry_retention_enabled'
const RETENTION_ENABLED_DEFAULT = 0

/**
 * Xom telemetriya jadvallari va ularning sana ustuni. Hammasi `recorded_at` ishlatadi
 * (`information_schema`, 2026-08-07).
 */
const TELEMETRY_TABLES = ['mes_telemetry', 'iot_sensor_readings', 'sensor_readings'] as const

interface TableSweepResult {
  table: string
  expired: number
  deleted: number
  error?: string
}

@Injectable()
export class IotDataCleanupCron {
  private readonly logger = new Logger(IotDataCleanupCron.name)

  @Cron('0 2 * * 6')
  async run(): Promise<{ retentionDays: number; deleteEnabled: boolean; tables: TableSweepResult[] }> {
    const retentionDays = await getBusinessSettingNumber(RETENTION_DAYS_KEY, RETENTION_DAYS_DEFAULT)
    const deleteEnabled = (await getBusinessSettingNumber(RETENTION_ENABLED_KEY, RETENTION_ENABLED_DEFAULT)) === 1

    const tables: TableSweepResult[] = []
    for (const table of TELEMETRY_TABLES) {
      tables.push(await this.sweepTable(table, retentionDays, deleteEnabled))
    }

    const totalExpired = tables.reduce((s, t) => s + t.expired, 0)
    const totalDeleted = tables.reduce((s, t) => s + t.deleted, 0)
    const failed = tables.filter((t) => t.error)

    if (failed.length > 0) {
      // Xato yutilmaydi — qaysi jadval yiqilgani aniq nomlanadi (avvalgi versiya hammasini
      // jimgina muvaffaqiyat deb ko'rsatardi).
      this.logger.warn(
        `IotDataCleanup: ${failed.length} jadval tekshirilmadi — ${failed.map((t) => `${t.table}: ${t.error}`).join(' | ')}`,
      )
    }

    if (deleteEnabled) {
      this.logger.log(
        `IotDataCleanup: saqlash muddati ${retentionDays} kun — ${totalDeleted} qator o'chirildi (${totalExpired} muddati o'tgan edi)`,
      )
    } else {
      this.logger.log(
        `IotDataCleanup: saqlash muddati ${retentionDays} kun — ${totalExpired} qator muddati o'tgan. ` +
          `O'chirish O'CHIRILGAN (business_settings.${RETENTION_ENABLED_KEY}=0) — hech narsa o'chirilmadi. ` +
          `Yoqish uchun qiymatni 1 ga o'zgartiring.`,
      )
    }

    return { retentionDays, deleteEnabled, tables }
  }

  /**
   * Bitta jadvalni tekshiradi: muddati o'tgan qatorlarni sanaydi va (yoqilgan bo'lsa) o'chiradi.
   * Jadval yo'q bo'lsa xato qaytaradi — jimgina 0 EMAS, aks holda yana "yashil yolg'on" bo'lardi.
   */
  private async sweepTable(table: string, retentionDays: number, deleteEnabled: boolean): Promise<TableSweepResult> {
    // Jadval nomlari yuqoridagi `as const` ro'yxatdan keladi (foydalanuvchi kiritmaydi), shuning
    // uchun `sql.raw` bu yerda xavfsiz — CLAUDE.md Qoida B, literal-only istisno.
    const cutoff = sql`NOW() - (${retentionDays}::int * INTERVAL '1 day')`
    try {
      const countRes = await runQuery<{ n: string }>(
        sql`SELECT COUNT(*)::text AS n FROM ${sql.raw(table)} WHERE recorded_at < ${cutoff}`,
      )
      const expired = Number(countRes.rows[0]?.n ?? 0)
      if (!deleteEnabled || expired === 0) return { table, expired, deleted: 0 }

      const delRes = await runQuery<{ n: string }>(
        sql`WITH d AS (DELETE FROM ${sql.raw(table)} WHERE recorded_at < ${cutoff} RETURNING 1)
            SELECT COUNT(*)::text AS n FROM d`,
      )
      return { table, expired, deleted: Number(delRes.rows[0]?.n ?? 0) }
    } catch (err) {
      return { table, expired: 0, deleted: 0, error: (err as Error).message }
    }
  }
}
