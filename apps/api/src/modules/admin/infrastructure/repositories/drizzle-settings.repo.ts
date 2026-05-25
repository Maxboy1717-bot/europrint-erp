/**
 * @module drizzle-settings.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { dbRows } from '../../../hr/common/db-rows';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Database } from '@/infrastructure/database/database';
import { ISettingsRepo } from '../../domain/repositories/i-settings.repo';
import { SystemSettings, SystemSettingsData } from '../../domain/entities/system-settings.entity';
import { systemSettings } from '@/infrastructure/database/schema';
import { MAX_USERS_DEFAULT } from '@common/constants/app.constants';

const SETTING_KEYS = {
  ADVANCE_PERCENT: 'advance_percent',
  FREE_STORAGE_DAYS: 'free_storage_days',
  STORAGE_DAILY_RATE: 'storage_daily_rate',
  MAX_USERS: 'max_users',
  MAINTENANCE_MODE: 'maintenance_mode',
} as const;

type SettingRow = typeof systemSettings.$inferSelect;

function parseSettingsData(rows: SettingRow[]): SystemSettingsData | null {
  const map = new Map<string, string>((Array.isArray(rows) ? rows : []).map((r) => [r.key, r.value]));
  const advancePercent = Number(map.get(SETTING_KEYS.ADVANCE_PERCENT) ?? '');
  if (Number.isNaN(advancePercent)) return null;
  const lastRow = rows[rows.length - 1];
  return {
    id: 1,
    advancePercent,
    freeStorageDays: Number(map.get(SETTING_KEYS.FREE_STORAGE_DAYS) ?? 0),
    storageDailyRate: Number(map.get(SETTING_KEYS.STORAGE_DAILY_RATE) ?? 0),
    maxUsers: Number(map.get(SETTING_KEYS.MAX_USERS) ?? MAX_USERS_DEFAULT),
    maintenanceMode: map.get(SETTING_KEYS.MAINTENANCE_MODE) === 'true',
    updatedAt: lastRow ? new Date(lastRow.updated_at) : _time.now(),
    updatedBy: lastRow?.updated_by ? Number(lastRow.updated_by) : 0,
  };
}

@Injectable()
export class DrizzleSettingsRepo implements ISettingsRepo {
  private readonly logger = new Logger(DrizzleSettingsRepo.name);
  constructor(private readonly db: Database) {}

  async getSettings(): Promise<SystemSettings | null> {
    try {
      const rows = await this.db.db.select().from(systemSettings);
      if (rows.length === 0) {
        this.logger.warn('System settings not found');
        return null;
      }
      const data = parseSettingsData(rows);
      if (!data) return null;
      return new SystemSettings(data);
    } catch (error: unknown) {
      this.logger.error('Error getting system settings');
      return null;
    }
  }

  async save(settings: SystemSettings): Promise<SystemSettings> {
    try {
      const data = settings.toPersistence();
      const updates: Array<{ key: string; value: string }> = [
        { key: SETTING_KEYS.ADVANCE_PERCENT, value: String(data.advancePercent) },
        { key: SETTING_KEYS.FREE_STORAGE_DAYS, value: String(data.freeStorageDays) },
        { key: SETTING_KEYS.STORAGE_DAILY_RATE, value: String(data.storageDailyRate) },
        { key: SETTING_KEYS.MAX_USERS, value: String(data.maxUsers) },
        { key: SETTING_KEYS.MAINTENANCE_MODE, value: String(data.maintenanceMode) },
      ];

      for (const { key, value } of updates) {
        const existing = await this.db.db
          .select({ id: systemSettings.id })
          .from(systemSettings)
          .where(eq(systemSettings.key, key))
          .limit(1);

        if (existing[0]) {
          await this.db.db
            .update(systemSettings)
            .set({ value, updated_at: data.updatedAt })
            .where(eq(systemSettings.key, key));
        } else {
          await this.db.db
            .insert(systemSettings)
            .values({ key, value });
        }
      }

      return settings;
    } catch (error: unknown) {
      this.logger.error('Error saving system settings');
      throw error;
    }
  }
}
