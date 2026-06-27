/**
 * @module material-life.constants
 * @description Material hayot-tsikli (W4-MATERIAL-LIFE) uchun ruxsat etilgan
 *   qiymatlar va sukut bo'yicha sozlamalar. Vizyon: EP-WMS-101/123/125/126/128/130/086.
 *
 *   ⚠️ Q-40 (fabrikatsiya taqiq): bu yerdagi qiymatlar STRUKTURA (ruxsat etilgan
 *   enum'lar) — real biznes qiymati (qaysi material qaysi xavf-sinfida) egasi/
 *   operator master-data orqali kiritadi. Hech qanday soxta material-tasnif yo'q.
 * @layer Domain (WMS)
 */

/** Material egalik turi (EP-WMS-123 — bizniki ╳ mijoz-moli/davalcheskiy). */
export const MATERIAL_OWNER_TYPES = ['own', 'customer'] as const;
export type MaterialOwnerType = (typeof MATERIAL_OWNER_TYPES)[number];
export const MATERIAL_OWNER_TYPE_DEFAULT: MaterialOwnerType = 'own';

/**
 * Xavf-sinflari (EP-WMS-128 — bo'yoq/kley/lak/erituvchi maxsus-saqlash zonasi).
 * NULL = xavfsiz/belgilanmagan. Bu ro'yxat validatsiya uchun ochiq (egasi
 * yangi sinf qo'shishi mumkin) — shu sabab DB'da CHECK constraint emas, faqat
 * tavsiya etilgan ro'yxat.
 */
export const MATERIAL_HAZARD_CLASSES = [
  'flammable', // yonuvchan (erituvchi, lak)
  'toxic', // zaharli
  'corrosive', // korroziv
  'oxidizer', // oksidlovchi
  'irritant', // ta'sirlovchi
] as const;
export type MaterialHazardClass = (typeof MATERIAL_HAZARD_CLASSES)[number];

/** Vtorichka/qayta-ishlatilgan sifat darajalari (EP-WMS-125). NULL = birlamchi. */
export const RECYCLED_GRADES = ['A', 'B', 'C', 'recycled'] as const;
export type RecycledGrade = (typeof RECYCLED_GRADES)[number];

/** Substitute (analog) sukut prioriteti — kichik = afzalroq tanlanadi. */
export const SUBSTITUTE_DEFAULT_PRIORITY = 100;
