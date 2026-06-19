/**
 * @module wms-rulon-card.constants
 * @description RULON QOG'OZ KARTA holat va biznes konstantalari.
 *
 * Magic number/string TAQIQ (Qoida 12) — holat nomlari va o'tish qoidalari
 * faqat shu fayldan import qilinadi.
 *
 * VIZYON: docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3 —
 *   Roll status: To'liq / Ochilgan / Qoldiq (FIFO: ochilgan rulonlar birinchi).
 */

/** Rulon holatlari (DB enum bilan mos: full / opened / remnant). */
export const RULON_STATUS_FULL = 'full'; // To'liq (ochilmagan)
export const RULON_STATUS_OPENED = 'opened'; // Ochilgan (qisman ishlatilgan)
export const RULON_STATUS_REMNANT = 'remnant'; // Qoldiq (deyarli tugagan)

/**
 * Holat o'tish grafigi — kalitdan qiymatdagi holatlarga o'tish RUXSAT etilgan.
 *   full    → opened, remnant
 *   opened  → remnant
 *   remnant → (yakuniy — bo'sh)
 */
export const RULON_ALLOWED_STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [RULON_STATUS_FULL]: [RULON_STATUS_OPENED, RULON_STATUS_REMNANT],
  [RULON_STATUS_OPENED]: [RULON_STATUS_REMNANT],
  [RULON_STATUS_REMNANT]: [],
};

/**
 * DB ustun precision: estimated_length_m / current_weight_kg numeric scale.
 * Uzunlik 3 xona (mm aniqlik) — wms-roll.constants.ts ROLL_LENGTH_ROUND_DIGITS bilan mos.
 */
export const RULON_LENGTH_DB_SCALE = 3;
