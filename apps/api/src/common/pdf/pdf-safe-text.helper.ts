/**
 * @module pdf-safe-text.helper
 * @description pdf-lib `StandardFonts.Helvetica`/`HelveticaBold` faqat WinAnsi (Windows-1252)
 *   kodlashni qo'llab-quvvatlaydi — kirill harflari (U+0400..U+04FF) unda YO'Q. Kirill matn
 *   `page.drawText()` ga to'g'ridan berilsa, pdf-lib `WinAnsi cannot encode "..."` xatosi
 *   bilan qulaydi va butun PDF generatsiya (safeCall ichida) jimgina 0-baytli natija
 *   qaytaradi (Q-40: "ishlaydi (200) lekin noto'g'ri" holatining aniq misoli).
 *
 *   Bu FAZA D (Hujjat/PDF akt, 2026-07-01) davomida topilgan tizimli bag (barcha
 *   pos-pdf.service.ts akt/harakat PDF'lari, `АКТ ДВИЖЕНИЯ` va shu kabi ru-yorliqlar
 *   bilan) — Q-46 "to'g'ri ishlamaydigan kod to'liq tuzatiladi" asosida shu yerda
 *   markazlashgan tarzda hal qilinadi: yangi npm bog'liqlik (fontkit+Unicode-font)
 *   qo'shmasdan, kirill matnni WinAnsi-xavfsiz lotin transliteratsiyasiga o'giradi.
 *
 * @layer Common (PDF)
 */

const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** WinAnsi (CP1252) da yo'q, lekin loyihada uchraydigan boshqa belgilar. */
const OTHER_SYMBOL_MAP: Readonly<Record<string, string>> = {
  '№': 'No',
};

/**
 * Kirill harflarni (bo'lsa) WinAnsi-xavfsiz lotin transliteratsiyasiga o'giradi;
 * boshqa barcha belgilar (lotin/uz-maxsus/raqam/tinish belgilar) o'zgarishsiz qoladi.
 * Static yorliqlar ("АКТ ПРИХОДА") va dinamik DB-qiymatlar (mijoz/material nomi
 * kirill bilan kiritilgan bo'lsa) — ikkalasi uchun ham xavfsiz (Q-40: real ma'lumot,
 * fake emas — faqat pdf-lib rendering uchun skript o'giriladi).
 *
 * Himoya-qatlam: kirill + bilinган maxsus belgilardan (№) keyin ham qolgan
 * har qanday WinAnsi'dan tashqari belgi (U+00FF dan yuqori kod nuqtasi) `?`
 * bilan almashtiriladi — kelajakda boshqa noma'lum belgi PDF generatsiyani
 * qulatmasligi uchun (belt-and-suspenders, Q-40).
 */
export function toPdfSafeText(text: string): string {
  let out = text.replace(/[Ѐ-ӿ]/g, (ch) => {
    const lower = ch.toLowerCase();
    const mapped = CYRILLIC_TO_LATIN[lower];
    if (mapped === undefined) return '';
    return ch === lower ? mapped : mapped.toUpperCase();
  });
  for (const [symbol, replacement] of Object.entries(OTHER_SYMBOL_MAP)) {
    out = out.split(symbol).join(replacement);
  }
  return Array.from(out)
    .map((ch) => (ch.codePointAt(0)! > 0xff ? '?' : ch))
    .join('');
}
