/**
 * math-utils — TZ-D03: Xavfsiz matematik utility funksiyalar
 *
 * Maqsad: parseFloat(String(x)), a/b, (Array.isArray(arr) ? arr : []).reduce(fn) kabi xavfli
 * pattern'larni almashtirish. Barcha funksiyalar NaN / Infinity'ni
 * fallback bilan boshqaradi.
 *
 * Qoidalar:
 *   ✗ TAQIQLANGAN: parseFloat(String(x)), a / b (himoyasiz)
 *   ✓ MAJBURIY   : safeNum(x), safeDiv(a, b)
 */

/**
 * safeNum — Istalgan qiymatni xavfsiz raqamga aylantiradi.
 *
 * @param v   - konvertatsiya qilinadigan qiymat
 * @param fb  - fallback (default: 0) — agar v raqamga aylanmasa
 * @returns number
 *
 * @example
 *   safeNum('3.14')   // 3.14
 *   safeNum('abc')    // 0
 *   safeNum(NaN)      // 0
 *   safeNum(Infinity) // 0
 *   safeNum(null)     // 0
 */
export const safeNum = (v: unknown, fb = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fb;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : fb;
};

/**
 * safeDiv — Xavfsiz bo'linma operatsiyasi.
 *
 * b = 0 ∨ ¬finite(a) ∨ ¬finite(b) → fallback
 *
 * @example
 *   safeDiv(10, 2)      // 5
 *   safeDiv(10, 0)      // 0  (ZeroDivisionError yo'q)
 *   safeDiv(NaN, 2)     // 0
 */
export const safeDiv = (a: number, b: number, fb = 0): number =>
  b === 0 || !Number.isFinite(a) || !Number.isFinite(b) ? fb : a / b;

/**
 * safeSum — Massiv elementlarini xavfsiz yig'adi.
 *
 * (Array.isArray(arr) ? arr : []).reduce(fn) — initial value MAJBURIY (bu funksiya uni ta'minlaydi).
 */
export const safeSum = (arr: readonly unknown[]): number =>
  arr.reduce<number>((s, x) => s + safeNum(x), 0);

/**
 * safeAvg — Massiv o'rtacha qiymati (bo'sh massiv → 0).
 */
export const safeAvg = (arr: readonly unknown[]): number =>
  arr.length === 0 ? 0 : safeDiv(safeSum(arr), arr.length);

/**
 * clamp — Qiymatni [lo, hi] oralig'iga cheklaydi.
 *
 * @example clamp(150, 0, 100) // 100
 */
export const clamp = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, x));

/**
 * stddev — Standart og'ish (n < 2 → 0).
 */
export const stddev = (arr: readonly number[]): number => {
  if (arr.length < 2) return 0;
  const mu = safeAvg(arr);
  const variance = safeAvg((Array.isArray(arr) ? arr : []).map((x) => (x - mu) ** 2));
  return Math.sqrt(variance);
};

/**
 * pct — Foiz hisoblash (b = 0 → 0).
 *
 * @example pct(25, 200) // 12.5
 */
export const pct = (part: number, total: number): number =>
  safeDiv(part * 100, total);

/**
 * roundTo — N xonaga yaxlitlash.
 *
 * @example roundTo(3.14159, 2) // 3.14
 */
export const roundTo = (x: number, digits = 2): number => {
  const factor = 10 ** digits;
  return safeDiv(Math.round(x * factor), factor);
};
