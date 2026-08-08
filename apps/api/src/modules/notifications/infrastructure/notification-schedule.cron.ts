/**
 * @module notification-schedule.cron
 * @description Modul 18 (Bildirishnoma) — markaziy `notification_schedules` matritsasini
 *   iste'mol qiluvchi planlovchi. Vizyon (NTF Q3/Q79): bildirishnomalar markazdan,
 *   egasi-sozlanadigan jadval bo'yicha yuboriladi (hardcoded cron tarqoqligi o'rniga).
 *
 *   Har soat: muddati kelgan (next_run_at <= NOW) faol jadvallarni topadi, target
 *   (role yoki aniq user) bo'yicha `notifications` ga yozadi, so'ng next_run_at ni
 *   interval_hours ga suradi (takror). Jadval bo'sh bo'lsa — no-op.
 *
 * NOTE: Raw SQL — set-based INSERT...SELECT (role bo'yicha bir o'tishda barcha foydalanuvchilarga),
 *   interval arifmetikasi `(${hours} || ' hours')::interval`. See ARCHITECTURE_RULES.md Rule 4.
 * @layer Cron (Notifications)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

interface ScheduleRow {
  id: number;
  notification_type: string;
  target_role: string | null;
  target_user_id: number | null;
  title_uz: string;
  title_ru: string | null;
  body_uz: string;
  body_ru: string | null;
  priority: string;
  interval_hours: number;
}

@Injectable()
export class NotificationScheduleCron {
  private readonly logger = new Logger(NotificationScheduleCron.name);

  /** Har soatning boshida — muddati kelgan jadvallarni yuborish. */
  @Cron('0 * * * *')
  async runDue(): Promise<void> {
    try {
      const due = await runQuery<ScheduleRow>(sql`
        SELECT id, notification_type, target_role, target_user_id,
               title_uz, title_ru, body_uz, body_ru, priority, interval_hours
        FROM notification_schedules
        WHERE is_active = TRUE AND next_run_at <= NOW()
      `);
      if (due.rows.length === 0) return;
      this.logger.log(`Notification-schedule: ${due.rows.length} jadval yuborilmoqda`);

      for (const s of due.rows) {
        const fired = await this.fire(s);
        // muddatni surish (takror) — fired soniga qaramay, jadval keyingi davrga o'tadi
        await runQuery(sql`
          UPDATE notification_schedules
          SET last_run_at = NOW(),
              next_run_at = NOW() + (${s.interval_hours} || ' hours')::interval,
              updated_at  = NOW()
          WHERE id = ${s.id}
        `);
        this.logger.log(`  #${s.id} ${s.notification_type}: ${fired} bildirishnoma`);
      }
    } catch (e) {
      this.logger.error(`runDue: ${(e as Error).message}`);
    }
  }

  /** Bitta jadval uchun target(lar)ga notifications yozadi; yozilgan qatorlar sonini qaytaradi. */
  private async fire(s: ScheduleRow): Promise<number> {
    if (s.target_user_id) {
      await runQuery(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, priority, title_uz, title_ru, message_uz, message_ru,
           reference_id, reference_type, created_at)
        VALUES
          (${s.target_user_id}, ${s.notification_type}, ${s.title_uz}, ${s.body_uz}, FALSE, ${s.priority},
           ${s.title_uz}, ${s.title_ru}, ${s.body_uz}, ${s.body_ru}, ${s.id}, 'notification_schedule', NOW())
      `);
      return 1;
    }
    if (s.target_role) {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO notifications
          (user_id, type, title, body, is_read, priority, title_uz, title_ru, message_uz, message_ru,
           reference_id, reference_type, created_at)
        SELECT u.id, ${s.notification_type}, ${s.title_uz}, ${s.body_uz}, FALSE, ${s.priority},
               ${s.title_uz}, ${s.title_ru}, ${s.body_uz}, ${s.body_ru}, ${s.id}, 'notification_schedule', NOW()
        FROM users u
        WHERE u.role = ${s.target_role} AND u.is_active = TRUE AND u.deleted_at IS NULL
        RETURNING id
      `);
      return r.rows.length;
    }
    return 0;
  }
}
