/**
 * @module grade-pricing.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   A55 (QC) — Sifat-darajasi (sort/grade) narx koeffitsienti.
 *
 *   STRUKTURA + FORMULA (Q-40 fabrikatsiya TAQIQ):
 *     graded_price = base_price × grade_coefficient
 *
 *   Bu xizmat sifat-nazoratidan keyin chiqgan mahsulot navi (1-sort / 2-sort /
 *   3-sort / brak) uchun narx koeffitsientini QO'LLAYDI. Koeffitsient QIYMATLARI
 *   (masalan 1-sort=1.0, 2-sort=0.8 ...) — EGASI DATASI. Bu yerda SOXTA qiymat
 *   YOZILMAYDI: koeffitsient chaqiruvchidan (master-data / config) keladi.
 *   Agar nav uchun koeffitsient berilmagan bo'lsa → VALIDATION xato (gate),
 *   fabrikatsiya qilingan 1.0 fallback EMAS.
 *
 *   Nav taksonomiyasi (QualityGrade) — bu STRUKTURA (data emas): bosma/gofra
 *   sanoatida mahsulot sifat-darajasi bo'yicha saralanadi. Koeffitsient esa
 *   har bir nav uchun egasi tomonidan belgilanadi.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { ROUND_2DP_FACTOR } from '@common/constants/app.constants';

/**
 * Mahsulot sifat-darajasi (nav). STRUKTURA — koeffitsient EMAS.
 *   FIRST   — 1-sort  (oliy nav, to'liq narx)
 *   SECOND  — 2-sort  (chegirmali nav)
 *   THIRD   — 3-sort  (past nav)
 *   SCRAP   — brak    (sotuvga yaroqsiz, odatda koeffitsient 0)
 */
export enum QualityGrade {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  SCRAP = 'scrap',
}

/** Egasi belgilaydigan koeffitsient ro'yxati (master-data). nav → koeffitsient. */
export type GradeCoefficientMap = Partial<Record<QualityGrade, number>>;

export interface GradedPriceInput {
  /** Bazaviy birlik narxi (1-sort uchun mos keladigan to'liq narx). */
  basePrice: number;
  /** Sifat-nazoratidan chiqgan nav. */
  grade: QualityGrade;
  /**
   * Egasi-data: nav → koeffitsient xaritasi. SOXTA default YO'Q —
   * tegishli nav bu xaritada bo'lmasa, hisoblash bloklanadi.
   */
  coefficients: GradeCoefficientMap;
}

export interface GradedPriceResult {
  grade: QualityGrade;
  basePrice: number;
  coefficient: number;
  gradedPrice: number;
  /** Bazaviy narxdan farq (manfiy = chegirma). */
  priceDelta: number;
}

/**
 * Koeffitsient cheklovlari (STRUKTURA invarianti, qiymat emas):
 *   - koeffitsient cheksiz son bo'lishi kerak;
 *   - manfiy bo'lmasligi kerak (narx manfiy bo'lolmaydi).
 *   Yuqori chegara (>1.0 mumkinmi) — biznes qarori; bu yerda cheklanmaydi.
 */
const COEFFICIENT_MIN = 0;

@Injectable()
export class GradePricingService {
  /**
   * Bitta nav uchun narxni koeffitsient bilan hisoblaydi.
   *
   *   graded_price = base_price × grade_coefficient
   *
   * @returns VALIDATION xato — agar nav uchun egasi koeffitsienti berilmagan
   *          yoki koeffitsient yaroqsiz (manfiy / NaN) bo'lsa.
   */
  @Calculation('qc.grade-pricing.apply')
  async applyGradeCoefficient(input: GradedPriceInput): Promise<Result<GradedPriceResult, AppError>> {
    const basePrice = safeNum(input.basePrice);
    if (basePrice < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'basePrice manfiy bo\'lishi mumkin emas' });
    }

    if (!Object.values(QualityGrade).includes(input.grade)) {
      return Err({ code: 'VALIDATION', message: `Noma'lum nav: ${String(input.grade)}` });
    }

    const coefficients = input.coefficients ?? {};
    const raw = coefficients[input.grade];

    // Q-40: nav uchun koeffitsient EGASIDAN kelishi shart — soxta fallback YO'Q.
    if (raw === undefined || raw === null) {
      return Err({
        code: 'VALIDATION',
        message: `'${input.grade}' navi uchun narx koeffitsienti belgilanmagan (egasi-data kerak)`,
      });
    }

    const coefficient = safeNum(raw, NaN);
    if (!Number.isFinite(coefficient) || coefficient < COEFFICIENT_MIN) {
      return Err({
        code: 'VALIDATION',
        message: `'${input.grade}' navi koeffitsienti yaroqsiz: ${String(raw)} (>= ${COEFFICIENT_MIN} bo'lishi kerak)`,
      });
    }

    const gradedPrice = basePrice * coefficient;
    const priceDelta = gradedPrice - basePrice;

    return Ok({
      grade: input.grade,
      basePrice: this._round2(basePrice),
      coefficient,
      gradedPrice: this._round2(gradedPrice),
      priceDelta: this._round2(priceDelta),
    });
  }

  /**
   * Egasi belgilagan koeffitsient xaritasini tekshiradi (struktura-validatsiya).
   * Hisoblash boshlanmasdan oldin master-data to'liqligini tasdiqlash uchun.
   *
   * @param coefficients nav → koeffitsient xaritasi.
   * @param requiredGrades majburiy navlar (default: SCRAP'dan tashqari sotiladiganlar).
   * @returns yetishmayotgan yoki yaroqsiz navlar ro'yxati bilan VALIDATION xato.
   */
  validateCoefficientMap(
    coefficients: GradeCoefficientMap,
    requiredGrades: QualityGrade[] = [QualityGrade.FIRST, QualityGrade.SECOND, QualityGrade.THIRD],
  ): Result<GradeCoefficientMap, AppError> {
    const map = coefficients ?? {};
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const grade of requiredGrades) {
      const raw = map[grade];
      if (raw === undefined || raw === null) {
        missing.push(grade);
        continue;
      }
      const value = safeNum(raw, NaN);
      if (!Number.isFinite(value) || value < COEFFICIENT_MIN) {
        invalid.push(`${grade}=${String(raw)}`);
      }
    }

    if (missing.length > 0 || invalid.length > 0) {
      const parts: string[] = [];
      if (missing.length > 0) parts.push(`yetishmaydi: ${missing.join(', ')}`);
      if (invalid.length > 0) parts.push(`yaroqsiz: ${invalid.join(', ')}`);
      return Err({
        code: 'VALIDATION',
        message: `Nav koeffitsient xaritasi to'liq emas (egasi-data) — ${parts.join('; ')}`,
        details: { missing, invalid },
      });
    }

    return Ok(map);
  }

  private _round2(value: number): number {
    return Math.round(safeNum(value) * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR;
  }
}
