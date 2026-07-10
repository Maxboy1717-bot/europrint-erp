/**
 * @module material-norms.service
 * @description FAZA J (Bo'lim ombori + AI norma) — biznes-logika qatlami:
 *   qo'lda norma CRUD + AI-normani haqiqiy tarixiy iste'moldan hisoblash.
 *   Result<T> qaytaradi, throw yo'q.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppErr, AppError } from '@common/result';
import { POS_AI_NORM_MIN_SAMPLE_SIZE, POS_OVER_NORM_FACTOR } from '@common/constants/business.constants';
import {
  MaterialNormsRepository,
  MaterialNormRow,
  MaterialNormListFilter,
  MaterialNormCreateInput,
  MaterialNormUpdateInput,
} from '../../infrastructure/repositories/material-norms.repository';

/**
 * Norma og'ish (drift) tahlili natijasi — bitta material (+ ixtiyoriy bo'lim)
 * uchun saqlangan faol normani haqiqiy so'nggi o'rtacha iste'mol bilan solishtiradi:
 *   deviationPct = (actualAvgQty - normQuantityPer1000) / normQuantityPer1000 * 100
 * Haqiqiy iste'mol namunasi yo'q bo'lsa (sampleCount=0) -> status='NO_ACTUAL_DATA',
 * deviationPct=null (fabrikatsiya yo'q, Q-40).
 */
export interface MaterialNormDeviation {
  materialId: number;
  departmentCode: string | null;
  materialName: string | null;
  unit: string | null;
  normQuantityPer1000: number;
  actualAvgQty: number | null;
  sampleCount: number;
  deviationQty: number | null;
  deviationPct: number | null;
  status: 'OVER_NORM' | 'UNDER_NORM' | 'WITHIN_NORM' | 'NO_ACTUAL_DATA';
}

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

  /**
   * Norma og'ish tahlili (EP-WMS-104): berilgan material (+ ixtiyoriy bo'lim) uchun
   * faol normani (findActive) haqiqiy so'nggi o'rtacha iste'mol bilan
   * (computeHistoricalConsumption — tugallangan INTERNAL_ISSUE harakatlar) solishtiradi
   * va og'ish foizini hisoblaydi. Faol norma yo'q -> NOT_FOUND. Haqiqiy namuna yo'q ->
   * status='NO_ACTUAL_DATA', deviationPct=null (Q-40 — fabrikatsiya yo'q). Outlier
   * klassifikatsiyasi mavjud POS_OVER_NORM_FACTOR (+/-) chegarasidan foydalanadi —
   * yangi egasi-chegarasi o'ylab topilmaydi.
   */
  async getDeviation(
    materialId: number,
    departmentCode: string | null,
  ): Promise<Result<MaterialNormDeviation, AppError>> {
    const normR = await this.repo.findActive(materialId, departmentCode);
    if (!normR.ok) return Err(normR.error);
    if (!normR.data) {
      const scope = departmentCode ? ` (bo'lim=${departmentCode})` : '';
      return Err(AppErr('NOT_FOUND', `material #${materialId}${scope} uchun faol norma topilmadi`));
    }

    const actR = await this.repo.computeHistoricalConsumption(materialId, departmentCode);
    if (!actR.ok) return Err(actR.error);

    const norm = Number(normR.data.norm_quantity_per_1000 ?? 0);
    const materialName = normR.data.material_name ?? actR.data?.materialName ?? null;
    const unit = normR.data.unit ?? actR.data?.unit ?? null;

    if (!actR.data || actR.data.sampleCount <= 0 || norm <= 0) {
      const noData: MaterialNormDeviation = {
        materialId,
        departmentCode,
        materialName,
        unit,
        normQuantityPer1000: norm,
        actualAvgQty: actR.data?.avgQty ?? null,
        sampleCount: actR.data?.sampleCount ?? 0,
        deviationQty: null,
        deviationPct: null,
        status: 'NO_ACTUAL_DATA',
      };
      return Ok(noData);
    }

    const actualAvg = actR.data.avgQty;
    const overLimit = norm * POS_OVER_NORM_FACTOR;
    const underLimit = norm * (2 - POS_OVER_NORM_FACTOR);
    const status: MaterialNormDeviation['status'] =
      actualAvg > overLimit ? 'OVER_NORM' : actualAvg < underLimit ? 'UNDER_NORM' : 'WITHIN_NORM';

    const result: MaterialNormDeviation = {
      materialId,
      departmentCode,
      materialName,
      unit,
      normQuantityPer1000: norm,
      actualAvgQty: actualAvg,
      sampleCount: actR.data.sampleCount,
      deviationQty: actualAvg - norm,
      deviationPct: ((actualAvg - norm) / norm) * 100,
      status,
    };
    return Ok(result);
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
