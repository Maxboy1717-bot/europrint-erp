/**
 * @module tabletFetch
 * @description Shared authenticated-fetch client for the IoT tablet PWA. The tablet uses a
 * bearer-style `x-tablet-token` header (NOT the ERP's httpOnly cookie session — see
 * tablet-token.guard.ts), so it cannot reuse `api-request.ts`/`auth-refresh.ts` as-is. This module
 * mirrors that same 401 → refresh-once (deduplicated) → retry pattern for the header-based scheme.
 *
 * C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): before this module existed, every tablet page/hook
 * had its own copy-pasted raw `fetch` with an `x-tablet-token` header and NO 401 handling at all.
 * Combined with the BE token's (former) 8h TTL vs. the PWA's own 12h session-expiry assumption
 * (SESSION_12H_MS, useIoTTabletTypes.ts), a worker between hour 8 and hour 12 of a shift got
 * silent write failures (scans, session updates, even the SOS button) while the UI still showed
 * them as logged in. This client closes that gap: any 401 triggers one deduplicated refresh
 * against `POST /iot/tablet/refresh`, and the original request is retried once with the new token.
 * If refresh itself fails (token too old / worker deactivated / card revoked), the original 401
 * response is returned unchanged so existing "session expired" handling in each caller still fires.
 */

import { safeStorage } from "@/lib/safeStorage";

const TOKEN_KEY = "iot_tablet_token";

function readToken(tokenOverride?: string): string {
  return tokenOverride || safeStorage.getItem(TOKEN_KEY) || "";
}

function rawFetch(token: string, method: string, path: string, body?: unknown): Promise<Response> {
  // eslint-disable-next-line no-restricted-globals -- raw fetch: IoT tablet uses x-tablet-token auth, not the ERP session cookie
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json", "x-tablet-token": token },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshTabletToken(oldToken: string): Promise<string | null> {
  try {
    const res = await rawFetch(oldToken, "POST", "/api/iot/tablet/refresh");
    if (!res.ok) return null;
    const data = await res.json().catch(() => null) as { tabletToken?: string } | null;
    const newToken = data?.tabletToken;
    if (!newToken) return null;
    safeStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return null;
  }
}

/**
 * Deduplicated refresh — if several tablet requests 401 around the same moment (e.g. a burst of
 * queued offline actions flushing at once), only one refresh call is made; every caller awaits the
 * same in-flight promise. Mirrors `auth-refresh.ts`'s `refreshTokenOnce()`.
 */
function refreshTabletTokenOnce(oldToken: string): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = tryRefreshTabletToken(oldToken).finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * Authenticated fetch for tablet endpoints. Drop-in replacement for every hand-rolled
 * `fetch(path, { headers: { 'x-tablet-token': token } })` call site in the IoT tablet PWA.
 *
 * @param tokenOverride optional token to use instead of the stored one (kept for call sites that
 *   already hold a fresher token in React state than what's in storage at call time).
 */
export async function tabletFetch(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
  tokenOverride?: string,
): Promise<Response> {
  const token = readToken(tokenOverride);
  if (!token) {
    // No token at all (never logged in / already cleared) — nothing to refresh. Let the caller's
    // existing "session expired" handling deal with a 401-shaped response.
    return new Response(JSON.stringify({ error: "Tablet sessiyasi yo'q" }), { status: 401 });
  }

  let res = await rawFetch(token, method, path, body);
  if (res.status === 401) {
    const newToken = await refreshTabletTokenOnce(token);
    if (newToken) {
      res = await rawFetch(newToken, method, path, body);
    }
  }
  return res;
}
