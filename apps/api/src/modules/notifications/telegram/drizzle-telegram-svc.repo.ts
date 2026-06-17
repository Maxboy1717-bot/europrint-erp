/**
 * @module drizzle-telegram-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { notifications } from '@europrint/schemas';
import { Result, Ok, Err } from '@common/result';
import { ITelegramSvcRepository } from './i-telegram-svc.repo';

@Injectable()
export class DrizzleTelegramSvcRepository implements ITelegramSvcRepository {
  async insertNotification(dto: { userId: number; title: string; message: string; type: string; read: boolean }): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(notifications).values({
        id:      sql`DEFAULT`,
        userId:  String(dto.userId),
        title:   dto.title,
        body:    dto.message ?? dto.title,   // live NOT NULL — must be set (was omitted -> 23502)
        message: dto.message,
        type:    dto.type,
        isRead:  dto.read,
      }).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Xabarnoma qo\'shishda xatolik');
    }
  }

  async countAll(): Promise<Result<number>> {
    try {
      const rows = await db.select().from(notifications);
      return Ok(rows.length);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Xabarnomalar sanashda xatolik');
    }
  }
}
