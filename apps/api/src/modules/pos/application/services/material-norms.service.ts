/**
 * @module material-norms.service
 * @description FAZA J (Bo'lim ombori + AI norma) — biznes-logika qatlami:
 *   qo'lda norma CRUD + AI-normani haqiqiy tarixiy iste'moldan hisoblash.
 *   Result<T> qaytaradi, throw yo'q.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Err, Result, AppErr, AppError } from '@common/result';
import { POS_AI_NORM_MIN_SAMPLE_SIZE } from '@common/constants/business.constants';
import {
  MaterialNormsRepository,
  MaterialNormRow,
  MaterialNormListFilter,
  MaterialNormCreateInput,
  MaterialNormUpdateInput,
} from '../../infrastructure/repositories/material-norms.repository';

@Injectable()
export class MaterialNormsService {
  private readonly logger = new Logger(MaterialNormsService.name);

  constructor(private readonly repo: MaterialNormsRepository) {}

  async list(filter: MaterialNormListFilter): Promise<Result<MaterialNormRow[]>> {
    return this.repo.list(filter);
  }

  async getById(id: number): Promise<Result<MaterialNormRow | null>> {
    return this.repo.getById(id);
  }

  async create(input: MaterialNormCreateInput, createdBy: number | null): Promise<Result<MaterialNormRow>> {
    return this.repo.create(input, createdBy);
  }

  async update(id: number, patch: MaterialNormUpdateInput): Promise<Result<MaterialNormRow | null>> {
    return this.repo.update(id, patch);
  }

  async deactivate(id: number, deletedBy: number | null): Promise<Result<boolean>> {
    return this.repo.deactivate(id, deletedBy);
  }

  /**
   * AI-norma hisoblash: haqiqiy tarixiy INTERNAL_ISSUE harakatlar (POS_AI_NORM_LOOKBACK_LIMIT
   * ta so'nggisi) o'rtacha iste'molidan norma chiqaradi va material_norms'ga yozadi
   * (calculatedByAI=true). Namuna kam bo'lsa (< POS_AI_NORM_MIN_SAMPLE_SIZE) —
   * hisoblamaydi, INSUFFICIENT_DATA qaytaradi (fabrikatsiya yo'q, Q-40).
   */
  async recalculateAi(materialId: number, departmentCode: string | null): Promise<Result<MaterialNormRow, AppError>> {
    const histR = await this.repo.computeHistoricalConsumption(materialId, departmentCode);
    if (!histR.ok) return Err(histR.error);

    const hist = histR.data;
    if (!hist || hist.sampleCount < POS_AI_NORM_MIN_SAMPLE_SIZE) {
      return Err(AppErr(
        'VALIDATION',
        `AI-norma hisoblash uchun yetarli tarixiy ma'lumot yo'q (namuna=${hist?.sampleCount ?? 0}, kerak >= ${POS_AI_NORM_MIN_SAMPLE_SIZE}). Fabrikatsiya qilinmaydi.`,
      ));
    }

    const materialName = hist.materialName ?? `material #${materialId}`;
    const unit = hist.unit ?? 'dona';
    const scope = departmentCode ? `bo'lim=${departmentCode}` : "global, barcha bo'lim";
    const formula = `AVG(declared_qty) so'nggi ${hist.sampleCount} ta tugallangan INTERNAL_ISSUE ` +
      `harakat bo'yicha (${scope}) — haqiqiy tarixiy iste'mol, AI qiymat o'ylab topmaydi (Q-40).`;

    const upsertR = await this.repo.upsertAiNorm(materialId, departmentCode, {
      materialName,
      unit,
      avgQty: hist.avgQty,
      sampleCount: hist.sampleCount,
      formula,
    });
    if (!upsertR.ok) return Err(upsertR.error);

    this.logger.log(
      `[MaterialNormsAI] material=${materialId} dept=${departmentCode ?? 'GLOBAL'} avgQty=${hist.avgQty.toFixed(3)} sample=${hist.sampleCount}`,
    );
    return upsertR;
  }
}
