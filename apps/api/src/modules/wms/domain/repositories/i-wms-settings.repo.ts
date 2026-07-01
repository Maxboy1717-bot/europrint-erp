/**
 * @module i-wms-settings.repo
 * @description Domain repository interface for the WMS settings hub
 *   (generic key-value config, same pattern as marketing_settings /
 *   sd_price_formulas / qc_parameters). APPROVED: egasi vizyon-qurish
 *   2026-07-01, FAZA "Sozlama har bo'limda".
 *   Concrete implementation lives at
 *   `infrastructure/repositories/wms-settings.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IWmsSettingsRepo {
  getAll(): Promise<Result<Row[]>>;
  saveMany(entries: Record<string, string>): Promise<Result<{ updated: number }>>;
  patchById(id: string, value: string): Promise<Result<{ id: string; updated: boolean }>>;
}

export const WMS_SETTINGS_REPO = Symbol('WMS_SETTINGS_REPO');
