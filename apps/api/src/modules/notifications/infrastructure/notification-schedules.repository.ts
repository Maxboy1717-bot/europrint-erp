/**
 * @module notification-schedules.repository
 * @description `notification_schedules` (markaziy bildirishnoma-jadval) CRUD repozitoriysi.
 *   notification-schedule.cron shu jadvalni iste'mol qiladi; bu repo egasiga sozlash imkonini beradi
 *   (avval faqat seed bilan to'lardi). Result pattern (Qoida 1).
 *
 * NOTE: Raw SQL — COALESCE bilan qisman (partial) UPDATE: berilmagan maydon (NULL bind) → mavjud
 *   qiymat saqlanadi. Drizzle query-builder buni qulay ifodalay olmaydi. ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Notifications)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface NotificationScheduleRow {
  id: number;
  name: string;
  notification_type: string;
  target_role: string | null;
  target_user_id: number | null;
  title_uz: string;
  title_ru: string | null;
  body_uz: string;
  body_ru: string | null;
  priority: string;
  interval_hours: number;
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleInput {
  name: string;
  notificationType: string;
  targetRole: string | null;
  targetUserId: number | null;
  titleUz: string;
  titleRu: string | null;
  bodyUz: string;
  bodyRu: string | null;
  priority: string;
  intervalHours: number;
  nextRunAt: string | null;
}

export interface UpdateScheduleInput {
  name?: string | null;
  titleUz?: string | null;
  titleRu?: string | null;
  bodyUz?: string | null;
  bodyRu?: string | null;
  priority?: string | null;
  intervalHours?: number | null;
  nextRunAt?: string | null;
  isActive?: boolean | null;
}

@Injectable()
export class NotificationSchedulesRepository {
  async list(): Promise<Result<NotificationScheduleRow[]>> {
    try {
      const r = await runQuery<NotificationScheduleRow>(sql`
        SELECT id, name, notification_type, target_role, target_user_id,
               title_uz, title_ru, body_uz, body_ru, priority, interval_hours,
               next_run_at, last_run_at, is_active, created_at, updated_at
        FROM notification_schedules
        ORDER BY id
      `);
      return Ok(r.rows);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async create(input: CreateScheduleInput): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO notification_schedules
          (name, notification_type, target_role, target_user_id, title_uz, title_ru,
           body_uz, body_ru, priority, interval_hours, next_run_at)
        VALUES
          (${input.name}, ${input.notificationType}, ${input.targetRole}, ${input.targetUserId},
           ${input.titleUz}, ${input.titleRu}, ${input.bodyUz}, ${input.bodyRu},
           ${input.priority}, ${input.intervalHours},
           COALESCE(${input.nextRunAt}::timestamptz, NOW()))
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Jadval yaratilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async update(id: number, patch: UpdateScheduleInput): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE notification_schedules SET
          name           = COALESCE(${patch.name ?? null}, name),
          title_uz       = COALESCE(${patch.titleUz ?? null}, title_uz),
          title_ru       = COALESCE(${patch.titleRu ?? null}, title_ru),
          body_uz        = COALESCE(${patch.bodyUz ?? null}, body_uz),
          body_ru        = COALESCE(${patch.bodyRu ?? null}, body_ru),
          priority       = COALESCE(${patch.priority ?? null}, priority),
          interval_hours = COALESCE(${patch.intervalHours ?? null}, interval_hours),
          next_run_at    = COALESCE(${patch.nextRunAt ?? null}::timestamptz, next_run_at),
          is_active      = COALESCE(${patch.isActive ?? null}, is_active),
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Jadval topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        DELETE FROM notification_schedules WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Jadval topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
