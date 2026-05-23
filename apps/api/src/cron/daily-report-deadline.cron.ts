/**
 * @module daily-report-deadline.cron
 * @description At 23:00 every day, mark every employee who didn't submit a
 *   daily report as "ishlamagan" (not worked). HR can later override the
 *   status — only after override does the bot start expecting reports again.
 *
 * @layer Cron (HR)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface MissingReportRow {
  employee_id: number;
  user_id: number;
  full_name: string;
  telegram_chat_id: string | null;
}

@Injectable()
export class DailyReportDeadlineCron {
  private readonly logger = new Logger(DailyReportDeadlineCron.name);
  private readonly time = new TashkentTimeService();

  constructor(@Optional() private readonly telegram: TelegramService) {}

  @Cron('0 23 * * *')  // every day at 23:00 Tashkent
  async markMissingReports(): Promise<void> {
    this.logger.log('Running daily-report-deadline cron...');
    try {
      const today = this.time.today();
      const rows = await db.execute(sql`
        SELECT
          e.id AS employee_id,
          e.user_id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          e.telegram_chat_id
        FROM employees e
        WHERE e.status = 'active'
          AND e.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM hr_daily_reports dr
            WHERE dr.employee_id = e.id
              AND dr.report_date = ${today}
          )
          AND EXISTS (
            SELECT 1 FROM attendance a
            WHERE a.employee_id = e.id
              AND a.check_in_date::date = ${today}
          )
      `);
      const missing = (rows as unknown as { rows: MissingReportRow[] }).rows;
      this.logger.log(`${missing.length} employees missed daily report today`);

      for (const m of missing) {
        // Create placeholder report with "ishlamagan" status (locked, HR override needed)
        await db.execute(sql`
          INSERT INTO hr_daily_reports
            (employee_id, report_date, status, summary, locked, created_at)
          VALUES
            (${m.employee_id}, ${today}, 'ishlamagan',
             'Avto-belgilangan: hisobot 23:00 ga qadar yuborilmadi.',
             true, NOW())
          ON CONFLICT (employee_id, report_date) DO NOTHING
        `);
        if (m.telegram_chat_id && this.telegram) {
          await this.telegram.sendMessage(
            m.telegram_chat_id,
            `⚠️ Bugun siz kunlik hisobotni yubormadingiz. Sizning bugungi holatingiz "ishlamagan" deb belgilandi. HR menejer bilan bog'laning.`,
          ).catch(() => { /* noop */ });
        }
      }
    } catch (err) {
      this.logger.error(`daily-report-deadline cron failed: ${String(err)}`);
    }
  }
}
