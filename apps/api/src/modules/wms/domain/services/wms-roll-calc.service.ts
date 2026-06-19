/**
 * @module wms-roll-calc.service
 * @description WMS Rulon qog'oz — sof matematik hisob-kitob xizmati.
 *
 * Bu xizmat FAQAT formulalar va validatsiya — DB, NestJS DI, yoki tarmoq murojaat yo'q.
 * Shuning uchun izolyatsiyalangan unit-test yozish mumkin (hech qanday mock kerak emas).
 *
 * VIZYON manbalari:
 *   - MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3 — rulon karta maydonlari:
 *       "taxminiy uzunlik (m, auto-calc = weight/(gramaj×kenglik))"
 *   - CHAT-TARIXI-YANGI-2026-06-08.md §3:
 *       "kg = m² × grammaj"  →  m² = kg / grammaj  →  length = m² / width_m
 *
 * FORMULA (uzunlik):
 *   length_m = weightKg × 1_000_000 / (grammageGsm × widthMm)
 *
 *   Kelib chiqishi:
 *     1. area_m2 = (weightKg × 1000 [g/kg]) / grammageGsm [g/m²]   →  birlik: m²
 *     2. width_m = widthMm / 1000                                    →  birlik: m
 *     3. length_m = area_m2 / width_m                                →  birlik: m
 *        = (weightKg × 1000 / grammageGsm) / (widthMm / 1000)
 *        = weightKg × 1_000_000 / (grammageGsm × widthMm)
 *
 * FORMULA (og'irlik — teskari):
 *   weightKg = lengthM × grammageGsm × widthMm / 1_000_000
 *
 * FORMULA (maydon):
 *   areaM2 = weightKg × 1000 / grammageGsm
 *          = lengthM × widthMm / 1000
 *
 * QOIDALAR:
 *   - grammageGsm ≤ 0 yoki widthMm ≤ 0 → Err (nol bo'luvchi)
 *   - weightKg ≤ 0 → Err (salbiy og'irlik ma'nosiz)
 *   - lengthM ≤ 0 → Err (salbiy uzunlik ma'nosiz)
 *   - NaN / Infinity kirish → Err
 *   - Chiqish yaxlitlanadi (wms-roll.constants.ts ichidagi ROUND_DIGITS)
 *
 * @see apps/api/src/modules/wms/domain/constants/wms-roll.constants.ts
 * @see apps/api/test/wms-roll-calc.spec.ts
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr, AppError } from '@common/result';
import { safeDiv, roundTo } from '@common/math/math-utils';
import {
  ROLL_LENGTH_SCALE,
  ROLL_LENGTH_ROUND_DIGITS,
  ROLL_AREA_ROUND_DIGITS,
  ROLL_WEIGHT_ROUND_DIGITS,
} from '../constants/wms-roll.constants';

// ─── Domain types ────────────────────────────────────────────────────────────

/** Formulaga kiritish parametrlari (uzunlik hisoblash) */
export interface RollLengthInput {
  /** Rulon og'irligi, kg. Musbat bo'lishi shart. */
  weightKg: number;
  /** Qog'oz gramaji (GSM = g/m²). Musbat bo'lishi shart. */
  grammageGsm: number;
  /** Rulon kengligi, mm. Musbat bo'lishi shart. */
  widthMm: number;
}

/** Formulaga kiritish parametrlari (og'irlik hisoblash) */
export interface RollWeightInput {
  /** Rulon joriy uzunligi, m. Musbat bo'lishi shart. */
  currentLengthM: number;
  /** Qog'oz gramaji (GSM = g/m²). Musbat bo'lishi shart. */
  grammageGsm: number;
  /** Rulon kengligi, mm. Musbat bo'lishi shart. */
  widthMm: number;
}

/** Formulaga kiritish parametrlari (maydon hisoblash) */
export interface RollAreaInput {
  /** Rulon og'irligi, kg yoki uzunligi, m — ikkitadan biri. */
  weightKg?: number;
  /** Rulon uzunligi, m. */
  lengthM?: number;
  /** Qog'oz gramaji (GSM = g/m²). weightKg bilan ishlashda kerak. */
  grammageGsm?: number;
  /** Rulon kengligi, mm. lengthM bilan ishlashda kerak. */
  widthMm?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Kirishni tekshiruvchi: raqam, finite, musbat.
 * @returns AppError yoki null (muvaffaqiyat)
 */
function requirePositiveFinite(value: number, fieldName: string): AppError | null {
  if (!Number.isFinite(value)) {
    return AppErr('VALIDATION', `${fieldName} cheksiz yoki NaN bo'lmasligi kerak`);
  }
  if (value <= 0) {
    return AppErr('VALIDATION', `${fieldName} musbat bo'lishi kerak (berildi: ${value})`);
  }
  return null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * WmsRollCalcService — Rulon qog'oz matematik hisob-kitob xizmati.
 *
 * Sof (pure) xizmat: kirish → hisob → chiqish.
 * DB, event, external call yo'q — to'liq unit-testable.
 *
 * NestJS @Injectable() faqat DI uchun; xizmat hech qanday provider inject qilmaydi.
 * Standart Python/pytest kabi: `new WmsRollCalcService()` bilan ham ishlatish mumkin.
 */
@Injectable()
export class WmsRollCalcService {
  /**
   * Taxminiy uzunlikni hisoblaydi.
   *
   * Formula: length_m = weightKg × ROLL_LENGTH_SCALE / (grammageGsm × widthMm)
   * Bu yerda ROLL_LENGTH_SCALE = 1_000_000 (kg·mm → m birligiga aylantirish).
   *
   * @param weightKg     Rulon og'irligi, kg (> 0)
   * @param grammageGsm  Gramaj g/m² (> 0)
   * @param widthMm      Rulon kengligi mm (> 0)
   * @returns Result<number> — uzunlik metrda, ROLL_LENGTH_ROUND_DIGITS xonaga yaxlitlangan
   *
   * @example
   *   // 100 kg, 120 g/m², 1000 mm → 1000000/(120×1000) = 8.333 m
   *   svc.estimatedLengthM(100, 120, 1000) // Ok(833.333)
   */
  estimatedLengthM(
    weightKg: number,
    grammageGsm: number,
    widthMm: number,
  ): Result<number> {
    const errW = requirePositiveFinite(weightKg, 'weightKg');
    if (errW) return Err(errW);

    const errG = requirePositiveFinite(grammageGsm, 'grammageGsm');
    if (errG) return Err(errG);

    const errWd = requirePositiveFinite(widthMm, 'widthMm');
    if (errWd) return Err(errWd);

    // Denominator guaranteed > 0 (both validated > 0 above).
    // safeDiv is still used defensively to guard against any floating-point edge case.
    const raw = safeDiv(weightKg * ROLL_LENGTH_SCALE, grammageGsm * widthMm);

    return Ok(roundTo(raw, ROLL_LENGTH_ROUND_DIGITS));
  }

  /**
   * Joriy uzunlik bo'yicha qoldiq og'irlikni hisoblaydi (teskari formula).
   *
   * Formula: weightKg = lengthM × grammageGsm × widthMm / ROLL_LENGTH_SCALE
   *
   * @param currentLengthM  Joriy uzunlik, m (> 0)
   * @param grammageGsm     Gramaj g/m² (> 0)
   * @param widthMm         Rulon kengligi mm (> 0)
   * @returns Result<number> — og'irlik kg da, ROLL_WEIGHT_ROUND_DIGITS xonaga yaxlitlangan
   *
   * @example
   *   // 833.333 m, 120 g/m², 1000 mm → 833.333×120×1000/1000000 = 100 kg (round-trip)
   *   svc.remainingWeightKg(833.333, 120, 1000) // Ok(100.0)
   */
  remainingWeightKg(
    currentLengthM: number,
    grammageGsm: number,
    widthMm: number,
  ): Result<number> {
    const errL = requirePositiveFinite(currentLengthM, 'currentLengthM');
    if (errL) return Err(errL);

    const errG = requirePositiveFinite(grammageGsm, 'grammageGsm');
    if (errG) return Err(errG);

    const errWd = requirePositiveFinite(widthMm, 'widthMm');
    if (errWd) return Err(errWd);

    // Numerator = lengthM × gsm × widthMm; denominator = ROLL_LENGTH_SCALE (constant, > 0).
    const raw = safeDiv(currentLengthM * grammageGsm * widthMm, ROLL_LENGTH_SCALE);

    return Ok(roundTo(raw, ROLL_WEIGHT_ROUND_DIGITS));
  }

  /**
   * Rulon maydonini hisoblaydi (m²).
   *
   * Ikki yo'l qo'llaniladi:
   *   A) og'irlikdan: areaM2 = weightKg × 1000 / grammageGsm
   *   B) uzunlikdan:  areaM2 = lengthM × widthMm / 1000
   *
   * Ikkala yo'l ham bir xil natija beradi (matematik ekvivalent).
   * Faqat bittasi ko'rsatilsa shu ishlatiladi; ikkalasi ko'rsatilsa A ustuvor.
   *
   * @param input RollAreaInput — weightKg+grammageGsm yoki lengthM+widthMm
   * @returns Result<number> — maydon m² da, ROLL_AREA_ROUND_DIGITS xonaga yaxlitlangan
   *
   * @example
   *   // og'irlikdan: 100 kg, 120 gsm → 100×1000/120 = 833.3333 m²
   *   svc.rollAreaM2({ weightKg: 100, grammageGsm: 120 }) // Ok(833.3333)
   *
   *   // uzunlikdan: 833.333 m, 1000 mm → 833.333×1000/1000 = 833.333 m²
   *   svc.rollAreaM2({ lengthM: 833.333, widthMm: 1000 }) // Ok(833.333)
   */
  rollAreaM2(input: RollAreaInput): Result<number> {
    const { weightKg, grammageGsm, lengthM, widthMm } = input;

    // Yo'l A: og'irlikdan (weightKg + grammageGsm kerak)
    if (weightKg !== undefined && grammageGsm !== undefined) {
      const errW = requirePositiveFinite(weightKg, 'weightKg');
      if (errW) return Err(errW);

      const errG = requirePositiveFinite(grammageGsm, 'grammageGsm');
      if (errG) return Err(errG);

      // areaM2 = weightKg × KG_TO_G / grammageGsm
      //        = weightKg × 1000 / grammageGsm
      const raw = safeDiv(weightKg * 1_000, grammageGsm);
      return Ok(roundTo(raw, ROLL_AREA_ROUND_DIGITS));
    }

    // Yo'l B: uzunlikdan (lengthM + widthMm kerak)
    if (lengthM !== undefined && widthMm !== undefined) {
      const errL = requirePositiveFinite(lengthM, 'lengthM');
      if (errL) return Err(errL);

      const errWd = requirePositiveFinite(widthMm, 'widthMm');
      if (errWd) return Err(errWd);

      // areaM2 = lengthM × widthMm × MM_TO_M
      //        = lengthM × widthMm / 1000
      const raw = safeDiv(lengthM * widthMm, 1_000);
      return Ok(roundTo(raw, ROLL_AREA_ROUND_DIGITS));
    }

    return Err(AppErr(
      'VALIDATION',
      'rollAreaM2 uchun (weightKg + grammageGsm) yoki (lengthM + widthMm) berilishi kerak',
    ));
  }
}
