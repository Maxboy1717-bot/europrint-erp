/**
 * @module queryClient
 * @description Singleton TanStack Query client + a small set of helpers
 *   used across every page. This module is the "data-fetching root" of the
 *   frontend — every `useQuery` / `useMutation` ultimately resolves here.
 *
 *   Exports:
 *     - `queryClient`               — the shared QueryClient instance
 *     - `apiRequest` / `fetchWithAuth` / `getQueryFn` / `HttpError` — re-exports
 *       from `api-request.ts` (so old imports keep working)
 *     - `safeArray<T>(data, key?)`  — coerce any backend shape to T[]
 *     - `selectArray<T>(data)`      — `useQuery({ select })` shorthand
 * @layer Frontend utility (data layer root)
 *
 * WHY THE DEFAULT QUERY OPTIONS
 *   - `queryFn: getQueryFn({ on401: 'returnNull' })`
 *     Pages that need data without a session (public, login redirect) can
 *     receive `null` instead of a thrown auth error. ERP pages override
 *     this on a per-query basis if they want hard-throw behaviour.
 *
 *   - `refetchOnWindowFocus: false`
 *     Default TanStack behaviour refetches when the tab regains focus.
 *     For an ERP that runs on shop-floor terminals (always focused) this
 *     adds noise without value. Pages that NEED live data (MES monitor,
 *     POS sync status) opt in explicitly.
 *
 *   - `refetchInterval: false`
 *     Same reasoning — polling is opt-in (the few real-time dashboards
 *     set their own interval).
 *
 *   - `staleTime: 30s`
 *     After a mutation invalidates a query, the next render must refetch.
 *     30 seconds prevents thrashing for pages that re-mount quickly (router
 *     navigation back-and-forth) while still surfacing recent writes.
 *
 *   - `retry: false`
 *     Failures are user-actionable. Silent retries delay error messages
 *     and confuse "is it loading or broken?" debugging. Components show
 *     `<EPErrorState onRetry={refetch} />` to let the user retry explicitly.
 *
 * WHY `safeArray` LOOKS IN A FIXED LIST OF KEYS
 *   Legacy endpoints return data under different envelope keys:
 *     `{ data: [] }` (most), `{ items: [] }` (LMS), `{ results: [] }` (search),
 *     `{ orders: [] }` (some SD endpoints), `{ list: [] }` (admin), `{ records: [] }`.
 *   The current backend Result wrapper standardises to `{ ok, data }` but
 *   `api-request`'s unwrapper already handles that — `safeArray` is the
 *   safety net for legacy endpoints we haven't migrated yet.
 *
 *   Order matters: we try `data` first because it's the standard, then
 *   fall back to legacy keys. If none match, return `[]` instead of
 *   throwing — `.map()` on `[]` is safe; `.map()` on undefined is not.
 *
 * WHY BACKWARD-COMPAT RE-EXPORTS
 *   Hundreds of files import `apiRequest` from `'@/lib/queryClient'`
 *   (historical location). Moving the implementation to `api-request.ts`
 *   while re-exporting from here keeps every import path working — no
 *   sweeping import rewrites needed.
 */

import { QueryClient } from "@tanstack/react-query";
import { getQueryFn } from './api-request';

// ─── Backward-compat re-exports ──────────────────────────────────────────────
// Existing imports like `import { apiRequest } from '@/lib/queryClient'` keep working.
export { apiRequest, fetchWithAuth, getQueryFn, HttpError } from './api-request';
export {
  AuthError,
  clearAuthToken,
  getAuthHeaders,
  refreshTokenOnce,
  scheduleLoginRedirect,
  setAuthToken,
} from './auth-refresh';

// ─── Array helpers ────────────────────────────────────────────────────────────

/**
 * API javobidan xavfsiz massiv olish.
 * { data: [], orders: [], items: [] } yoki to'g'ridan-to'g'ri [] bo'lsa ham ishlaydi.
 */
export function safeArray<T = unknown>(data: unknown, key?: string): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown>;
  if (key && Array.isArray(obj[key])) return obj[key] as T[];
  for (const k of ["data", "items", "results", "orders", "list", "records"]) {
    if (Array.isArray(obj[k])) return obj[k] as T[];
  }
  return [];
}

/**
 * useQuery({ select }) uchun array coercion.
 * Massiv qaytarishi kerak bo'lgan har qanday endpoint da ishlating:
 *   const { data = [] } = useQuery({ queryKey: [...], select: selectArray<T> });
 * Bu query layer da noto'g'ri shakl (null, object, undefined) ni xavfsiz [] ga aylantiradi.
 */
export function selectArray<T = unknown>(data: unknown, key?: string): T[] {
  return safeArray<T>(data, key);
}

// ─── QueryClient ──────────────────────────────────────────────────────────────

import { QueryCache } from "@tanstack/react-query";

/**
 * Global query error log — every failed query writes here so any error UI
 * (e.g. EPErrorState) can fetch the last error/url/status without each page
 * having to wire it up manually. Keyed by stringified queryKey.
 */
export const queryErrorLog = new Map<string, { error: unknown; url?: string; ts: number }>();

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log to console with rich context — visible in DevTools instantly.
      const url = (error as { url?: string })?.url;
      const status = (error as { status?: number })?.status;
      // eslint-disable-next-line no-console
      console.error(
        `[Query failed]`,
        { status, url, queryKey: query.queryKey, message: (error as Error)?.message },
      );
      queryErrorLog.set(JSON.stringify(query.queryKey), {
        error,
        url: url ?? String(query.queryKey[0] ?? ''),
        ts: Date.now(),
      });
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 soniya — mutatsiyalardan keyin yangi ma'lumot kelsin
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
