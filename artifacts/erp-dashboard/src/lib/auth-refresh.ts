/**
 * @module auth-refresh
 * @description Auth token storage + refresh-token rotation for the frontend.
 *   Sits below `api-request.ts` — when any HTTP call receives a 401, it
 *   calls `refreshTokenOnce()` to attempt a single (deduplicated) refresh,
 *   then retries the original request.
 *
 *   Tokens live in `safeStorage` (a Safari-Private-Mode-safe localStorage
 *   wrapper). Two tokens are stored:
 *     - `access_token`   short-lived bearer (15 min default)
 *     - `refresh_token`  longer-lived rotation token (7-30 days)
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
 * WHY THE REFRESH ENDPOINT TRUSTS THE Authorization HEADER (not the body)
 *   We send the refresh token as `Authorization: Bearer <refresh>` rather
 *   than in the request body. Reasons:
 *     1. Symmetric with normal requests — auth proxies / WAFs strip body
 *        but pass the Authorization header through.
 *     2. The backend validates with the same JWT verifier (different
 *        secret) — code reuse, no body parsing.
 *
 *   Note: this is intentionally NOT cookie-based refresh — the frontend
 *   may run in iframes / extensions where cookies aren't reliable.
 *
 * WHY ALL FAILURES SILENTLY RETURN `false` (not throw)
 *   `refreshTokenOnce` is called from inside `apiRequest`'s error path.
 *   A throw here would mask the original 401 and prevent the caller from
 *   handling it gracefully. Returning `false` lets the caller decide:
 *   "no refresh available → redirect to login".
 */

import { safeStorage } from '@/lib/safeStorage';

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = safeStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setAuthToken(accessToken?: string, refreshToken?: string) {
  if (accessToken) safeStorage.setItem("access_token", accessToken);
  if (refreshToken) safeStorage.setItem("refresh_token", refreshToken);
}

export function clearAuthToken() {
  safeStorage.removeItem("access_token");
  safeStorage.removeItem("refresh_token");
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
  const refreshToken = safeStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      setAuthToken(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
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
