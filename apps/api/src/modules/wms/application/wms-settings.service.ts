/**
 * @module wms-settings.service
 * @description Business-logic service for the WMS settings hub. Returns
 *   Result<T> from @common/result; never throws raw Errors.
 *   APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda".
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { WMS_SETTINGS_REPO, type IWmsSettingsRepo } from '../domain/repositories/i-wms-settings.repo';

@Injectable()
export class WmsSettingsService {
  constructor(@Inject(WMS_SETTINGS_REPO) private readonly repo: IWmsSettingsRepo) {}

  async getAll(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getAll();
  }

  async saveMany(entries: Record<string, string>): Promise<Result<{ updated: number }>> {
    return this.repo.saveMany(entries);
  }

  async patchById(id: string, value: string): Promise<Result<{ id: string; updated: boolean }>> {
    return this.repo.patchById(id, value);
  }
}
