/**
 * Xavfsiz array utilita funksiyalari
 *
 * Qoida 2 — Array Xavfsizligi:
 * API har doim to'g'ri ma'lumot qaytarmaydi. Himoyasiz array operatsiya = runtime crash.
 */

/**
 * Noma'lum qiymatdan xavfsiz massiv oladi.
 * Massiv bo'lmasa bo'sh massiv qaytaradi.
 */
export function safeArray<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : [];
}

/**
 * Massivni xavfsiz map() qiladi.
 */
export function safeMap<T, R>(arr: unknown, fn: (item: T, index: number) => R): R[] {
  return Array.isArray(arr) ? (arr as T[]).map(fn) : [];
}

/**
 * Massivni xavfsiz filter() qiladi.
 */
export function safeFilter<T>(arr: unknown, predicate: (item: T) => boolean): T[] {
  return Array.isArray(arr) ? (arr as T[]).filter(predicate) : [];
}

/**
 * Result<T[]> dan xavfsiz massiv oladi.
 */
export function safeResultArray<T>(
  result: { ok: boolean; data?: T[] | unknown } | null | undefined
): T[] {
  if (!result || !result.ok) return [];
  return Array.isArray(result.data) ? (result.data as T[]) : [];
}
