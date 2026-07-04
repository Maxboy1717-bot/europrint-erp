/**
 * @module drizzle-notification.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
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
      .where(eq(notifications.id, Number(id)))
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
            eq(notifications.userId, filters.userId),
            filters.isRead !== undefined ? eq(notifications.isRead, filters.isRead) : undefined))
        .orderBy(desc(notifications.createdAt))
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
            eq(notifications.userId, filters.userId),
            filters.isRead !== undefined ? eq(notifications.isRead, filters.isRead) : undefined))
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
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .execute()
      .then((rows) => (Ok(rows.length)))
      .catch((error) => {
        this.logger.error('Error counting unread notifications');
        return Err((error as Error).message);
      });
  }

  async save(notification: Notification): Promise<Result<Notification>> {
    return db
      .insert(notifications)
      .values({
        userId: String(notification.userId),
        title: notification.title,
        body: notification.body,    // live NOT NULL — must be set (was omitted -> 23502)
        message: notification.body,
        type: notification.type,
        isRead: notification.isRead,
        entityType: notification.referenceType || null,
        entityId: notification.referenceId || null,
        createdAt: notification.createdAt,
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
      .set({ isRead: true })
      .where(eq(notifications.id, Number(id)))
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
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning({ id: notifications.id })
      .execute()
      .then((rows) => {
        return Ok(rows.length);
      })
      .catch((error) => {
        this.logger.error('Error marking all notifications as read');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): Notification {
    const notification = new Notification(
      String(row.userId ?? ''),
      String(row.title ?? ''),
      String(row.message ?? ''),
      String(row.type ?? 'info'),
    );

    notification.id = String(row.id ?? '');
    notification.isRead = Boolean(row.isRead);
    notification.referenceId = String(row.entityId ?? '');
    notification.referenceType = String(row.entityType ?? '');
    notification.createdAt = row.createdAt ? new Date(String(row.createdAt)) : _time.now();
    notification.updatedAt = _time.now();

    return notification;
  }
}
