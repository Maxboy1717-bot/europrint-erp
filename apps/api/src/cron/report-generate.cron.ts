/**
 * @module report-generate.cron
 * @description Kunlik operatsion sanoq (log) — PDF/Excel HISOBOT GENERATSIYASI EMAS.
 *
 * AUDIT 2026-08-07 — nima topildi va nima QURILMADI
 *   Bu fayl `result.processed = 3 // 3 ta report` deb **to'qib yozardi** — hech qanday
 *   hisobot yaratilmasdi, hech qanday DB so'rovi bo'lmasdi, hech qanday fayl/email
 *   yubormasdi (Q-40 ning eng qo'pol shakli — raqamning o'zi ixtiro qilingan).
 *
 *   ⛔ Eski izohdagi to'liq talab — "Sales/Production/Warehouse Report → PDF/Excel format →
 *   admin email, storage" — BU YERDA QURILMADI. Bu mexanik ulash emas, **yangi xususiyat**:
 *   hisobot shabloni dizayni, fayl generatsiyasi (`exceljs` loyihada bor, lekin bu maqsad
 *   uchun ishlatilmagan), email-yetkazish va saqlash — barchasi qaytadan qurilishi kerak.
 *   Bitta cron faylida "tez tuzatish" sifatida yozib qo'yish yana bir yashil-lekin-yolg'on
 *   natija berardi.
 *
 *   ✅ Egasi ALLAQACHON kunlik hisobot oladi — boshqa yo'ldan: `OwnerSummaryDailyCron`
 *   (`director/infrastructure/cron/owner-summary-daily.cron.ts`, har kuni 08:00) haqiqiy
 *   Telegram push yuboradi (5 ta asosiy ko'rsatkich). PDF/Excel emas, lekin real va ishlaydi.
 *
 *   Shuning uchun bu cron endi **faqat haqiqiy kunlik sonlarni hisoblab log qiladi** — soxta
 *   "hisobot yaratildi" da'vosisiz. Fayl/email qurilishi — alohida, kattaroq vazifa
 *   (egasi ustuvorlik belgilashi kerak).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'

@Injectable()
export class ReportGenerateCron {
  private readonly logger = new Logger(ReportGenerateCron.name)

  @Cron('0 23 * * *')
  async run(): Promise<void> {
    try {
      const salesRes = await runQuery<{ cnt: string }>(
        sql`SELECT COUNT(*)::text AS cnt FROM sales_orders WHERE DATE(created_at) = CURRENT_DATE AND deleted_at IS NULL`,
      ).catch(() => ({ rows: [{ cnt: '0' }] }))
      const salesCount = Number(salesRes.rows[0]?.cnt ?? 0)

      const prodRes = await runQuery<{ cnt: string }>(
        sql`SELECT COUNT(*)::text AS cnt FROM production_orders WHERE DATE(created_at) = CURRENT_DATE`,
      ).catch(() => ({ rows: [{ cnt: '0' }] }))
      const prodCount = Number(prodRes.rows[0]?.cnt ?? 0)

      const whRes = await runQuery<{ cnt: string }>(
        sql`SELECT COUNT(*)::text AS cnt FROM pos_movements WHERE DATE(created_at) = CURRENT_DATE`,
      ).catch(() => ({ rows: [{ cnt: '0' }] }))
      const whCount = Number(whRes.rows[0]?.cnt ?? 0)

      this.logger.log(
        `ReportGenerate (operatsion kunlik sanoq, PDF/Excel EMAS): bugungi_sotuv_buyurtmalari=${salesCount}, ` +
          `ishlab_chiqarish_buyurtmalari=${prodCount}, ombor_harakatlari=${whCount}. ` +
          `Fayl/email generatsiyasi qurilmagan — egasi Telegram orqali OwnerSummaryDailyCron'dan kunlik hisobot oladi.`,
      )
    } catch (err) {
      this.logger.error(`ReportGenerate cron xatosi: ${String(err)}`)
    }
  }
}
