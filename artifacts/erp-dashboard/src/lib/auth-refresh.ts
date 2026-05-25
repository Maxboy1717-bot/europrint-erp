/**
 * @module auth-refresh
 * @description Auth token refresh helper for the frontend.
 *   Sits below `api-request.ts` — when any HTTP call receives a 401, it
 *   calls `refreshTokenOnce()` to attempt a single (deduplicated) refresh,
 *   then retries the original request.
 *
 *   AUTH MODEL (post-cookie migration):
 *     Tokens live in httpOnly cookies set by the backend on /auth/login
 *     and /auth/refresh:
 *       - `access_token`  short-lived bearer (24h)
 *       - `refresh_token` longer-lived rotation token (7d, path=/api/auth)
 *
 *     JavaScript CANNOT read these cookies (that's the point — XSS-safe).
 *     The cookies are sent automatically on every `fetch` that uses
 *     `credentials: 'include'`. This module no longer touches localStorage.
 *
 *     Backward-compat exports (`getAuthHeaders`, `setAuthToken`,
 *     `clearAuthToken`) remain so existing call sites compile; they are now
 *     mostly no-ops and the source of truth is the cookie.
 * @layer Frontend utility (auth plumbing)
 *
 * WHY `refreshTokenOnce` USES PROMISE DEDUPLICATION
 *   When many concurrent requests hit a 401 simultaneously (typical when
 *   loading a dashboard with 10 parallel queries), each would trigger its
 *   own refresh call. Without deduplication:
 *     1. Each refresh attempt rotates the refresh token (single-use)
 *     2. After the first one succeeds, the others fail (token reused)
 *     3. The session is killed even though tokens were valid
 *
 *   The shared `refreshPromise` + `isRefreshing` flag ensures only ONE
 *   refresh is in flight at any time; concurrent callers await the same
 *   promise. The `.finally()` resets both flags so the NEXT 401 (some
 *   minutes later) can refresh again.
 *
 * WHY `scheduleLoginRedirect` USES A 300ms DEBOUNCE
 *   When auth dies, multiple components may detect it simultaneously and
 *   each call `scheduleLoginRedirect`. Without the `redirectScheduled`
 *   guard + 300ms timer, we'd kick off the redirect 10x. The debounce also
 *   gives any in-flight UI cleanup (close modals, persist drafts) a moment
 *   to run before navigation.
 *
 * WHY ALL FAILURES SILENTLY RETURN `false` (not throw)
 *   `refreshTokenOnce` is called from inside `apiRequest`'s error path.
 *   A throw here would mask the original 401 and prevent the caller from
 *   handling it gracefully. Returning `false` lets the caller decide:
 *   "no refresh available → redirect to login".
 */

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Auth is now cookie-based; the browser attaches the httpOnly access_token
 * cookie automatically on every `fetch` call with `credentials: 'include'`.
 * This helper returns an empty header set so existing call sites compile
 * unchanged (the spread `{ ...getAuthHeaders() }` becomes a no-op).
 *
 * NOTE: kept as `Record<string, string>` so call sites that spread it into
 * other header objects still type-check.
 */
export function getAuthHeaders(): Record<string, string> {
  return {};
}

/**
 * Cookie-based auth: tokens are set by the backend Set-Cookie header on
 * /auth/login and /auth/refresh. Frontend cannot write httpOnly cookies,
 * so this function is now a no-op. Retained for backward compatibility
 * with any caller that imports it.
 */
export function setAuthToken(_accessToken?: string, _refreshToken?: string) {
  // No-op — httpOnly cookies are set by the server.
}

/**
 * Best-effort client-side token clearing. The actual httpOnly cookies are
 * cleared by the server on /auth/logout. This function only flushes any
 * legacy localStorage tokens that may still be present from before the
 * migration so they don't get mistakenly used.
 */
export function clearAuthToken() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
    }
  } catch {
    // localStorage may be unavailable (Safari Private Mode etc.) — ignore.
  }
}

let redirectScheduled = false;
export function scheduleLoginRedirect() {
  if (redirectScheduled) return;
  redirectScheduled = true;
  setTimeout(() => {
    redirectScheduled = false;
    clearAuthToken();
    window.location.href = `${import.meta.env.BASE_URL}login`;
  }, 300);
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  try {
    // No body / no Authorization header needed — the browser sends the
    // refresh_token cookie automatically thanks to credentials: 'include'.
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    // We don't need to extract the access token — the server set a fresh
    // access_token cookie in the response, and the browser will use it on
    // the next request. We just confirm the refresh succeeded.
    await res.json().catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export async function refreshTokenOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}
