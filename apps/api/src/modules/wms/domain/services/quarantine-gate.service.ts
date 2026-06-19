/**
 * @module quarantine-gate.service
 * @description WMS karantin darvozasining SOF (pure) domen logikasi.
 *   DB ga bog'liq emas — faqat holat-mashinasi va og'irlik bardoshi
 *   tekshiruvlari. Result<T> qaytaradi; hech qachon throw qilmaydi.
 *   Real DB enforcement WmsQuarantineGateService (application qatlam)
 *   tomonidan shu servisni chaqirib amalga oshiriladi.
 * @layer Domain (WMS)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  QUARANTINE_STATUS,
  QUARANTINE_TRANSITIONS,
  QC_DECISION_TO_STATUS,
  RECEIPT_WEIGHT_TOLERANCE,
  QuarantineStatus,
  QcDecision,
  normalizeStatus,
} from '../constants/wms-quarantine.constants';

export interface WeightToleranceInput {
  /** Kutilgan (buyurtma/etalon) og'irlik yoki miqdor. Birlik ahamiyatsiz, nisbat olinadi. */
  expected: number;
  /** Haqiqatda o'lchangan (qabul qilingan) og'irlik yoki miqdor. */
  actual: number;
  /** Menejer tasdig'i bayrog'i (±2% dan yuqori chetlanishda majburiy). */
  managerFlag?: boolean;
  /** Majburiy sabab (±2% dan yuqori chetlanishda bo'sh bo'lmasligi kerak). */
  reason?: string | null;
}

export interface WeightToleranceResult {
  /** Chetlanish ulushi (0.02 = 2%); absolyut qiymat. */
  deviation: number;
  /** Bardosh ichidami (auto-qabul). */
  withinTolerance: boolean;
  /** Menejer tasdig'i talab qilinadimi. */
  requiresApproval: boolean;
}

@Injectable()
export class QuarantineGateService {
  /**
   * Holat o'tishi ruxsat etilganligini tekshiradi (holat-mashinasi).
   * Asosiy invariant: MAIN ga FAQAT QC_PASS dan o'tiladi; KARANTIN dan
   * to'g'ridan-to'g'ri MAIN ga o'tish RAD etiladi.
   *
   * @param fromRaw - joriy (xom) holat satri
   * @param toRaw   - maqsad (xom) holat satri
   * @returns Ok(maqsad holat) ruxsat berilsa; Err(INVALID_TRANSITION) aks holda.
   */
  validateTransition(
    fromRaw: string | null | undefined,
    toRaw: string | null | undefined,
  ): Result<QuarantineStatus, AppError> {
    const from = normalizeStatus(fromRaw);
    const to = normalizeStatus(toRaw);

    if (!from) {
      return Err({ code: 'INVALID_TRANSITION', message: `Noma'lum joriy holat: '${fromRaw}'` });
    }
    if (!to) {
      return Err({ code: 'INVALID_TRANSITION', message: `Noma'lum maqsad holat: '${toRaw}'` });
    }

    const allowed = QUARANTINE_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      return Err({
        code: 'INVALID_TRANSITION',
        message: `'${from}' → '${to}' o'tish ruxsat etilmagan. Ruxsat: [${allowed.join(', ') || 'yo\'q'}]`,
      });
    }
    return Ok(to);
  }

  /**
   * Qabulning MAIN omborga (mavjud stok bo'lishiga) o'tishi mumkinligini
   * tekshiradi. Faqat QC_PASS holatidagi qabul MAIN ga o'tadi.
   * Bu — UI emas, BACKEND darvozasi: karantindagi qabul stok posta olmaydi.
   *
   * @param currentRaw - qabulning joriy (xom) holati
   */
  canPostToMain(currentRaw: string | null | undefined): Result<true, AppError> {
    const current = normalizeStatus(currentRaw);
    if (current === QUARANTINE_STATUS.MAIN) {
      return Err({ code: 'INVALID_TRANSITION', message: 'Qabul allaqachon MAIN omborda' });
    }
    if (current !== QUARANTINE_STATUS.QC_PASS) {
      return Err({
        code: 'BUSINESS_RULE_VIOLATION',
        message: `Karantin darvozasi: stok faqat QC_PASS dan keyin MAIN ga o'tadi (joriy: '${current ?? currentRaw}')`,
      });
    }
    return Ok(true);
  }

  /**
   * QC qarorini (QABUL/REWORK/CHIQARISH) keyingi holatga aylantiradi va
   * joriy holatdan o'tish ruxsatini tekshiradi. QC qarori faqat KARANTIN
   * holatidagi qabulda qabul qilinadi.
   *
   * @param currentRaw - joriy (xom) holat
   * @param decision   - QC qarori
   */
  resolveQcDecision(
    currentRaw: string | null | undefined,
    decision: QcDecision,
  ): Result<QuarantineStatus, AppError> {
    const target = QC_DECISION_TO_STATUS[decision];
    if (!target) {
      return Err({ code: 'VALIDATION', message: `Noma'lum QC qarori: '${decision}'` });
    }
    return this.validateTransition(currentRaw, target);
  }

  /**
   * Og'irlik (gramaj) bardoshini tekshiradi — EP-WMS-047.
   *   ±2% ichida → auto-qabul (withinTolerance=true, approval kerak emas).
   *   ±2% dan yuqori → menejer tasdig'i (managerFlag) + majburiy sabab shart;
   *                    aks holda Err(BUSINESS_RULE_VIOLATION).
   *
   * @param input - kutilgan/haqiqiy og'irlik + (ixtiyoriy) managerFlag/reason
   */
  checkWeightTolerance(input: WeightToleranceInput): Result<WeightToleranceResult, AppError> {
    const { expected, actual, managerFlag, reason } = input;

    if (!Number.isFinite(expected) || expected <= 0) {
      return Err({ code: 'INVALID_QUANTITY', message: 'Kutilgan og\'irlik musbat bo\'lishi kerak' });
    }
    if (!Number.isFinite(actual) || actual < 0) {
      return Err({ code: 'INVALID_QUANTITY', message: 'Haqiqiy og\'irlik manfiy bo\'lmasligi kerak' });
    }

    const deviation = Math.abs(actual - expected) / expected;
    const withinTolerance = deviation <= RECEIPT_WEIGHT_TOLERANCE;

    if (withinTolerance) {
      return Ok({ deviation, withinTolerance: true, requiresApproval: false });
    }

    // Bardoshdan yuqori — menejer tasdig'i + majburiy sabab shart.
    if (!managerFlag) {
      return Err({
        code: 'BUSINESS_RULE_VIOLATION',
        message: `Og'irlik chetlanishi ${(deviation * 100).toFixed(2)}% (>${(RECEIPT_WEIGHT_TOLERANCE * 100).toFixed(0)}%) — menejer tasdig'i talab qilinadi`,
      });
    }
    if (!reason || String(reason).trim().length === 0) {
      return Err({
        code: 'INVALID_REASON',
        message: `Og'irlik chetlanishi ${(deviation * 100).toFixed(2)}% — majburiy sabab kiritilishi shart`,
      });
    }

    return Ok({ deviation, withinTolerance: false, requiresApproval: true });
  }
}
