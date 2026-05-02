/**
 * @workspace/math-utils
 * EuroPrint ERP — Xavfsiz matematik operatsiyalar
 *
 * Muammo: parseFloat(String(x)) NaN, Infinity, float drift qaytarishi mumkin.
 * Yechim: barcha sonli konversiya bu funksiyalar orqali o'tadi.
 */

/**
 * Xavfsiz son konversiyasi.
 * NaN, Infinity, null, undefined → fallback (default 0).
 *
 * @example safeNum("3.14") // 3.14
 * @example safeNum(null)   // 0
 * @example safeNum("abc")  // 0
 */
export function safeNum(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  if (!isFinite(n) || isNaN(n)) return fallback;
  return n;
}

/**
 * Xavfsiz bo'lish. Nolga bo'lish → fallback (default 0).
 *
 * @example safeDiv(10, 0)    // 0
 * @example safeDiv(10, 2)    // 5
 * @example safeDiv(10, 0, 1) // 1
 */
export function safeDiv(a: unknown, b: unknown, fallback = 0): number {
  const bn = safeNum(b);
  if (bn === 0) return fallback;
  return safeNum(a) / bn;
}

/**
 * Massiv elementlari yig'indisi. Bo'sh massiv → 0. NaN elementlar o'tkaziladi.
 *
 * @example safeSum([1, 2, null, "3"]) // 6
 */
export function safeSum(arr: unknown[]): number {
  return arr.reduce<number>((acc, v) => acc + safeNum(v), 0);
}

/**
 * Massiv o'rtacha qiymati. Bo'sh massiv → 0.
 *
 * @example safeAvg([10, 20, 30]) // 20
 * @example safeAvg([])           // 0
 */
export function safeAvg(arr: unknown[]): number {
  if (!arr.length) return 0;
  return safeSum(arr) / arr.length;
}

/**
 * Qiymatni [min, max] oralig'iga cheklash.
 *
 * @example clamp(150, 1, 100) // 100
 * @example clamp(-5, 0, 10)   // 0
 */
export function clamp(val: number, min: number, max: number): number {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

/**
 * Foiz hisoblash. Nolga bo'lish xavfsiz.
 *
 * @example safePercent(25, 100) // 25
 * @example safePercent(0, 0)    // 0
 */
export function safePercent(part: unknown, total: unknown): number {
  return safeDiv(safeNum(part) * 100, total);
}

/**
 * Belgilangan kasrga yaxlitlash.
 *
 * @example roundTo(3.14159, 2) // 3.14
 */
export function roundTo(val: unknown, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(safeNum(val) * factor) / factor;
}

/**
 * Ikki sonning absolyut farqi.
 *
 * @example absDiff(100, 87) // 13
 */
export function absDiff(a: unknown, b: unknown): number {
  return Math.abs(safeNum(a) - safeNum(b));
}
