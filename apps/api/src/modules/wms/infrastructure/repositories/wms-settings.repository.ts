/**
 * @module wms-settings.repository
 * @description Repository / data-access layer for the WMS settings hub.
 *   Wraps Drizzle ORM queries against `wms_settings`; returns Result<T>.
 *   APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda".
 * @layer Infrastructure (WMS)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { wmsSettings } from '@workspace/db';
import { eq, asc } from 'drizzle-orm';
import type { IWmsSettingsRepo } from '../../domain/repositories/i-wms-settings.repo';

type Row = Record<string, unknown>;

@Injectable()
export class WmsSettingsRepository implements IWmsSettingsRepo {
  async getAll(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select()
        .from(wmsSettings)
        .orderBy(asc(wmsSettings.category), asc(wmsSettings.key));
      return Ok(rows as Row[]);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'WMS sozlamalari topilmadi');
    }
  }

  async saveMany(entries: Record<string, string>): Promise<Result<{ updated: number }>> {
    try {
      const keys = Object.entries(entries);
      for (const [key, value] of keys) {
        await db
          .insert(wmsSettings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: wmsSettings.key,
            set: { value, updatedAt: new Date() },
          });
      }
      return Ok({ updated: keys.length });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'WMS sozlamalarini saqlashda xatolik');
    }
  }

  async patchById(id: string, value: string): Promise<Result<{ id: string; updated: boolean }>> {
    try {
      await db
        .update(wmsSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(wmsSettings.id, id));
      return Ok({ id, updated: true });
    } catch (e: unknown) {
      return Err((e as Error)?.message || `WMS sozlamasi #${id} yangilanmadi`);
    }
  }
}
