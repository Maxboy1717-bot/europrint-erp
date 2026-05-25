/**
 * @module i-pos-notifications.repo
 * @description Domain repository interface for POS notifications.
 *   Decouples `PosNotificationsService` from the concrete Drizzle
 *   implementation (DDD C.19).
 * @layer Domain (POS)
 */

import type { Result } from '@common/result';
import type { posNotifications } from '@workspace/db';

type PosNotification = typeof posNotifications.$inferSelect;
type PosNotificationInsert = typeof posNotifications.$inferInsert;

export const POS_NOTIFICATIONS_REPO = Symbol('POS_NOTIFICATIONS_REPO');

export interface IPosNotificationsRepository {
  getForUser(userId: number, limit?: number): Promise<Result<PosNotification[]>>;
  markRead(id: number, userId: number): Promise<Result<PosNotification>>;
  markAllRead(userId: number): Promise<Result<void>>;
  insert(data: PosNotificationInsert): Promise<Result<PosNotification>>;
  countUnread(userId: number): Promise<Result<number>>;
}
