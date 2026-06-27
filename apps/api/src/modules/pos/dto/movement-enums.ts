/**
 * @module movement-enums
 * @description Source module. See exports for details.
 */

export enum MovementTypeCode {
  EXTERNAL_IN         = 'EXTERNAL_IN',
  EXTERNAL_OUT        = 'EXTERNAL_OUT',
  INTERNAL_ISSUE      = 'INTERNAL_ISSUE',
  INTERNAL_RETURN     = 'INTERNAL_RETURN',
  DAMAGE              = 'DAMAGE',
  INTERNAL_TRANSFER   = 'INTERNAL_TRANSFER',
  INVENTORY_ADJ_PLUS  = 'INVENTORY_ADJ_PLUS',
  INVENTORY_ADJ_MINUS = 'INVENTORY_ADJ_MINUS',
  // ─── POS Monitor vizyon-kengaytirish (ADDITIVE, 2026-06-27) ──────────────
  WASTE_IN            = 'WASTE_IN',            // chiqindi/qoldiq (makulatura) kirim
  LAB_SAMPLE_OUT      = 'LAB_SAMPLE_OUT',      // laboratoriya namuna olish (chiqim)
  PARTIAL_RECEIPT     = 'PARTIAL_RECEIPT',     // kam/buzuq material qisman qabul
  CUSTOMER_MATERIAL   = 'CUSTOMER_MATERIAL',   // mijoz-mol (davalcheskoe) kirim
}

export enum MovementStatus {
  DRAFT         = 'draft',
  QC_PENDING    = 'qc_pending',
  QC_APPROVED   = 'qc_approved',
  QC_REWORK     = 'qc_rework',
  QC_REJECTED   = 'qc_rejected',
  PENDING       = 'pending',
  APPROVED      = 'approved',
  AI_PROCESSING = 'ai_processing',
  COMPLETED     = 'completed',
  CANCELLED     = 'cancelled',
}

export enum QcDecision {
  APPROVED = 'APPROVED',
  REWORK   = 'REWORK',
  REJECTED = 'REJECTED',
}

// ─── POS Monitor — 5-tur kanonik taksonomiya ────────────────────────────────
//
// POS Monitor barcha harakat-turlarini (pos_movement_types) 5 ta KANONIK
// kategoriyaga guruhlaydi. Bu — har bir `MovementTypeCode` (va jonli DB'dagi
// drift kod `INVENTORY_ADJUST`) uchun yagona haqiqat manbai: qaysi kategoriya,
// qaysi yo'nalish (direction), ombor qoldig'iga ta'siri (stockSign).
//
// Fabrikatsiya YO'Q (Q-40): bu yerda biznes-narx/koeff emas — faqat
// taksonomik faktlar (kod → kategoriya) mavjud direction semantikasidan.

/** POS Monitor 5 kanonik harakat-kategoriyasi. */
export enum MovementCategory {
  KIRIM            = 'KIRIM',            // material ombor ichiga (in)
  CHIQIM           = 'CHIQIM',           // material ombordan tashqariga (out)
  KOCHIRISH        = 'KOCHIRISH',        // ombordan omborga (transfer)
  INVENTARIZATSIYA = 'INVENTARIZATSIYA', // sanoq tuzatishi (adjustment ±)
  ZARAR            = 'ZARAR',            // zarar / hisobdan chiqarish (write-off)
}

/** Harakat-yo'nalishi — `pos_movement_types.direction` qiymatlariga mos. */
export type MovementDirection = 'in' | 'out' | 'transfer' | 'adjustment';

/** Ombor qoldig'iga ta'sir ishorasi: +1 kirim, -1 chiqim, 0 neytral/ikki-tomon. */
export type StockSign = 1 | -1 | 0;

/** Bitta kategoriya metama'lumoti (POS Monitor UI guruh-kartasi uchun). */
export interface MovementCategoryMeta {
  category:  MovementCategory;
  labelUz:   string;
  labelRu:   string;
  direction: MovementDirection;
  /** Qoldiq ishorasi: kirim=+1, chiqim=-1, ko'chirish/sanoq=0 (kontekstga bog'liq). */
  stockSign: StockSign;
  /** Shu kategoriyaga tegishli harakat-kodlari (jonli DB + enum drift kodlari bilan). */
  codes: readonly string[];
}

/**
 * 5 kanonik kategoriya — to'liq metama'lumot bilan.
 * `codes` jonli DB'dagi barcha kodlarni (INVENTORY_ADJUST) ham qamrab oladi.
 */
export const MOVEMENT_CATEGORY_META: Readonly<Record<MovementCategory, MovementCategoryMeta>> = {
  [MovementCategory.KIRIM]: {
    category:  MovementCategory.KIRIM,
    labelUz:   'Kirim',
    labelRu:   'Приход',
    direction: 'in',
    stockSign: 1,
    codes: [
      MovementTypeCode.EXTERNAL_IN,
      MovementTypeCode.INTERNAL_RETURN,
      // Vizyon-kengaytirish: barchasi ombor ichiga kirim (stockSign +1)
      MovementTypeCode.WASTE_IN,          // makulatura/chiqindi ikkilamchi ombor
      MovementTypeCode.PARTIAL_RECEIPT,   // qabul qilingan qism omborga kiradi
      MovementTypeCode.CUSTOMER_MATERIAL, // mijoz-mol (davalcheskoe) kirim
    ],
  },
  [MovementCategory.CHIQIM]: {
    category:  MovementCategory.CHIQIM,
    labelUz:   'Chiqim',
    labelRu:   'Расход',
    direction: 'out',
    stockSign: -1,
    codes: [
      MovementTypeCode.EXTERNAL_OUT,
      MovementTypeCode.INTERNAL_ISSUE,
      // Vizyon-kengaytirish: laboratoriya namuna ombordan chiqim (stockSign -1)
      MovementTypeCode.LAB_SAMPLE_OUT,
    ],
  },
  [MovementCategory.KOCHIRISH]: {
    category:  MovementCategory.KOCHIRISH,
    labelUz:   "Ko'chirish",
    labelRu:   'Перемещение',
    direction: 'transfer',
    stockSign: 0,
    codes: [
      MovementTypeCode.INTERNAL_TRANSFER,
    ],
  },
  [MovementCategory.INVENTARIZATSIYA]: {
    category:  MovementCategory.INVENTARIZATSIYA,
    labelUz:   'Inventarizatsiya',
    labelRu:   'Инвентаризация',
    direction: 'adjustment',
    stockSign: 0,
    // enum: ADJ_PLUS/ADJ_MINUS · jonli DB drift kod: INVENTORY_ADJUST
    codes: [
      MovementTypeCode.INVENTORY_ADJ_PLUS,
      MovementTypeCode.INVENTORY_ADJ_MINUS,
      'INVENTORY_ADJUST',
    ],
  },
  [MovementCategory.ZARAR]: {
    category:  MovementCategory.ZARAR,
    labelUz:   'Zarar',
    labelRu:   'Ущерб',
    direction: 'adjustment',
    stockSign: -1,
    codes: [
      MovementTypeCode.DAMAGE,
    ],
  },
};

/** Harakat-kodi → kanonik kategoriya (deterministik teskari indeks). */
export const MOVEMENT_CODE_TO_CATEGORY: Readonly<Record<string, MovementCategory>> =
  Object.values(MOVEMENT_CATEGORY_META).reduce<Record<string, MovementCategory>>(
    (acc, meta) => {
      for (const code of meta.codes) acc[code] = meta.category;
      return acc;
    },
    {},
  );

/**
 * Harakat-kodidan kanonik kategoriyani aniqlaydi.
 * Noma'lum kod → null (POS Monitor "Boshqa" guruhiga tushadi, crash emas).
 */
export function resolveMovementCategory(code: string | null | undefined): MovementCategory | null {
  if (!code) return null;
  return MOVEMENT_CODE_TO_CATEGORY[code] ?? null;
}

/** POS Monitor uchun 5 kategoriya ro'yxati (UI tab/filter tartibida). */
export const MOVEMENT_CATEGORY_ORDER: readonly MovementCategory[] = [
  MovementCategory.KIRIM,
  MovementCategory.CHIQIM,
  MovementCategory.KOCHIRISH,
  MovementCategory.INVENTARIZATSIYA,
  MovementCategory.ZARAR,
];
