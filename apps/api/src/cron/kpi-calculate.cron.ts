/**
 * @module kpi-calculate.cron
 * @description Kunlik operatsion sanoq — HAQIQIY "KPI hisoblash" EMAS (pastga qarang).
 *
 * AUDIT 2026-08-07 — nima topildi va nima TUZATILMADI
 *   Bu fayl uchta sonni qo'shib "processed" deb log yozardi — mazmunan hech narsani
 *   anglatmaydigan yig'indi (ishlab chiqarish buyurtmalari soni + davomat yozuvlari soni +
 *   KPI qatorlari soni — uch xil o'lchov birligi bitta songa qo'shilgan). Ustiga ikkita real
 *   bug bor edi:
 *     1. `attendance_logs.check_in_at` — bunday ustun UMUMAN YO'Q (`attendance_logs` da faqat
 *        id/employee_id/type/logged_at/source bor) — bu qism `.catch()` bilan yutilib, doim 0
 *        qaytarardi. Kanonik davomat jadvali — `attendance` (`attendance_date` ustuni bilan).
 *     2. `kpi_values` — jadval bor, LEKIN hech qanday kod hech qachon unga yozmaydi (grep → 0
 *        writer). Bu son har doim 0 bo'lardi.
 *
 *   ⛔ **HAQIQIY KPI hisoblash-mantiqi ATAYLAB QURILMADI.** "KPI" nima ekani (formula,
 *   og'irliklar, qaysi ko'rsatkichlar) — biznes qarori (Q-34/Q-40), bu yerda o'ylab topib
 *   yozish fabrikatsiya bo'lardi. `employee-kpi.handler.ts` da alohida, haqiqiy KPI hisobi bor
 *   (lekin u ham hech qayerga saqlamaydi — alohida, hali hal qilinmagan bo'shliq,
 *   `docs/audit/FANTOM-JADVALLAR-2026-08-07.md` §B da qayd etilgan).
 *
 *   Shuning uchun bu cron endi **halol operatsion kunlik hisobot** — uch sonni alohida-alohida
 *   log qiladi, ularni "KPI" yoki "processed" deb bitta qilib qo'shmaydi.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'

@Injectable()
export class KpiCalculateCron {
  private readonly logger = new Logger(KpiCalculateCron.name)

  @Cron('30 23 * * *')
  async run(): Promise<void> {
    try {
      const prodRes = await runQuery<{ cnt: string }>(
        sql`SELECT COUNT(*)::text AS cnt FROM production_orders WHERE DATE(created_at) = CURRENT_DATE`,
      ).catch(() => ({ rows: [{ cnt: '0' }] }))
      const prodCount = Number(prodRes.rows[0]?.cnt ?? 0)

      // Kanonik davomat jadvali — `attendance` (attendance_date), `attendance_logs` EMAS
      // (o'sha jadvalda sana ustuni yo'q — `attendance-check.cron.ts` ham shu jadvaldan o'qiydi).
      const attRes = await runQuery<{ cnt: string }>(
        sql`SELECT COUNT(*)::text AS cnt FROM attendance WHERE attendance_date = CURRENT_DATE`,
      ).catch(() => ({ rows: [{ cnt: '0' }] }))
      const attCount = Number(attRes.rows[0]?.cnt ?? 0)

      this.logger.log(
        `KpiCalculate (operatsion kunlik sanoq): ishlab_chiqarish_buyurtmalari=${prodCount}, ` +
          `davomat_yozuvlari=${attCount}. Haqiqiy KPI hisobi qurilmagan — egasi qarori kutmoqda.`,
      )
    } catch (err) {
      this.logger.error(`KpiCalculate cron xatosi: ${String(err)}`)
    }
  }
}
