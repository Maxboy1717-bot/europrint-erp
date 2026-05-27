/**
 * @module kpi-calculate.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { db } from '@shared/db'

@Injectable()
export class KpiCalculateCron {
  private readonly logger = new Logger(KpiCalculateCron.name)

  @Cron('30 23 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    this.logger.log('KpiCalculate: boshlandi')
    try {
      // ── Bugungi ishlab chiqarilgan buyurtmalar soni ─────────────────────
      const prodRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM production_orders WHERE DATE(created_at) = CURRENT_DATE`
      ).catch(() => null)
      const prodCount = Number(
        (prodRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0
      )
      result.processed += prodCount

      // ── Bugungi davomat yozuvlari soni ──────────────────────────────────
      const attRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM attendance_logs WHERE DATE(check_in_at) = CURRENT_DATE`
      ).catch(() => null)
      const attCount = Number(
        (attRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0
      )
      result.processed += attCount

      // ── KPI yozuvlari — bugun kiritilgan ────────────────────────────────
      const kpiRows = await db.execute(
        sql`SELECT COUNT(*)::int AS cnt FROM kpi_values WHERE DATE(recorded_at) = CURRENT_DATE`
      ).catch(() => null)
      const kpiCount = Number(
        (kpiRows as { rows?: { cnt?: unknown }[] } | null)?.rows?.[0]?.cnt ?? 0
      )
      result.processed += kpiCount

      result.success = true
      this.logger.log(
        `✅ KpiCalculate: processed=${result.processed} ` +
        `(prod=${prodCount}, att=${attCount}, kpi=${kpiCount})`
      )
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ KpiCalculate error: ${String(err)}`)
    }
  }
}
