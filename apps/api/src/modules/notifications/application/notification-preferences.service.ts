/**
 * @module notification-preferences.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, isErr } from '@common/result';
import { NotificationPreferencesRepository, NotificationPrefsRow } from '../infrastructure/repositories/notification-preferences.repository';

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
}
