/**
 * @module api-unwrap
 * @description P2.1 — Universal API response unwrapper.
 * BE responses arrive in various shapes: { items: [] }, { data: [] },
 * { rows: [] }, or bare arrays. This module normalises them all.
 */

/**
 * Extract an array from whatever shape the BE returned.
 * Checks items → data → rows → bare-array in that order.
 */
export function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    if (Array.isArray(r['items'])) return r['items'] as T[];
    if (Array.isArray(r['data']))  return r['data']  as T[];
    if (Array.isArray(r['rows']))  return r['rows']  as T[];
    if (Array.isArray(r['list']))  return r['list']  as T[];
  }
  return [];
}

/**
 * Extract the total count from a paginated response envelope.
 */
export function unwrapTotal(response: unknown): number {
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    if (typeof r['total'] === 'number') return r['total'];
    if (typeof r['count'] === 'number') return r['count'];
    if (typeof r['totalCount'] === 'number') return r['totalCount'];
    if (typeof r['total'] === 'string') return parseInt(r['total'] as string, 10) || 0;
  }
  return 0;
}

/**
 * Extract a single data object from a { data: {...} } envelope, or return the value directly.
 */
export function unwrapOne<T>(response: unknown): T | null {
  if (!response) return null;
  if (typeof response === 'object' && !Array.isArray(response)) {
    const r = response as Record<string, unknown>;
    if (r['data'] !== undefined && !Array.isArray(r['data'])) return r['data'] as T;
  }
  return response as T;
}
