/**
 * @module notification-preferences.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { notification_preferences, notification_type_preferences, notificationsApp } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

export interface NotificationPrefsRow {
  emailEnabled: boolean; telegramEnabled: boolean; pushEnabled: boolean;
  orderUpdates: boolean; productionAlerts: boolean; hrAlerts: boolean;
  qcAlerts: boolean; financeAlerts: boolean; systemAlerts: boolean;
}
export interface MarkAllReadResult { updated: number }

/** One granular per-type × per-channel preference row (owner-decisions batch item 7). */
export interface NotificationTypePrefRow {
  notification_type: string;
  channel: string;
  enabled: boolean;
}

@Injectable()
export class NotificationPreferencesRepository {
  private readonly logger = new Logger(NotificationPreferencesRepository.name);

  async findByUserId(userId: number): Promise<Result<NotificationPrefsRow | null>> {
    try {
      const rows = await db.select().from(notification_preferences)
        .where(eq(notification_preferences.user_id, userId)).limit(1);
      if (rows.length === 0) return Ok(null);
      const r = rows[0];
      return Ok({
        emailEnabled: Boolean(r.email_enabled),
        telegramEnabled: Boolean(r.telegram_enabled),
        pushEnabled: Boolean(r.push_enabled),
        orderUpdates: Boolean(r.order_updates),
        productionAlerts: Boolean(r.production_alerts),
        hrAlerts: Boolean(r.hr_alerts),
        qcAlerts: Boolean(r.qc_alerts),
        financeAlerts: Boolean(r.finance_alerts),
        systemAlerts: Boolean(r.system_alerts),
      });
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async upsert(userId: number, prefs: NotificationPrefsRow): Promise<Result<void>> {
    try {
      await db.insert(notification_preferences).values({
        user_id: userId,
        email_enabled: prefs.emailEnabled,
        telegram_enabled: prefs.telegramEnabled,
        push_enabled: prefs.pushEnabled,
        order_updates: prefs.orderUpdates,
        production_alerts: prefs.productionAlerts,
        hr_alerts: prefs.hrAlerts,
        qc_alerts: prefs.qcAlerts,
        finance_alerts: prefs.financeAlerts,
        system_alerts: prefs.systemAlerts,
        updated_at: _time.now(),
      }).onConflictDoUpdate({
        target: notification_preferences.user_id,
        set: {
          email_enabled: prefs.emailEnabled,
          telegram_enabled: prefs.telegramEnabled,
          push_enabled: prefs.pushEnabled,
          order_updates: prefs.orderUpdates,
          production_alerts: prefs.productionAlerts,
          hr_alerts: prefs.hrAlerts,
          qc_alerts: prefs.qcAlerts,
          finance_alerts: prefs.financeAlerts,
          system_alerts: prefs.systemAlerts,
          updated_at: _time.now(),
        },
      });
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  /**
   * Read the granular per-type × per-channel matrix for a user.
   * Returns [] when the user has no saved granular rows yet (the service
   * synthesizes sensible defaults in that case).
   */
  async findMatrixByUserId(userId: number): Promise<Result<NotificationTypePrefRow[]>> {
    try {
      const rows = await db.select({
        notification_type: notification_type_preferences.notification_type,
        channel: notification_type_preferences.channel,
        enabled: notification_type_preferences.enabled,
      }).from(notification_type_preferences)
        .where(eq(notification_type_preferences.user_id, userId));
      const list = (Array.isArray(rows) ? rows : []).map((r) => ({
        notification_type: String(r.notification_type),
        channel: String(r.channel),
        enabled: Boolean(r.enabled),
      }));
      return Ok(list);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  /**
   * Persist the granular matrix: one INSERT ... ON CONFLICT per (user, type, channel).
   * Idempotent — re-running with the same rows updates `enabled`/`updated_at` in place.
   */
  async upsertMatrix(userId: number, rows: NotificationTypePrefRow[]): Promise<Result<void>> {
    try {
      const list = Array.isArray(rows) ? rows : [];
      for (const row of list) {
        await db.insert(notification_type_preferences).values({
          user_id: userId,
          notification_type: row.notification_type,
          channel: row.channel,
          enabled: row.enabled,
          updated_at: _time.now(),
        }).onConflictDoUpdate({
          target: [
            notification_type_preferences.user_id,
            notification_type_preferences.notification_type,
            notification_type_preferences.channel,
          ],
          set: { enabled: row.enabled, updated_at: _time.now() },
        });
      }
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async markAllReadByUserId(userId: number): Promise<Result<MarkAllReadResult>> {
    try {
      // The feed (NotificationCenter via pos_notifications) reads `is_read`, not the legacy
      // `read` column (external writers set is_read; `read` stays false on all rows), so marking
      // only `read` marked nothing the reader looks at. Set is_read (+ read for legacy
      // consistency) + read_at, and filter on the reader's real unread flag.
      const result = await db.update(notificationsApp)
        .set({ isRead: true, read: true, readAt: sql`now()` })
        .where(and(eq(notificationsApp.userId, userId), eq(notificationsApp.isRead, false)))
        .returning({ id: notificationsApp.id });
      return Ok({ updated: result.length });
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
