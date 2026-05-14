/**
 * Notification preferences repository (cc_notification_prefs jadval).
 * Bir foydalanuvchi uchun bitta yozuv (PRIMARY KEY user_id).
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export interface CcNotificationPrefsRow {
  userId:           number;
  urgentOnly:       boolean;
  telegramEnabled:  boolean;
  remindersEnabled: boolean;
  language:         'uz' | 'ru';
  updatedAt:        string;
}

export interface CcNotificationPrefsUpdate {
  urgentOnly?:       boolean;
  telegramEnabled?:  boolean;
  remindersEnabled?: boolean;
  language?:         'uz' | 'ru';
}

// Defaults applied when no row exists yet
const DEFAULTS = { urgentOnly: false, telegramEnabled: true, remindersEnabled: true, language: 'uz' as const };

@Injectable()
export class CcNotificationPrefsRepository {
  /** Get — returns null if no row (use getOrDefault for a safe fallback) */
  async get(userId: number): Promise<CcNotificationPrefsRow | null> {
    const r = await runQuery<{
      user_id: number; urgent_only: boolean; telegram_enabled: boolean;
      reminders_enabled: boolean; language: 'uz' | 'ru'; updated_at: string;
    }>(sql`
      SELECT user_id, urgent_only, telegram_enabled, reminders_enabled, language, updated_at::text
      FROM cc_notification_prefs WHERE user_id = ${userId}
    `);
    const row = r.rows[0];
    if (!row) return null;
    return {
      userId:           row.user_id,
      urgentOnly:       row.urgent_only,
      telegramEnabled:  row.telegram_enabled,
      remindersEnabled: row.reminders_enabled,
      language:         row.language,
      updatedAt:        row.updated_at,
    };
  }

  /** Get or return defaults — no extra DB call if not needed */
  async getOrDefault(userId: number): Promise<CcNotificationPrefsRow> {
    return (await this.get(userId)) ?? {
      userId,
      ...DEFAULTS,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Upsert (PUT semantics) — single query.
   * COALESCE(EXCLUDED.col, existing.col) merges patch with current DB values
   * without a pre-read round-trip.
   */
  async upsert(userId: number, patch: CcNotificationPrefsUpdate): Promise<CcNotificationPrefsRow> {
    const p = {
      urgentOnly:       patch.urgentOnly       ?? null,
      telegramEnabled:  patch.telegramEnabled  ?? null,
      remindersEnabled: patch.remindersEnabled ?? null,
      language:         patch.language         ?? null,
    };

    const r = await runQuery<{
      urgent_only: boolean; telegram_enabled: boolean;
      reminders_enabled: boolean; language: 'uz' | 'ru'; updated_at: string;
    }>(sql`
      INSERT INTO cc_notification_prefs
        (user_id, urgent_only, telegram_enabled, reminders_enabled, language, updated_at)
      VALUES
        (${userId},
         COALESCE(${p.urgentOnly},       ${DEFAULTS.urgentOnly}),
         COALESCE(${p.telegramEnabled},  ${DEFAULTS.telegramEnabled}),
         COALESCE(${p.remindersEnabled}, ${DEFAULTS.remindersEnabled}),
         COALESCE(${p.language},         ${DEFAULTS.language}),
         NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        urgent_only       = COALESCE(${p.urgentOnly},       cc_notification_prefs.urgent_only),
        telegram_enabled  = COALESCE(${p.telegramEnabled},  cc_notification_prefs.telegram_enabled),
        reminders_enabled = COALESCE(${p.remindersEnabled}, cc_notification_prefs.reminders_enabled),
        language          = COALESCE(${p.language},         cc_notification_prefs.language),
        updated_at        = NOW()
      RETURNING urgent_only, telegram_enabled, reminders_enabled, language, updated_at::text
    `);

    const row = r.rows[0];
    return {
      userId,
      urgentOnly:       row?.urgent_only       ?? DEFAULTS.urgentOnly,
      telegramEnabled:  row?.telegram_enabled  ?? DEFAULTS.telegramEnabled,
      remindersEnabled: row?.reminders_enabled ?? DEFAULTS.remindersEnabled,
      language:         row?.language          ?? DEFAULTS.language,
      updatedAt:        row?.updated_at        ?? new Date().toISOString(),
    };
  }
}
