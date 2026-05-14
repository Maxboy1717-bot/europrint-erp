/**
 * @module i-notification.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { Notification } from '../aggregates/notification.aggregate';

export interface INotificationRepo {
  findById(id: string): Promise<Result<Notification | null>>;
  findByUserId(filters: {
    userId: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Notification[]; total: number }>>;
  findUnreadCount(userId: string): Promise<Result<number>>;
  save(notification: Notification): Promise<Result<Notification>>;
  markAsRead(id: string): Promise<Result<Notification>>;
  markAllAsRead(userId: string): Promise<Result<number>>;
}

export const NOTIFICATION_REPO = Symbol('NOTIFICATION_REPO');
