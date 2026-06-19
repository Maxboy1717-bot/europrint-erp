/**
 * @module wms-roll.constants
 * @description WMS rulon qog'oz (paper roll) hisob-kitob konstantalari.
 *
 * Bu konstantalar faqat WmsRollCalcService uchun mo'ljallangan.
 * Ularni formulada hardcode qilish TAQIQLANGAN — faqat shu fayldan import qilinadi.
 *
 * Har bir konstantaning maqsadi va birligi to'liq hujjatlashtirilgan.
 *
 * OMBOR VIZYON manbalari:
 *   - docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3
 *   - docs/audit/CHAT-TARIXI-YANGI-2026-06-08.md §3 (GOFRA/SLOY FORMULASI)
 *
 * Formula (taxminiy uzunlik):
 *   length_m = weightKg × 1_000_000 / (grammageGsm × widthMm)
 *
 * Izohlash:
 *   kg → g: × 1000
 *   Area (m²) = grams / gsm   [g / (g/m²) = m²]
 *   Length (m) = Area / width_m  [m² / m = m]
 *   width_m = widthMm / 1000
 *   ⇒ length_m = (kg × 1000) / gsm / (widthMm / 1000)
 *              = kg × 1_000_000 / (gsm × widthMm)
 */

/**
 * GSM oralig'i — Qog'oz sanoatida iste'molda bo'lgan gramaj chegaralari.
 * Manba: industry standard (ISO 536), EuroPrint ombor katalogi.
 * Birlik: g/m²
 */
export const ROLL_GRAMMAGE_GSM_MIN = 40;   // eng yengil (qo'llama qog'oz)
export const ROLL_GRAMMAGE_GSM_MAX = 600;  // eng og'ir (karton/fluting)

/**
 * Kenglik oralig'i — Zavodning rolik kesimlari uchun texnik chegaralar.
 * Manba: EuroPrint rulon ombori, gofra/ofset mashinalar spesifikatsiyasi.
 * Birlik: mm
 */
export const ROLL_WIDTH_MM_MIN = 100;   // minimal texnik kesim
export const ROLL_WIDTH_MM_MAX = 2800;  // eng keng rulon (gofra pres)

/**
 * Og'irlik oralig'i — Rulon buyurtma/qabul qilish chegaralari.
 * Manba: EuroPrint transport va saqlash qoidalari.
 * Birlik: kg
 */
export const ROLL_WEIGHT_KG_MIN = 0.001;  // minimal (parchalanma qoldiq)
export const ROLL_WEIGHT_KG_MAX = 5_000;  // maksimal bir rulon og'irligi

/**
 * Uzunlik chiqish natijasi uchun yaxlitlash — metr, 3 xona.
 * Biznes ahamiyati: 1 mm aniqlikdagi uzunlik hisobi yetarli.
 */
export const ROLL_LENGTH_ROUND_DIGITS = 3;

/**
 * Maydon chiqish natijasi uchun yaxlitlash — m², 4 xona.
 */
export const ROLL_AREA_ROUND_DIGITS = 4;

/**
 * Og'irlik chiqish natijasi uchun yaxlitlash — kg, 4 xona.
 */
export const ROLL_WEIGHT_ROUND_DIGITS = 4;

/**
 * Formuladagi unit-konvertatsiya koeffitsientlari.
 *
 * KG_TO_G: kg → gramm (× 1000)
 * MM_TO_M: mm → metr  (÷ 1000, ya'ni × 0.001)
 *
 * Formulada to'g'ridan ishlatiladi:
 *   length_m = (weightKg × KG_TO_G) / grammageGsm / (widthMm × MM_TO_M)
 *            = weightKg × KG_TO_G / (grammageGsm × widthMm × MM_TO_M)
 *            = weightKg × SCALE_FACTOR / (grammageGsm × widthMm)
 */
export const KG_TO_G = 1_000;        // 1 kg = 1000 g
export const MM_TO_M = 0.001;        // 1 mm = 0.001 m

/**
 * Birlashtirilgan miqyos faktori: kg * mm → m birligidagi uzunlikka aylantirish.
 * = KG_TO_G / MM_TO_M = 1000 / 0.001 = 1_000_000
 * Formulada: length_m = weightKg × ROLL_LENGTH_SCALE / (grammageGsm × widthMm)
 */
export const ROLL_LENGTH_SCALE = KG_TO_G / MM_TO_M; // 1_000_000
