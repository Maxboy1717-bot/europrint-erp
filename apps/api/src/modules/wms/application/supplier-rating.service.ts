/**
 * @module supplier-rating.service
 * @description Ta'minotchi ishonchlilik reytingi (EP-WMS-094 / EP-WMS-022) —
 *   application qatlam. Har FG/material kirim yoki QC-fail event'da oxirgi
 *   N-oy oynasi bo'yicha 4-faktor reytingni qayta hisoblaydi va saqlaydi.
 *
 *   4 FAKTOR (har biri 0..1, keyin 1..5 shkalaga):
 *     1. onTime   — o'z vaqtida yetkazib berish ulushi.
 *     2. quality  — sifat = 1 - brak (rad etilgan) ulushi.
 *     3. price    — narx barqarorligi (volatillik proksisi; benchmark egasi-DATA).
 *     4. document — hujjat to'liqligi (invoice / 3-tomon moslik) ulushi.
 *
 *   ⚠️ Q-40: faktor og'irliklari egasi-DATA. Default'lar ishlatiladi va
 *   ConfigService env (`SUPPLIER_RATING_WEIGHT_*`) bilan bekor qilinadi.
 *   Data yo'q faktor (null) → og'irliklar mavjud faktorlar bo'yicha qayta
 *   normallashtiriladi (soxta qiymat YOZILMAYDI). Hech qanday faktor yo'q →
 *   reyting o'zgartirilmaydi (skip + log).
 *
 *   Q-46: faqat ADDITIVE — yangi reyting hisobi; mavjud WMS yo'liga tegmaydi.
 * @layer Application (WMS)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  ISupplierRatingRepo,
  SUPPLIER_RATING_REPO,
  SupplierRatingPersist,
} from '../domain/repositories/i-supplier-rating.repo';
import {
  SUPPLIER_RATING_DEFAULT_WEIGHTS,
  SUPPLIER_RATING_ENV_KEYS,
  SUPPLIER_RATING_LOW_THRESHOLD,
  SUPPLIER_RATING_MAX,
  SUPPLIER_RATING_MIN,
  SUPPLIER_RATING_MIN_OBSERVATIONS,
  SUPPLIER_RATING_PRICE_VOLATILITY_K,
  SUPPLIER_RATING_SCALE_BASE,
  SUPPLIER_RATING_SCALE_SPAN,
  SUPPLIER_RATING_WEIGHT_SUM_EPSILON,
  SUPPLIER_RATING_WINDOW_MONTHS,
  SupplierFactorScores,
  SupplierWindowAggregate,
} from '../domain/constants/supplier-rating.constants';

/** Hisoblangan reyting natijasi (listener/log uchun). */
export interface SupplierRatingResult {
  vendorId: number;
  /** Yakuniy reyting 1..5 yoki null (hech qanday faktor yo'q → skip). */
  rating: number | null;
  lowFlag: boolean;
  factors: SupplierFactorScores;
  /** Hisoblashga sabab bo'lgan manba (event nomi). */
  source: string;
}

@Injectable()
export class SupplierRatingService {
  private readonly logger = new Logger(SupplierRatingService.name);

  constructor(
    @Inject(SUPPLIER_RATING_REPO) private readonly repo: ISupplierRatingRepo,
    private readonly config: ConfigService,
  ) {}

  /**
   * Ta'minotchi reytingini oxirgi N-oy oynasi bo'yicha qayta hisoblaydi va saqlaydi.
   * @param vendorId  — ta'minotchi (vendors.id).
   * @param source    — qayta hisoblash sababini ko'rsatadigan yorliq (event nomi).
   */
  async recompute(vendorId: number, source: string): Promise<Result<SupplierRatingResult, AppError>> {
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      return Err({ code: 'VALIDATION', message: `Noto'g'ri vendorId: ${vendorId}` });
    }

    const exists = await this.repo.vendorExists(vendorId);
    if (!exists.ok) return exists as Result<SupplierRatingResult, AppError>;
    if (!exists.data) {
      this.logger.warn({ vendorId, source }, 'recompute: vendor topilmadi — skip');
      return Ok({ vendorId, rating: null, lowFlag: false, factors: this._emptyFactors(), source });
    }

    const aggResult = await this.repo.computeWindowAggregate(vendorId, SUPPLIER_RATING_WINDOW_MONTHS);
    if (!aggResult.ok) return aggResult as Result<SupplierRatingResult, AppError>;

    const factors = this._scoreFactors(aggResult.data);
    const rating = this._weightedRating(factors);

    if (rating == null) {
      // Q-40: hech qanday faktor uchun data yo'q → SOXTA reyting yozilmaydi.
      this.logger.warn(
        { vendorId, source },
        'recompute: oxirgi oynada hech qanday faktor-data yo\'q — reyting o\'zgartirilmadi',
      );
      return Ok({ vendorId, rating: null, lowFlag: false, factors, source });
    }

    const lowFlag = rating < SUPPLIER_RATING_LOW_THRESHOLD;

    const persist: SupplierRatingPersist = {
      vendorId,
      rating: this._round2(rating),
      lowFlag,
      onTimeRate: factors.onTime,
      qualityRate: factors.quality,
      priceScore: factors.price,
      documentCompliance: factors.document,
      totalOrders: aggResult.data.totalDeliveries,
      onTimeDeliveries: aggResult.data.onTimeDeliveries,
      lateDeliveries: aggResult.data.lateDeliveries,
      totalSpend: aggResult.data.totalSpend,
      source,
    };

    const saved = await this.repo.persistRating(persist);
    if (!saved.ok) return saved as Result<SupplierRatingResult, AppError>;

    this.logger.log(
      { vendorId, rating: persist.rating, lowFlag, source, factors },
      'Ta\'minotchi reytingi qayta hisoblandi (4-faktor, oxirgi oyna)',
    );

    if (lowFlag) {
      this.logger.warn(
        { vendorId, rating: persist.rating, threshold: SUPPLIER_RATING_LOW_THRESHOLD },
        'PAST REYTING — yangi PO ochishda ogohlantirish (rating_low_flag=TRUE)',
      );
    }

    return Ok({ vendorId, rating: persist.rating, lowFlag, factors, source });
  }

  // ---------------------------------------------------------------------------
  // Sof hisoblash (DB yo'q)
  // ---------------------------------------------------------------------------

  /** Xom agregatdan 4 faktor ballini (0..1) chiqaradi; data yo'q faktor = null. */
  private _scoreFactors(agg: SupplierWindowAggregate): SupplierFactorScores {
    // onTime — faqat o'z-vaqtida o'lchanadigan (expected+actual bor) yetkazishlar.
    const onTimeMeasured = agg.onTimeDeliveries + agg.lateDeliveries;
    const onTime =
      onTimeMeasured >= SUPPLIER_RATING_MIN_OBSERVATIONS
        ? this._clamp01(agg.onTimeDeliveries / onTimeMeasured)
        : null;

    // quality — 1 - brak ulushi.
    const qcTotal = agg.qcAccepted + agg.qcRejected;
    const quality =
      qcTotal >= SUPPLIER_RATING_MIN_OBSERVATIONS
        ? this._clamp01(1 - agg.qcRejected / qcTotal)
        : null;

    // price — volatillik proksisi: score = 1 - CV*K (CV yuqori → past ball).
    const price =
      agg.priceCv != null
        ? this._clamp01(1 - agg.priceCv * SUPPLIER_RATING_PRICE_VOLATILITY_K)
        : null;

    // document — invoice / 3-tomon moslik bor PO ulushi.
    const document =
      agg.documentsTotal >= SUPPLIER_RATING_MIN_OBSERVATIONS
        ? this._clamp01(agg.documentsComplete / agg.documentsTotal)
        : null;

    return { onTime, quality, price, document };
  }

  /**
   * Og'irlikli reyting (1..5). null faktorlar tashlanadi, og'irliklar mavjud
   * faktorlar bo'yicha qayta normallashtiriladi (Q-40: soxta to'ldirish yo'q).
   * Hech qanday faktor yo'q → null.
   */
  private _weightedRating(factors: SupplierFactorScores): number | null {
    const weights = this._resolveWeights();
    const parts: Array<{ score: number; weight: number }> = [];

    if (factors.onTime != null) parts.push({ score: factors.onTime, weight: weights.onTime });
    if (factors.quality != null) parts.push({ score: factors.quality, weight: weights.quality });
    if (factors.price != null) parts.push({ score: factors.price, weight: weights.price });
    if (factors.document != null) parts.push({ score: factors.document, weight: weights.document });

    const weightSum = parts.reduce((s, p) => s + p.weight, 0);
    if (parts.length === 0 || weightSum <= 0) return null;

    const normalised = parts.reduce((s, p) => s + p.score * (p.weight / weightSum), 0);
    const scaled = SUPPLIER_RATING_SCALE_BASE + normalised * SUPPLIER_RATING_SCALE_SPAN;
    return this._clampRating(scaled);
  }

  /**
   * Faktor og'irliklarini ConfigService env'dan o'qiydi (egasi-DATA). Har biri
   * yo'q bo'lsa default ishlatiladi. Yig'indi ~1.0 emas → default'larga qaytadi
   * (graceful — buzilgan konfiguratsiya reytingni buzmasin).
   */
  private _resolveWeights(): { onTime: number; quality: number; price: number; document: number } {
    const read = (key: string, fallback: number): number => {
      const raw = this.config.get<string | number>(key);
      if (raw == null) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };

    const candidate = {
      onTime: read(SUPPLIER_RATING_ENV_KEYS.onTime, SUPPLIER_RATING_DEFAULT_WEIGHTS.onTime),
      quality: read(SUPPLIER_RATING_ENV_KEYS.quality, SUPPLIER_RATING_DEFAULT_WEIGHTS.quality),
      price: read(SUPPLIER_RATING_ENV_KEYS.price, SUPPLIER_RATING_DEFAULT_WEIGHTS.price),
      document: read(SUPPLIER_RATING_ENV_KEYS.document, SUPPLIER_RATING_DEFAULT_WEIGHTS.document),
    };

    const sum = candidate.onTime + candidate.quality + candidate.price + candidate.document;
    if (Math.abs(sum - 1.0) > SUPPLIER_RATING_WEIGHT_SUM_EPSILON) {
      // Yig'indi 1.0 emas — egasi qisman/noto'g'ri kiritgan. Normallashtirish
      // _weightedRating ichida baribir bo'ladi, lekin yig'indi 0 bo'lsa default'ga qaytamiz.
      if (sum <= 0) return SUPPLIER_RATING_DEFAULT_WEIGHTS;
    }
    return candidate;
  }

  private _emptyFactors(): SupplierFactorScores {
    return { onTime: null, quality: null, price: null, document: null };
  }

  private _clamp01(v: number): number {
    if (!Number.isFinite(v)) return 0;
    return Math.min(1, Math.max(0, v));
  }

  private _clampRating(v: number): number {
    if (!Number.isFinite(v)) return SUPPLIER_RATING_MIN;
    return Math.min(SUPPLIER_RATING_MAX, Math.max(SUPPLIER_RATING_MIN, v));
  }

  private _round2(v: number): number {
    return Math.round(v * 100) / 100;
  }
}
