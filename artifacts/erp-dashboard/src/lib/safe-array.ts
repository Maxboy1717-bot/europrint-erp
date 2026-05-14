/**
 * safe-array.ts — TypeError himoyasi.
 *
 * Backend kutilmagan format yuborsa (object/null/undefined o'rnida array kerak)
 * sahifa crash bo'lmasin uchun universal helper.
 *
 * MISOL:
 *   const { data: schedules = [] } = useQuery(...);
 *   for (const s of schedules) { ... }   // ❌ TypeError agar schedules object bo'lsa
 *
 * YECHIM:
 *   const safeSchedules = toArray(schedules);
 *   for (const s of safeSchedules) { ... }  // ✅ har doim array
 */

/**
 * Har qanday qiymatni xavfsiz array ga aylantiradi.
 * - array bo'lsa qaytaradi
 * - {data: array} bo'lsa data'ni qaytaradi
 * - {items: array} bo'lsa items'ni qaytaradi
 * - {results: array} bo'lsa results'ni qaytaradi
 * - boshqa hammasi bo'lsa [] qaytaradi
 */
export function toArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Recursive unwrap: { ok: true, data: [...] }
    if (obj.ok === true && Array.isArray(obj.data)) return obj.data as T[];
    // { data: [...] }
    if (Array.isArray(obj.data)) return obj.data as T[];
    // { items: [...], total }
    if (Array.isArray(obj.items)) return obj.items as T[];
    // { results: [...] }
    if (Array.isArray(obj.results)) return obj.results as T[];
    // { rows: [...] }
    if (Array.isArray(obj.rows)) return obj.rows as T[];
  }
  return [];
}

/**
 * Object'ni xavfsiz qiladi — null/undefined bo'lsa, default qaytaradi.
 */
export function toObject<T = Record<string, unknown>>(value: unknown, fallback: T = {} as T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'object' || Array.isArray(value)) return fallback;
  // Recursive unwrap: { ok: true, data: {...} }
  const obj = value as Record<string, unknown>;
  if (obj.ok === true && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as T;
  }
  return value as T;
}

/**
 * Number ga xavfsiz aylantirish.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/**
 * String ga xavfsiz aylantirish.
 */
export function toString_(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

/**
 * Array.isArray + length check.
 */
export function hasItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}
