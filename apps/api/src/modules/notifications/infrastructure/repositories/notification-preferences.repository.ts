import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { notification_preferences, notificationsApp } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

export interface NotificationPrefsRow {
  emailEnabled: boolean; telegramEnabled: boolean; pushEnabled: boolean;
  orderUpdates: boolean; productionAlerts: boolean; hrAlerts: boolean;
  qcAlerts: boolean; financeAlerts: boolean; systemAlerts: boolean;
}
export interface MarkAllReadResult { updated: number }

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

  async markAllReadByUserId(userId: number): Promise<Result<MarkAllReadResult>> {
    try {
      const result = await db.update(notificationsApp)
        .set({ is_read: true, updated_at: _time.now() })
        .where(and(eq(notificationsApp.user_id, userId), eq(notificationsApp.is_read, false)))
        .returning({ id: notificationsApp.id });
      return Ok({ updated: result.length });
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
