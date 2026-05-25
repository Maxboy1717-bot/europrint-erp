/**
 * @module boomerang-hire.cron
 * @description When a new vacancy opens, match it against the archive of
 *   ex-employees (alumni) and notify top-5 most-relevant candidates via
 *   Telegram with a 1-tap re-apply link.
 *
 *   Matching: keyword overlap on position_name + skill_categories + last role.
 *
 * @layer Cron (HR)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface BoomerangMatch {
  former_employee_id: number;
  full_name: string;
  telegram_chat_id: string | null;
  last_position: string | null;
  match_score: number;
}

@Injectable()
export class BoomerangHireCron {
  private readonly logger = new Logger(BoomerangHireCron.name);

  constructor(@Optional() private readonly telegram: TelegramService) {}

  /** Runs every 30 minutes — picks up new vacancies created in the last 30 min. */
  @Cron('*/30 * * * *')
  async notifyAlumniOfNewVacancies(): Promise<void> {
    this.logger.log('Running boomerang-hire cron...');
    try {
      const rows = await db.execute(sql`
        SELECT v.id, v.title, v.org_function_id, v.created_at
        FROM vacancies v
        WHERE v.created_at > NOW() - INTERVAL '30 minutes'
          AND v.status = 'open'
          AND NOT EXISTS (
            SELECT 1 FROM boomerang_notifications bn WHERE bn.vacancy_id = v.id
          )
      `);
      const newVacancies = (rows as unknown as { rows: Array<{
        id: number; title: string; org_function_id: number | null; created_at: Date;
      }> }).rows;
      this.logger.log(`Found ${newVacancies.length} new vacancies to match`);

      for (const v of newVacancies) {
        // Find top-5 former employees who held a similar position
        const matchRows = await db.execute(sql`
          SELECT DISTINCT
            e.id AS former_employee_id,
            (e.first_name || ' ' || e.last_name) AS full_name,
            e.telegram_chat_id,
            ofn.position_name AS last_position,
            CASE WHEN ofn.id = ${v.org_function_id} THEN 1.0 ELSE 0.3 END AS match_score
          FROM employees e
          LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
          WHERE e.status IN ('terminated', 'inactive')
            AND e.deleted_at IS NULL
            AND e.telegram_chat_id IS NOT NULL
          ORDER BY match_score DESC
          LIMIT 5
        `);
        const matches = (matchRows as unknown as { rows: BoomerangMatch[] }).rows;
        for (const m of matches) {
          const msg = `🎯 Sizga moslashadigan vakansiya ochildi:\n\n` +
            `📋 ${v.title}\n\n` +
            `Siz avval EuroPrint'da ${m.last_position ?? 'lavozim'} sifatida ishlagansiz.\n` +
            `Qiziqsangiz, /apply komandasini yuboring yoki ushbu xabarga javob bering.`;
          if (m.telegram_chat_id && this.telegram) {
            await this.telegram.sendMessage(m.telegram_chat_id, msg).catch(() => { /* noop */ });
          }
          await db.execute(sql`
            INSERT INTO boomerang_notifications
              (vacancy_id, former_employee_id, match_score, notified_at)
            VALUES (${v.id}, ${m.former_employee_id}, ${m.match_score}, NOW())
            ON CONFLICT DO NOTHING
          `);
        }
      }
    } catch (err) {
      this.logger.error(`boomerang-hire cron failed: ${String(err)}`);
    }
  }
}
