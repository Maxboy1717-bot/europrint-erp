/**
 * @module material-life.service
 * @description Material hayot-tsikli (W4-MATERIAL-LIFE) — application qatlam.
 *   Material-karta atributlari (egalik/xavf/saqlash/yosh/vtorichka/poddon/namuna)
 *   va analog (substitute, EP-WMS-101) boshqaruvi + xavf-zona/yosh-ogohlantirish
 *   ko'rinishlari.
 *
 *   Vizyon: EP-WMS-101/123/125/126/128/130/086.
 *   Q-46: faqat ADDITIVE — mavjud WMS chiqim-yo'liga (karantin/FIFO/atomik) tegmaydi.
 *   Q-40: hech qanday material-tasnif fabrikatsiya qilinmaydi — atributlar
 *   operator/egasi tomonidan kiritiladi, ko'rinishlar bo'sh bo'lsa bo'sh qaytaradi.
 * @layer Application (WMS)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  IMaterialLifeRepo,
  MATERIAL_LIFE_REPO,
  MaterialLifeAttrs,
  MaterialLifeView,
  SubstituteRow,
  AgingAlertRow,
} from '../domain/repositories/i-material-life.repo';
import { SUBSTITUTE_DEFAULT_PRIORITY } from '../domain/constants/material-life.constants';

export interface AddSubstituteInput {
  substituteId: number;
  priority?: number;
  isApproved?: boolean;
  notes?: string | null;
}

@Injectable()
export class MaterialLifeService {
  private readonly logger = new Logger(MaterialLifeService.name);

  constructor(@Inject(MATERIAL_LIFE_REPO) private readonly repo: IMaterialLifeRepo) {}

  /** Bitta material-kartaning hayot-tsikli atributlarini qaytaradi. */
  async getLife(materialId: number): Promise<Result<MaterialLifeView, AppError>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri materialId: ${materialId}` });
    }
    const r = await this.repo.getLifeView(materialId);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err({ code: 'NOT_FOUND', message: `Material topilmadi: ${materialId}` });
    return Ok(r.data);
  }

  /** Hayot-tsikli atributlarini yangilaydi (faqat berilgan maydonlar). */
  async updateLife(
    materialId: number,
    attrs: MaterialLifeAttrs,
  ): Promise<Result<MaterialLifeView, AppError>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri materialId: ${materialId}` });
    }
    const exists = await this.repo.materialExists(materialId);
    if (!exists.ok) return exists as Result<MaterialLifeView, AppError>;
    if (!exists.data) return Err({ code: 'NOT_FOUND', message: `Material topilmadi: ${materialId}` });

    const updated = await this.repo.updateLifeAttrs(materialId, attrs);
    if (updated.ok) {
      this.logger.log({ materialId, attrs }, 'Material hayot-tsikli atributlari yangilandi');
    }
    return updated;
  }

  /** Material uchun ruxsat etilgan analoglar (EP-WMS-101). */
  async listSubstitutes(materialId: number): Promise<Result<SubstituteRow[], AppError>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri materialId: ${materialId}` });
    }
    return this.repo.listSubstitutes(materialId);
  }

  /**
   * Yangi analog/substitute juftlik qo'shadi (EP-WMS-101). Ikkala material ham
   * mavjud bo'lishi va o'zaro farq qilishi shart.
   */
  async addSubstitute(
    materialId: number,
    input: AddSubstituteInput,
    userId: number | null,
  ): Promise<Result<SubstituteRow, AppError>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri materialId: ${materialId}` });
    }
    if (!Number.isInteger(input.substituteId) || input.substituteId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri substituteId: ${input.substituteId}` });
    }
    if (materialId === input.substituteId) {
      return Err({ code: 'VALIDATION', message: 'Material o\'z-o\'ziga analog bo\'lolmaydi' });
    }

    const mExists = await this.repo.materialExists(materialId);
    if (!mExists.ok) return mExists as Result<SubstituteRow, AppError>;
    if (!mExists.data) return Err({ code: 'NOT_FOUND', message: `Material topilmadi: ${materialId}` });

    const sExists = await this.repo.materialExists(input.substituteId);
    if (!sExists.ok) return sExists as Result<SubstituteRow, AppError>;
    if (!sExists.data) {
      return Err({ code: 'NOT_FOUND', message: `Analog material topilmadi: ${input.substituteId}` });
    }

    const created = await this.repo.addSubstitute({
      materialId,
      substituteId: input.substituteId,
      priority: input.priority ?? SUBSTITUTE_DEFAULT_PRIORITY,
      isApproved: input.isApproved ?? true,
      notes: input.notes ?? null,
      createdBy: userId,
    });
    if (created.ok) {
      this.logger.log(
        { materialId, substituteId: input.substituteId },
        'Material analogi qo\'shildi (EP-WMS-101)',
      );
    }
    return created;
  }

  /** Analog juftlikni o'chiradi (soft-delete). */
  async removeSubstitute(id: number, userId: number | null): Promise<Result<void, AppError>> {
    if (!Number.isInteger(id) || id <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri id: ${id}` });
    }
    return this.repo.removeSubstitute(id, userId);
  }

  /**
   * Yosh/eskirish ogohlantirishidagi partiyalar (EP-WMS-126). Data yo'q →
   * bo'sh ro'yxat (Q-40 graceful — soxta signal yo'q).
   */
  async getAgingAlerts(): Promise<Result<AgingAlertRow[], AppError>> {
    return this.repo.listAgingAlerts();
  }

  /** Xavfli materiallar joriy qoldig'i (EP-WMS-128 — xavf-zona). */
  async getHazardStock(): Promise<Result<MaterialLifeView[], AppError>> {
    return this.repo.listHazardStock();
  }
}
