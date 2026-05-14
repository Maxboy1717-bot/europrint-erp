/**
 * @module drizzle-notification.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { INotificationRepo } from '../../domain/repositories/i-notification.repo';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { db, notifications } from '@shared/db';

@Injectable()
export class DrizzleNotificationRepository implements INotificationRepo {
  private readonly logger = new Logger(DrizzleNotificationRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<Notification | null>> {
    return db
      .select()
      .from(notifications)
      .where(sql`${notifications.id} = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding notification by id');
        return Err((error as Error).message);
      });
  }

  async findByUserId(filters: {
    userId: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Notification[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(notifications)
        .where(
          and(
            sql`${notifications.user_id} = ${filters.userId}`,
            filters.isRead !== undefined ? sql`${notifications.is_read} = ${filters.isRead}` : undefined))
        .orderBy(desc(notifications.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching notifications');
          throw error;
        }),
      db
        .select()
        .from(notifications)
        .where(
          and(
            sql`${notifications.user_id} = ${filters.userId}`,
            filters.isRead !== undefined ? sql`${notifications.is_read} = ${filters.isRead}` : undefined))
        .execute()
        .then((rows) => rows.length)
        .catch((error) => {
          this.logger.error('Error counting notifications');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: items.map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findUnreadCount(userId: string): Promise<Result<number>> {
    return db
      .select()
      .from(notifications)
      .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)))
      .execute()
      .then((rows) => (Ok(rows.length,)))
      .catch((error) => {
        this.logger.error('Error counting unread notifications');
        return Err((error as Error).message);
      });
  }

  async save(notification: Notification): Promise<Result<Notification>> {
    return db
      .insert(notifications)
      .values({
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        is_read: notification.isRead,
        reference_id: notification.referenceId,
        reference_type: notification.referenceType,
        created_at: notification.createdAt,
        updated_at: notification.updatedAt,
      } as typeof notifications.$inferInsert)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save notification');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving notification');
        return Err((error as Error).message);
      });
  }

  async markAsRead(id: string): Promise<Result<Notification>> {
    return db
      .update(notifications)
      .set({ is_read: true })
      .where(sql`${notifications.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Notification not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error marking notification as read');
        return Err((error as Error).message);
      });
  }

  async markAllAsRead(userId: string): Promise<Result<number>> {
    return db
      .update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)))
      .execute()
      .then(() => {
        return Ok(0); // Return number updated if available from DB
      })
      .catch((error) => {
        this.logger.error('Error marking all notifications as read');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): Notification {
    const notification = new Notification(String(row.user_id ?? ''), String(row.title ?? ''), String(row.body ?? ''), String(row.type ?? 'info'));

    notification.id = String(row.id ?? '');
    notification.isRead = Boolean(row.is_read);
    notification.referenceId = String(row.reference_id ?? '');
    notification.referenceType = String(row.reference_type ?? '');
    notification.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    notification.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return notification;
  }
}
