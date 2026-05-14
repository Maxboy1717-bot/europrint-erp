/**
 * @module kanban-recurring.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';

@Injectable()
export class KanbanRecurringCron {
  private readonly logger = new Logger(KanbanRecurringCron.name);

  /**
   * Har kuni 07:00 da (Toshkent vaqti) takrorlanuvchi kanban kartalarni
   * qayta yaratadi.
   *
   * recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'none'
   * Karta yakunlanganda (completed_at IS NOT NULL) keyingi sana hisoblanadi
   * va yangi nusxa yaratiladi (completed_at = NULL).
   */
  @Cron('0 7 * * *', { timeZone: 'Asia/Tashkent' })
  async createRecurringCards(): Promise<void> {
    const processed: string[] = [];
    const errors: string[]    = [];

    try {
      // Takrorlanuvchi, yakunlangan kartalar
      const rows = await runQuery<{
        id: string; title: string; description: string | null;
        column_id: string; board_id: string; priority: string;
        owner_user_id: string | null; estimated_time: number | null;
        recurrence_pattern: string; recurrence_end_date: string | null;
        due_date: string | null;
      }>(sql`
        SELECT id, title, description, column_id, board_id, priority,
               owner_user_id, estimated_time,
               recurrence_pattern, recurrence_end_date, due_date
        FROM kanban_cards
        WHERE recurrence_pattern <> 'none'
          AND completed_at IS NOT NULL
          AND deleted_at IS NULL
          AND (recurrence_end_date IS NULL OR recurrence_end_date >= CURRENT_DATE)
        LIMIT 200
      `);

      for (const card of rows.rows) {
        try {
          const nextDue = this._nextDueDate(card.due_date, card.recurrence_pattern);
          if (!nextDue) continue;

          // Allaqachon mavjud nusxani tekshirish (bir xil title + due_date + board)
          const exists = await runQuery<{ cnt: number }>(sql`
            SELECT COUNT(*)::int AS cnt FROM kanban_cards
            WHERE title = ${card.title}
              AND board_id = ${card.board_id}
              AND due_date = ${nextDue}
              AND deleted_at IS NULL
              AND completed_at IS NULL
          `);
          if (Number(exists.rows[0]?.cnt ?? 0) > 0) continue;

          await runQuery(sql`
            INSERT INTO kanban_cards
              (title, description, column_id, board_id, priority,
               owner_user_id, estimated_time, recurrence_pattern,
               recurrence_end_date, due_date, sort_order, created_at, updated_at)
            SELECT
              ${card.title}, ${card.description ?? null},
              ${card.column_id}, ${card.board_id}, ${card.priority},
              ${card.owner_user_id ?? null}, ${card.estimated_time ?? null},
              ${card.recurrence_pattern}, ${card.recurrence_end_date ?? null},
              ${nextDue}::date,
              COALESCE((SELECT MAX(sort_order) + 1 FROM kanban_cards WHERE column_id = ${card.column_id} AND deleted_at IS NULL), 0),
              NOW(), NOW()
          `);
          processed.push(card.id);
        } catch (rowErr) {
          errors.push(`${card.id}: ${String(rowErr)}`);
        }
      }

      this.logger.log(`✅ KanbanRecurring: yaratildi=${processed.length}, xato=${errors.length}`);
    } catch (err) {
      this.logger.error(`❌ KanbanRecurring xato: ${String(err)}`);
    }
  }

  private _nextDueDate(dueDate: string | null, pattern: string): string | null {
    const d = dueDate ? new Date(dueDate) : new Date();
    switch (pattern) {
      case 'daily':   d.setDate(d.getDate() + 1);   break;
      case 'weekly':  d.setDate(d.getDate() + 7);   break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      default:        return null;
    }
    return d.toISOString().split('T')[0];
  }
}
