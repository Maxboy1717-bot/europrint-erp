/**
 * @module api-request
 * @description The ONE HTTP client used by every frontend module. Wraps
 *   `fetch` with three concerns the rest of the app shouldn't repeat:
 *
 *     1. Auth header injection + automatic refresh-token rotation on 401
 *     2. Standardised error throwing (HttpError / AuthError)
 *     3. Backend response-envelope unwrapping (Result<T> → T)
 *
 *   Three entry points:
 *     - `apiRequest(method, url, body?)`     general-purpose call
 *     - `fetchWithAuth(url)`                 GET-only helper (legacy callers)
 *     - `getQueryFn({ on401 })`              TanStack Query default queryFn
 *
 *   Rule 21 in `run-all-reviewers.sh` rejects raw `fetch()` / `axios()` so
 *   every outgoing call lands here.
 * @layer Frontend utility (shared by every page / hook / service)
 *
 * WHY AUTH REFRESH IS "ONCE PER REQUEST"
 *   `refreshTokenOnce()` returns the same in-flight promise to every
 *   concurrent caller — so 10 simultaneous 401s trigger ONE refresh, not
 *   10. After the refresh resolves, all 10 callers retry their requests
 *   with the new token. If refresh still returns 401, we redirect to /login
 *   instead of looping forever.
 *
 * WHY THE UNIVERSAL UNWRAPPER
 *   The backend returns four different response envelopes depending on
 *   which generation of code wrote the endpoint:
 *     - `{ ok: true,    data: T }`        (NestJS Result wrapper, current)
 *     - `{ ok: true,    data: { ok: true, data: T } }`  (double-wrapped — bug)
 *     - `{ isSuccess: true, value: T }`   (older C#-style wrapper, legacy)
 *     - `T` directly                       (controllers that bypass safeCall)
 *
 *   Pushing unwrap logic into every component (`data?.data ?? data ?? []`)
 *   was the source of dozens of "why is .map undefined" bugs. Doing it
 *   ONCE here means every page receives the plain payload `T` and can
 *   call `.map / .filter` directly. The depth=5 cap on recursive unwrap
 *   is a guard against pathological infinite-nested responses.
 *
 *   When a backend service is fixed to stop double-wrapping, this code
 *   keeps working — it just never triggers the second-level unwrap.
 *
 * WHY 403 IS A DIFFERENT ERROR FROM 401
 *   401 means "you're not logged in" — we can try refresh + retry.
 *   403 means "you're logged in but lack the permission" — refreshing
 *   won't help. We throw AuthError(403) so the page-level handler can
 *   show a "no access" message instead of redirecting to login (which
 *   would be wrong and confusing — the user IS logged in).
 *
 * WHY `getQueryFn` EXISTS SEPARATE FROM apiRequest
 *   TanStack Query passes a `queryKey` array, not a URL string. The
 *   `buildUrlFromQueryKey` helper builds the URL from queryKey segments
 *   (strings join with `/`, objects become `?key=value` query string).
 *   This is the only place we translate between TanStack Query's data
 *   model and our HTTP layer.
 *
 *   `on401: 'returnNull'` is for queries that legitimately can be
 *   unauthenticated (e.g., public site queries). `'throw'` is the default
 *   for ERP pages.
 */

import { QueryFunction } from "@tanstack/react-query";
import {
  AuthError,
  getAuthHeaders,
  refreshTokenOnce,
  scheduleLoginRedirect,
} from './auth-refresh';

export class HttpError extends Error {
  constructor(public status: number, message: string, public url?: string) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * SECURITY (2026-07-13, info-disclosure fix): never surface the raw response
 * body verbatim. The backend's GlobalExceptionFilter intentionally attaches a
 * `debug` field to 5xx envelopes ({ success, error, code, debug?, timestamp })
 * that may contain internal detail (raw SQL, table/column names, stack info)
 * — but ONLY when NODE_ENV !== 'production', for server-side/devtools-network-tab
 * diagnosis. That field must never be forwarded into an Error whose `.message`
 * ends up rendered on-screen (see EPErrorState.describeError, which truncates
 * and displays `.message` directly to the end user — including on PUBLIC,
 * unauthenticated pages like HRCapitalPublicTest). Extract only the intended
 * user-facing `error`/`message` field; drop everything else (debug, code,
 * stack, raw body) even in development.
 */
function extractSafeErrorMessage(rawText: string, fallback: string): string {
  if (!rawText) return fallback;
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown> | null;
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.error === "string") return parsed.error;
      if (typeof parsed.message === "string") return parsed.message;
    }
  } catch {
    // Not JSON (e.g. an HTML error page or plain text) — never echo raw body.
  }
  return fallback;
}

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    const text = await res.text();
    const safeMessage = extractSafeErrorMessage(text, res.statusText || `HTTP ${res.status}`);
    throw new HttpError(res.status, `${res.status}: ${safeMessage}`, url);
  }
}

export async function fetchWithAuth(url: string): Promise<unknown> {
  let res = await fetch(url, { credentials: "include", headers: { ...getAuthHeaders() } });
  if (res.status === 401) {
    const refreshed = await refreshTokenOnce();
    if (refreshed) {
      res = await fetch(url, { credentials: "include", headers: { ...getAuthHeaders() } });
    }
  }
  if (res.status === 401) {
    scheduleLoginRedirect();
    throw new AuthError(res.status, "Autentifikatsiya kerak");
  }
  if (res.status === 403) {
    throw new AuthError(res.status, 'Ruxsat yo\'q: 403 Forbidden');
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new HttpError(res.status, `HTTP xatosi ${res.status}: ${text}`);
  }
  return await res.json();
}

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const isFormData = data instanceof FormData;
  const buildHeaders = (): Record<string, string> => ({
    ...getAuthHeaders(),
    ...(!isFormData && data ? { "Content-Type": "application/json" } : {}),
  });
  const buildBody = () =>
    isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined;

  let res = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: buildBody(),
    credentials: "include",
  });

  // 401 → bir martalik refresh urinib ko'r va so'rovni qaytar
  if (res.status === 401) {
    const refreshed = await refreshTokenOnce();
    if (refreshed) {
      res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: buildBody(),
        credentials: "include",
      });
    }
    if (res.status === 401) {
      scheduleLoginRedirect();
      throw new AuthError(401, "Autentifikatsiya kerak");
    }
  }

  await throwIfResNotOk(res, url);

  const contentType = res.headers.get("content-type");
  if (res.status === 204 || !contentType?.includes("application/json")) {
    return undefined as unknown as T;
  }
  const json = await res.json();

  // ─── UNIVERSAL UNWRAPPER ───────────────────────────────────────────────
  // Backend turli format'larda javob qaytarishi mumkin. Bularni avtomatik
  // unwrap qilib, frontend componentlariga toza data beramiz.
  // Shunda har joyda `Array.isArray(data) ? data : []` yozish shart bo'lmaydi.

  // Format 1: { isSuccess, value, error } — Eski Result wrapper
  if (
    json !== null &&
    typeof json === 'object' &&
    'isSuccess' in json &&
    'isFailure' in json
  ) {
    if ((json as Record<string, unknown>).isSuccess) {
      return (json as Record<string, unknown>).value as T;
    }
    throw new HttpError(500, String((json as Record<string, unknown>).error ?? 'Server xatosi'));
  }

  // Format 2: { ok: true, data: T } — NestJS Result wrapper
  // Bu eng keng tarqalgan format — service'da `safeCall` ortiqcha ishlatilgan double-wrap.
  if (
    json !== null &&
    typeof json === 'object' &&
    'ok' in json &&
    typeof (json as Record<string, unknown>).ok === 'boolean'
  ) {
    const wrapped = json as { ok: boolean; data?: unknown; error?: unknown };
    if (wrapped.ok === true) {
      // Recursive unwrap — agar ichida yana Result bo'lsa
      const inner = wrapped.data;
      if (
        inner !== null &&
        typeof inner === 'object' &&
        'ok' in inner &&
        typeof (inner as Record<string, unknown>).ok === 'boolean'
      ) {
        const innerWrapped = inner as { ok: boolean; data?: unknown };
        if (innerWrapped.ok === true) return innerWrapped.data as T;
      }
      return inner as T;
    }
    const errMsg = typeof wrapped.error === 'object' && wrapped.error !== null
      ? String((wrapped.error as Record<string, unknown>).message ?? 'Server xatosi')
      : String(wrapped.error ?? 'Server xatosi');
    throw new HttpError(500, errMsg);
  }

  // Format 3: { success: false, error: ... } — Boshqa xato format
  if (
    json !== null &&
    typeof json === 'object' &&
    'success' in json &&
    (json as Record<string, unknown>).success === false
  ) {
    throw new HttpError(500, String((json as Record<string, unknown>).error ?? 'Server xatosi'));
  }

  // Format 4: Plain data (array yoki object) — to'g'ri
  return json as T;
}

function buildUrlFromQueryKey(queryKey: readonly unknown[]): string {
  let baseUrl = "";
  const params: Record<string, string> = {};

  for (const segment of queryKey) {
    if (typeof segment === "string") {
      if (!baseUrl) {
        baseUrl = segment;
      } else {
        baseUrl = `${baseUrl}/${segment}`;
      }
    } else if (typeof segment === "number") {
      // Numeric IDs (serial/integer PKs) must be included in the URL path
      baseUrl = `${baseUrl}/${segment}`;
    } else if (segment !== null && segment !== undefined && typeof segment === "object") {
      for (const [k, v] of Object.entries(segment as Record<string, unknown>)) {
        if (v !== undefined && v !== null && v !== "") {
          params[k] = String(v);
        }
      }
    }
  }

  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    const url = buildUrlFromQueryKey(queryKey);
    let res = await fetch(url, {
      credentials: "include",
      headers: { ...getAuthHeaders() },
    });

    if (res.status === 401) {
      const refreshed = await refreshTokenOnce();
      if (refreshed) {
        res = await fetch(url, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
      }
    }

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        scheduleLoginRedirect();
        return null as unknown as T;
      }
      scheduleLoginRedirect();
      throw new AuthError(401, "Autentifikatsiya kerak");
    }
    if (res.status === 403) {
      throw new AuthError(403, "Ruxsat yo'q");
    }

    await throwIfResNotOk(res, url);
    const json = await res.json();
    if (json === null) return null as unknown as T;

    // Recursive unwrap: backend service'larida `safeCall` double-wrap qilgan bo'lsa
    // {ok: true, data: {ok: true, data: [...]}} → [...]
    let unwrapped: unknown = json;
    let depth = 0;
    while (
      depth < 5 &&
      unwrapped !== null &&
      typeof unwrapped === 'object' &&
      !Array.isArray(unwrapped) &&
      'ok' in unwrapped &&
      (unwrapped as Record<string, unknown>).ok === true &&
      'data' in unwrapped
    ) {
      unwrapped = (unwrapped as Record<string, unknown>).data;
      depth++;
    }

    // Agar ok: false bo'lsa — xato
    if (
      unwrapped !== null &&
      typeof unwrapped === 'object' &&
      !Array.isArray(unwrapped) &&
      'ok' in unwrapped &&
      (unwrapped as Record<string, unknown>).ok === false
    ) {
      const err = (unwrapped as Record<string, unknown>).error;
      const msg = typeof err === 'object' && err !== null
        ? String((err as Record<string, unknown>).message ?? 'Server xatosi')
        : String(err ?? 'Server xatosi');
      throw new HttpError(500, msg);
    }

    return unwrapped as T;
  };
}
