/**
 * @module supplier-rating.constants
 * @description Ta'minotchi ishonchlilik reytingi (EP-WMS-094 / EP-WMS-022) uchun
 *   4-faktor og'irliklari, oyna kengligi va past-reyting chegarasi.
 *
 *   ⚠️ Q-40 (fabrikatsiya taqiq): faktor OG'IRLIKLARI — egasi-DATA. Bu yerdagi
 *   qiymatlar FAQAT default'lar (tasdiqlangan biznes-og'irlik kelguncha). Egasi
 *   `SUPPLIER_RATING_WEIGHT_*` env'lari orqali yoki master-data jadvali bilan
 *   ularni o'rnatadi. Default'lar yig'indisi = 1.0 (validatsiya bilan tekshiriladi).
 *
 *   ⚠️ Q-40 NARX-faktori: ta'minotchining "narx raqobatbardoshligi" uchun haqiqiy
 *   bozor/benchmark narxi master-data'da yo'q. Shu sabab narx-faktori SOXTA
 *   to'ldirilmaydi — joriy oynadagi o'rtacha birlik narx VOLATILLIGI (barqarorlik)
 *   proksisi sifatida hisoblanadi; benchmark kelganda almashtiriladi.
 * @layer Domain (WMS)
 */

/** Reyting shkalasi: 1.0 (eng past) .. 5.0 (eng yuqori). */
export const SUPPLIER_RATING_MIN = 1.0;
export const SUPPLIER_RATING_MAX = 5.0;

/** Har bir 0..1 faktor ballini 1..5 shkalaga aylantirish: 1 + factor*4. */
export const SUPPLIER_RATING_SCALE_BASE = 1.0;
export const SUPPLIER_RATING_SCALE_SPAN = 4.0;

/** Reyting oynasi: oxirgi N oy (vizyon — "oxirgi-6oy oynasi"). */
export const SUPPLIER_RATING_WINDOW_MONTHS = 6;

/**
 * 4-faktor default og'irliklari (egasi-DATA → o'zgartiriladi). Yig'indi = 1.0.
 *   onTime   — o'z vaqtida yetkazib berish ulushi.
 *   quality  — brak (rad etilgan/QC-fail) teskari ulushi = sifat.
 *   price    — narx barqarorligi proksisi (benchmark kelguncha).
 *   document — hujjat to'liqligi (hisob-faktura/3-tomon moslik) ulushi.
 */
export const SUPPLIER_RATING_DEFAULT_WEIGHTS = {
  onTime: 0.4,
  quality: 0.3,
  price: 0.2,
  document: 0.1,
} as const;

/** Og'irlik yig'indisi 1.0 ekanini tekshirish uchun suzuvchi-nuqta tolerantligi. */
export const SUPPLIER_RATING_WEIGHT_SUM_EPSILON = 0.001;

/**
 * Past-reyting PO-ogohlantirish chegarasi (1..5). Bundan past reyting →
 * vendors.rating_low_flag = TRUE (yangi PO ochishda ogohlantirish ko'rsatiladi).
 * Egasi-DATA (default = 2.5).
 */
export const SUPPLIER_RATING_LOW_THRESHOLD = 2.5;

/**
 * Narx volatilligini (CV = std/mean) sifat-ballga aylantirish koeffitsienti.
 * score = clamp(1 - CV * K, 0, 1). Yuqori volatillik → past narx-ball.
 * Benchmark narx kelguncha ishlatiladigan proksis koeffitsienti (egasi-DATA).
 */
export const SUPPLIER_RATING_PRICE_VOLATILITY_K = 1.0;

/** Ishonchli metrik uchun minimal kuzatuv soni; bundan kam → faktor neytral (skip). */
export const SUPPLIER_RATING_MIN_OBSERVATIONS = 1;

/** ConfigService env kalitlari (egasi qiymat berganda default'ni bekor qiladi). */
export const SUPPLIER_RATING_ENV_KEYS = {
  onTime: 'SUPPLIER_RATING_WEIGHT_ON_TIME',
  quality: 'SUPPLIER_RATING_WEIGHT_QUALITY',
  price: 'SUPPLIER_RATING_WEIGHT_PRICE',
  document: 'SUPPLIER_RATING_WEIGHT_DOCUMENT',
} as const;

/** Faktor breakdown — 0..1 oralig'idagi xom ko'rsatkichlar (skip bo'lsa null). */
export interface SupplierFactorScores {
  /** O'z vaqtida yetkazilgan PO ulushi (0..1) yoki null (data yo'q → skip). */
  onTime: number | null;
  /** Sifat = 1 - brak ulushi (0..1) yoki null. */
  quality: number | null;
  /** Narx barqarorligi proksisi (0..1) yoki null. */
  price: number | null;
  /** Hujjat to'liqligi ulushi (0..1) yoki null. */
  document: number | null;
}

/** Bitta ta'minotchining oyna bo'yicha xom agregatlari (repo qaytaradi). */
export interface SupplierWindowAggregate {
  vendorId: number;
  /** Oynadagi jami yetkazib berishlar / PO soni. */
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  /** QC: qabul qilingan vs rad etilgan birlik/element soni. */
  qcAccepted: number;
  qcRejected: number;
  /** Hujjat: invoice/3-tomon mosligi bor PO soni. */
  documentsComplete: number;
  documentsTotal: number;
  /** Narx volatilligi (CV) yoki null (yetarli kuzatuv yo'q). */
  priceCv: number | null;
  /** Oynadagi o'rtacha birlik narx (ma'lumot uchun). */
  avgUnitPrice: number | null;
  /** Oynadagi jami sarf (currency). */
  totalSpend: number;
}
