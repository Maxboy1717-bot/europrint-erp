/**
 * @module late-arrival-fine.cron
 * @description Daily check at 10:00 — for every employee who arrived AFTER
 *   their shift's startTime + grace period, generate a fine PROPOSAL document.
 *   The fine is NOT applied until the employee accepts it (or HR overrides).
 *
 *   Employee gets a Telegram message: "Kech kelganingiz uchun jarima taklif
 *   qilindi, sabab yozing." — they can either accept or contest.
 *
 * @layer Cron (HR / discipline)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const GRACE_PERIOD_MIN = 5;       // 5 min grace
const DEFAULT_FINE_UZS = 50000;   // 50,000 UZS for late arrival

interface LateArrivalRow {
  employee_id: number;
  user_id: number;
  full_name: string;
  telegram_chat_id: string | null;
  shift_start: string;
  arrived_at: Date;
  minutes_late: number;
}

@Injectable()
export class LateArrivalFineCron {
  private readonly logger = new Logger(LateArrivalFineCron.name);
  private readonly time = new TashkentTimeService();

  constructor(@Optional() private readonly telegram: TelegramService) {}

  @Cron('0 10 * * *')  // every day at 10:00 Tashkent time
  async generateLateArrivalProposals(): Promise<void> {
    this.logger.log('Running late-arrival-fine cron...');
    try {
      const today = this.time.today();
      const rows = await db.execute(sql`
        SELECT
          e.id AS employee_id,
          e.user_id,
          (e.first_name || ' ' || e.last_name) AS full_name,
          e.telegram_chat_id,
          st.start_time AS shift_start,
          a.check_in_time AS arrived_at,
          EXTRACT(EPOCH FROM (a.check_in_time - (a.check_in_date::date + st.start_time::time)))/60 AS minutes_late
        FROM attendance a
        JOIN employees e ON e.id = a.employee_id
        LEFT JOIN shift_assignments sa ON sa.employee_id = e.id AND sa.assignment_date = a.check_in_date::date
        LEFT JOIN shift_types st ON st.id = sa.shift_type_id
        WHERE a.check_in_date::date = ${today}
          AND a.check_in_time IS NOT NULL
          AND st.start_time IS NOT NULL
          AND EXTRACT(EPOCH FROM (a.check_in_time - (a.check_in_date::date + st.start_time::time)))/60 > ${GRACE_PERIOD_MIN}
          AND NOT EXISTS (
            SELECT 1 FROM hr_disciplinary_actions da
            WHERE da.employee_id = e.id
              AND da.action_date = ${today}
              AND da.action_type = 'late_fine_proposal'
          )
      `);
      const data = (rows as unknown as { rows: LateArrivalRow[] }).rows;
      this.logger.log(`Found ${data.length} late-arrival cases today`);

      for (const r of data) {
        const minutesLate = Math.round(r.minutes_late);
        const fineAmount = Math.min(DEFAULT_FINE_UZS, minutesLate * 5000);  // 5000 UZS per minute, capped
        // Create proposal (not applied until accepted)
        await db.execute(sql`
          INSERT INTO hr_disciplinary_actions
            (employee_id, action_type, action_date, severity, description, proposed_fine_uzs, status, created_at)
          VALUES
            (${r.employee_id}, 'late_fine_proposal', ${this.time.today()}, 'minor',
             ${`Kech kelish: ${minutesLate} daqiqa kechikish.`}, ${fineAmount}, 'proposed', NOW())
        `);

        // Notify employee via Telegram
        if (r.telegram_chat_id && this.telegram) {
          const msg = `⚠️ Hurmatli ${r.full_name},\n\nBugun siz ${minutesLate} daqiqa kech kelibsiz.\n` +
            `Taklif qilingan jarima: ${fineAmount.toLocaleString('uz-UZ')} so'm\n\n` +
            `Iltimos, sababni 3 soat ichida yozing — aks holda jarima avtomatik qo'llaniladi.`;
          await this.telegram.sendMessage(r.telegram_chat_id, msg).catch(() => { /* noop */ });
        }
      }
    } catch (err) {
      this.logger.error(`late-arrival-fine cron failed: ${String(err)}`);
    }
  }
}
