/**
 * FK migration switch — Bo'lim D yondashuvi.
 *
 * Migration 0008 dan keyin har FK uchun ikki ustun:
 *   - eski: `customer_id` (varchar) — eski kod read/write qiladi
 *   - yangi: `customer_id_int` (integer) — backfill bilan to'ldirilgan
 *
 * Repository qatlami `useIntFkColumn()` orqali tekshiradi:
 *   - Agar FK_USE_INT_COLUMNS=true → yangi `_int` ustundan o'qiladi
 *   - Agar false → eski varchar ustunidan + `::int` cast
 *
 * Migration 0009 (alohida) eski ustunni DROP qilganda bu helper o'chiriladi.
 */
const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

let cachedDecision: boolean | null = null;

 
export function useIntFkColumns(): boolean {
  if (cachedDecision !== null) return cachedDecision;
  const raw = (process.env.FK_USE_INT_COLUMNS ?? 'false').toLowerCase();
  cachedDecision = TRUE_VALUES.has(raw);
  return cachedDecision;
}

/**
 * Test'lar uchun cache reset.
 */
export function _resetFkSwitchCache(): void {
  cachedDecision = null;
}

/**
 * FK ustun nomini qaytaradi (eski yoki yangi).
 *
 * @example
 *   const col = fkColumnName('customer_id');
 *   // FK_USE_INT_COLUMNS=true → 'customer_id_int'
 *   // FK_USE_INT_COLUMNS=false → 'customer_id'
 */
export function fkColumnName(legacyName: string): string {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useIntFkColumns() ? `${legacyName}_int` : legacyName;
}
