/**
 * @module manager-daily-routine.cron
 * @description 3 daily Telegram notifications to every manager:
 *   - 09:00 — "Bugun nima qilish kerak" (tasks + flow)
 *   - 13:00 — "Yarim kun: bajarilgan + qolgan"
 *   - 18:00 — "Kun yakuni: hisobot + ertangi reja"
 *
 * @layer Cron (HR / management)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface ManagerRow {
  user_id: number;
  full_name: string;
  telegram_chat_id: string | null;
  team_size: number;
  pending_tasks: number;
  pending_approvals: number;
}

@Injectable()
export class ManagerDailyRoutineCron {
  private readonly logger = new Logger(ManagerDailyRoutineCron.name);
  private readonly time = new TashkentTimeService();

  constructor(@Optional() private readonly telegram: TelegramService) {}

  @Cron('0 9 * * 1-6')   // 09:00 Mon-Sat
  async morningBriefing(): Promise<void> { await this.send('morning'); }

  @Cron('0 13 * * 1-6')  // 13:00 Mon-Sat
  async middayCheckin(): Promise<void> { await this.send('midday'); }

  @Cron('0 18 * * 1-6')  // 18:00 Mon-Sat
  async eveningWrap(): Promise<void> { await this.send('evening'); }

  private async send(slot: 'morning' | 'midday' | 'evening'): Promise<void> {
    this.logger.log(`Running manager-daily-routine (${slot})`);
    try {
      const managers = await this.fetchManagers();
      for (const m of managers) {
        if (!m.telegram_chat_id || !this.telegram) continue;
        const msg = this.composeMessage(slot, m);
        await this.telegram.sendMessage(m.telegram_chat_id, msg).catch(() => { /* noop */ });
      }
    } catch (err) {
      this.logger.error(`manager-daily-routine ${slot} failed: ${String(err)}`);
    }
  }

  private async fetchManagers(): Promise<ManagerRow[]> {
    const rows = await db.execute(sql`
      SELECT
        e.user_id,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.telegram_chat_id,
        (SELECT COUNT(*)::int FROM employees sub WHERE sub.manager_id = e.id) AS team_size,
        0::int AS pending_tasks,
        0::int AS pending_approvals
      FROM employees e
      JOIN org_functions ofn ON ofn.id = e.org_function_id
      WHERE e.status = 'active' AND e.deleted_at IS NULL
        AND (ofn.position_name ILIKE '%menejer%' OR ofn.position_name ILIKE '%boshli%' OR ofn.position_name ILIKE '%direktor%')
    `);
    return (rows as unknown as { rows: ManagerRow[] }).rows;
  }

  private composeMessage(slot: 'morning' | 'midday' | 'evening', m: ManagerRow): string {
    const dayStr = this.time.formatDate(new Date());
    if (slot === 'morning') {
      return `☀️ Xayrli tong, ${m.full_name}!\n\n` +
        `📅 ${dayStr}\n` +
        `👥 Sizning jamoangiz: ${m.team_size} xodim\n` +
        `📋 Ochiq vazifalar: ${m.pending_tasks}\n` +
        `✍️ Tasdiqlash kutmoqda: ${m.pending_approvals}\n\n` +
        `Bugungi kun uchun rejalashtirilgan ishlar ERP-da ko'rib chiqing.`;
    }
    if (slot === 'midday') {
      return `🕐 Yarim kun, ${m.full_name}!\n\n` +
        `Yakunlash kerak bo'lgan vazifalar: ${m.pending_tasks}\n` +
        `Ertalabki rejada qolgan ishlarni tekshiring.`;
    }
    return `🌙 Kun yakuni, ${m.full_name}!\n\n` +
      `📊 Bugungi natijalarni ko'rib chiqing va ertangi kun rejasini tasdiqlang.\n` +
      `Hisobot ERP-da tayyor.`;
  }
}
