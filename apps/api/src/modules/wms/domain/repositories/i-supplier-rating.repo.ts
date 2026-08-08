/**
 * @module i-supplier-rating.repo
 * @description Ta'minotchi reyting repository porti (EP-WMS-094 / EP-WMS-022).
 *   Service ↔ DB chegarasi (CLAUDE.md Qoida 15 — service'da to'g'ridan db.* YO'Q).
 *   Hamma metod Result<T> qaytaradi (throw/null YO'Q).
 * @layer Domain (WMS)
 */

import { Result, AppError } from '@common/result';
import { SupplierWindowAggregate } from '../constants/supplier-rating.constants';

export const SUPPLIER_RATING_REPO = Symbol('SUPPLIER_RATING_REPO');

/** Reyting qayta hisoblangach saqlanadigan natija (persistentlik uchun). */
export interface SupplierRatingPersist {
  vendorId: number;
  /** Yakuniy umumiy reyting (1..5). */
  rating: number;
  /** Past-reyting bayrog'i (PO-ogohlantirish). */
  lowFlag: boolean;
  /** 0..1 faktor ballari (null = skip qilingan faktor). */
  onTimeRate: number | null;
  qualityRate: number | null;
  priceScore: number | null;
  documentCompliance: number | null;
  /** Oynadagi xom agregatlar (metrik qatori uchun). */
  totalOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  totalSpend: number;
  /** Qayta hisoblash sababini ko'rsatadigan manba yorlig'i. */
  source: string;
}

/** Reyting o'qish satri (FE jadval/karta uchun — ADDITIVE READ). */
export interface SupplierRatingRow {
  vendorId: number;
  vendorName: string | null;
  /** Saqlangan reyting (1..5) yoki null (hali hisoblanmagan). */
  rating: number | null;
  /** Past-reyting bayrog'i (PO-ogohlantirish). */
  ratingLowFlag: boolean;
  /** Oxirgi qayta hisoblash vaqti (ISO) yoki null. */
  ratingUpdatedAt: string | null;
}

/** Oxirgi oylik breakdown (vendor_performance_metrics dan — ADDITIVE READ). */
export interface SupplierRatingDetail extends SupplierRatingRow {
  onTimeRate: number | null;
  qualityScore: number | null;
  priceCompetitiveness: number | null;
  documentCompliance: number | null;
  totalOrders: number | null;
  onTimeDeliveries: number | null;
  lateDeliveries: number | null;
  totalSpend: number | null;
  periodYear: number | null;
  periodMonth: number | null;
  source: string | null;
}

export interface ISupplierRatingRepo {
  /**
   * Hamma ta'minotchilar reytingini o'qiydi (FE jadval uchun — ADDITIVE READ).
   * Reyting bo'yicha tartib (past oldin → ogohlantirish ko'rinadi). Data yo'q → bo'sh.
   */
  listRatings(
    lowOnly: boolean,
    limit: number,
    offset: number,
  ): Promise<Result<SupplierRatingRow[], AppError>>;

  /**
   * Bitta ta'minotchi reytingi + oxirgi oylik breakdown (ADDITIVE READ).
   * Topilmasa NOT_FOUND. Reyting null bo'lishi mumkin (hali hisoblanmagan).
   */
  getRating(vendorId: number): Promise<Result<SupplierRatingDetail | null, AppError>>;

  /**
   * Bitta ta'minotchi uchun oxirgi N-oy oynasidagi xom agregatlarni hisoblaydi.
   * Data yo'q bo'lsa nol-agregat qaytaradi (Q-40 graceful — skip emas, neytral).
   */
  computeWindowAggregate(
    vendorId: number,
    windowMonths: number,
  ): Promise<Result<SupplierWindowAggregate, AppError>>;

  /**
   * Hisoblangan reytingni saqlaydi: vendors.rating + low_flag + updated_at UPDATE
   * va vendor_performance_metrics ga oylik breakdown UPSERT.
   */
  persistRating(input: SupplierRatingPersist): Promise<Result<void, AppError>>;

  /** Vendor IDsi mavjudligini tekshiradi (event'dagi supplierId xato bo'lishi mumkin). */
  vendorExists(vendorId: number): Promise<Result<boolean, AppError>>;
}
