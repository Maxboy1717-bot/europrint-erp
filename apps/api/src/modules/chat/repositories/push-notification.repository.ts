/**
 * @module push-notification.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { chatPushSubscriptions } from '@shared/db/schema-chat';
import { eq, and } from 'drizzle-orm';
import { Result, Ok, Err, AppError } from '@common/result';

type PushSubscriptionInsert = typeof chatPushSubscriptions.$inferInsert;

@Injectable()
export class PushNotificationRepository {
  async insert(
    userId: string,
    data: Omit<PushSubscriptionInsert, 'user_id' | 'is_active'>,
  ): Promise<Result<{ id: string }, AppError>> {
    try {
      const inserted = await db.insert(chatPushSubscriptions).values({
        user_id:     userId,
        channel:     data.channel,
        endpoint:    data.endpoint ?? null,
        p256dh:      data.p256dh ?? null,
        auth:        data.auth ?? null,
        fcm_token:   data.fcm_token ?? null,
        apns_token:  data.apns_token ?? null,
        device_info: data.device_info ?? null,
        is_active:   true,
      }).returning({ id: chatPushSubscriptions.id });

      const row = (Array.isArray(inserted) ? inserted : [])[0];
      if (!row) return Err({ message: 'Push subscription saqlanmadi', code: 'DB_ERROR' });
      return Ok({ id: String(row.id) });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async deactivateForUser(userId: string): Promise<Result<void, AppError>> {
    try {
      await db.update(chatPushSubscriptions)
        .set({ is_active: false })
        .where(eq(chatPushSubscriptions.user_id, userId));
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async findActiveByUser(userId: string): Promise<Result<typeof chatPushSubscriptions.$inferSelect[], AppError>> {
    try {
      const rows = await db.select().from(chatPushSubscriptions).where(
        and(
          eq(chatPushSubscriptions.user_id, userId),
          eq(chatPushSubscriptions.is_active, true),
        ),
      );
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
