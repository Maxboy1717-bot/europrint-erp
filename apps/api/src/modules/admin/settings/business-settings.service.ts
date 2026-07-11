/**
 * @module business-settings.service
 * @description Global biznes-sozlamalar servisi. Repo'ga delegat qiladi (Qoida 15 — db.* yo'q);
 *   `getNumber` — boshqa modullar/cronlar hardcode o'rniga qiymatni shu yerdan o'qishi uchun
 *   qulaylik metodi (topilmasa yoki nofaol bo'lsa fallback qaytaradi — regressiyasiz migratsiya).
 */

import { Injectable } from '@nestjs/common';
import {
  BusinessSettingsRepository,
  type BusinessSettingCreate,
  type BusinessSettingUpdate,
} from './business-settings.repo';

@Injectable()
export class BusinessSettingsService {
  constructor(private readonly repo: BusinessSettingsRepository) {}

  list(module: string | undefined, includeInactive: boolean) {
    return this.repo.list(module, includeInactive);
  }
  getByKey(settingKey: string) {
    return this.repo.getByKey(settingKey);
  }
  create(input: BusinessSettingCreate) {
    return this.repo.create(input);
  }
  updateByKey(settingKey: string, patch: BusinessSettingUpdate) {
    return this.repo.updateByKey(settingKey, patch);
  }
  deleteByKey(settingKey: string) {
    return this.repo.deleteByKey(settingKey);
  }

  /**
   * Kod tomonidan o'qish uchun: sozlamaning raqamli qiymati (faol bo'lsa), aks holda fallback.
   * Hardcode konstantalarni bosqichma-bosqich shu jadvalga ko'chirish uchun — hech qachon throw
   * qilmaydi (DB xatosida ham fallback), shuning uchun ishlayotgan yo'llar buzilmaydi.
   */
  async getNumber(settingKey: string, fallback: number): Promise<number> {
    const res = await this.repo.getByKey(settingKey);
    if (!res.ok) return fallback;
    const row = res.data as { value_num?: unknown; is_active?: unknown };
    if (row.is_active === false) return fallback;
    const n = Number(row.value_num);
    return Number.isFinite(n) ? n : fallback;
  }
}
