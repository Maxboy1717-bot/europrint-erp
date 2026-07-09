/**
 * @module notification-preferences.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, isErr } from '@common/result';
import { NotificationPreferencesRepository, NotificationPrefsRow, NotificationTypePrefRow } from '../infrastructure/repositories/notification-preferences.repository';

export interface NotificationPrefs {
  userId: number;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  productionAlerts: boolean;
  hrAlerts: boolean;
  qcAlerts: boolean;
  financeAlerts: boolean;
  systemAlerts: boolean;
}

/** FE NotificationSettings row shape: one notification type with its 3 channel toggles. */
export interface NotifPrefMatrixRow {
  key: string;
  email: boolean;
  telegram: boolean;
  inApp: boolean;
}

// Canonical notification types (must match NotificationSettings.tsx NOTIFICATION_TYPES).
// Used to synthesize a full default matrix when the user has no saved granular rows.
const NOTIFICATION_TYPE_KEYS = [
  'task_assigned', 'order_status', 'payment_due', 'approval_required',
  'defect_reported', 'leave_approved', 'salary_processed', 'security_alert',
  'stock_low', 'shift_reminder',
] as const;

// The 3 channels the UI grid renders (sms dropped — no column in the grid).
const MATRIX_CHANNELS = ['email', 'telegram', 'inApp'] as const;
type MatrixChannel = typeof MATRIX_CHANNELS[number];

const DEFAULTS: NotificationPrefsRow = {
  emailEnabled: true,
  telegramEnabled: true,
  pushEnabled: false,
  orderUpdates: true,
  productionAlerts: true,
  hrAlerts: true,
  qcAlerts: true,
  financeAlerts: false,
  systemAlerts: true,
};

function toDto(userId: number, row: NotificationPrefsRow): NotificationPrefs {
  return { userId, ...row };
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly repo: NotificationPreferencesRepository) {}

  async getPreferences(userId: number): Promise<Result<NotificationPrefs>> {
    const result = await this.repo.findByUserId(userId);
    if (isErr(result)) return Err(result.error);
    return Ok(toDto(userId, result.data ?? DEFAULTS));
  }

  async updatePreferences(userId: number, prefs: Partial<Omit<NotificationPrefs, 'userId'>>): Promise<Result<NotificationPrefs>> {
    const existing = await this.repo.findByUserId(userId);
    if (isErr(existing)) return Err(existing.error);
    const merged: NotificationPrefsRow = { ...(existing.data ?? DEFAULTS), ...prefs };
    const upsertResult = await this.repo.upsert(userId, merged);
    if (isErr(upsertResult)) return Err(upsertResult.error);
    return Ok(toDto(userId, merged));
  }

  async markAllRead(userId: number): Promise<Result<{ updated: number }>> {
    return this.repo.markAllReadByUserId(userId);
  }

  /**
   * Read the granular per-type × per-channel matrix in the FE NotifPref[] shape.
   * When the user has no saved granular rows, defaults are derived from the legacy
   * flat row (email_enabled→email, telegram_enabled→telegram, push_enabled→inApp);
   * with no flat row either, every channel defaults to enabled (all-on).
   */
  async getMatrix(userId: number): Promise<Result<NotifPrefMatrixRow[]>> {
    const granular = await this.repo.findMatrixByUserId(userId);
    if (isErr(granular)) return Err(granular.error);
    const rows = Array.isArray(granular.data) ? granular.data : [];

    const flat = await this.repo.findByUserId(userId);
    if (isErr(flat)) return Err(flat.error);
    const flatRow = flat.data;
    const channelDefault: Record<MatrixChannel, boolean> = flatRow
      ? { email: flatRow.emailEnabled, telegram: flatRow.telegramEnabled, inApp: flatRow.pushEnabled }
      : { email: true, telegram: true, inApp: true };

    // index granular rows: type -> channel -> enabled (no non-null assertions per Qoida 9)
    const byType = new Map<string, Map<string, boolean>>();
    for (const r of rows) {
      const chans = byType.get(r.notification_type) ?? new Map<string, boolean>();
      chans.set(r.channel, r.enabled);
      byType.set(r.notification_type, chans);
    }

    // Return canonical types first, then any extra saved types (never drop saved data).
    const typeKeys: string[] = [...NOTIFICATION_TYPE_KEYS];
    for (const r of rows) if (!typeKeys.includes(r.notification_type)) typeKeys.push(r.notification_type);

    const result: NotifPrefMatrixRow[] = typeKeys.map((key) => {
      const chans = byType.get(key);
      const readChan = (ch: MatrixChannel): boolean => {
        const saved = chans?.get(ch);
        return saved === undefined ? channelDefault[ch] : saved;
      };
      return { key, email: readChan('email'), telegram: readChan('telegram'), inApp: readChan('inApp') };
    });
    return Ok(result);
  }

  /**
   * Persist the granular matrix from the FE NotifPref[] shape (one DB row per
   * type × channel), then read it back so the caller round-trips real DB state.
   */
  async updateMatrix(userId: number, prefs: NotifPrefMatrixRow[]): Promise<Result<NotifPrefMatrixRow[]>> {
    const list = Array.isArray(prefs) ? prefs : [];
    const rows: NotificationTypePrefRow[] = [];
    for (const p of list) {
      rows.push({ notification_type: p.key, channel: 'email',    enabled: Boolean(p.email) });
      rows.push({ notification_type: p.key, channel: 'telegram', enabled: Boolean(p.telegram) });
      rows.push({ notification_type: p.key, channel: 'inApp',    enabled: Boolean(p.inApp) });
    }
    const upsertResult = await this.repo.upsertMatrix(userId, rows);
    if (isErr(upsertResult)) return Err(upsertResult.error);
    return this.getMatrix(userId);
  }
}
