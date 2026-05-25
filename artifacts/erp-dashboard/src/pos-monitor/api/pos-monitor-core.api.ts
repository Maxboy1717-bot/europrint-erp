/**
 * @module pos-monitor-core.api
 * @description POS-specific fetch core: token retrieval and posReq helper.
 * Extracted from pos-monitor.api.ts (Rule 16).
 *
 * Uses its own JWT from pos_session (not the ERP access_token).
 * All requests send Authorization: Bearer {pos_token} header.
 */

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
export const BASE = `${_base}/api/pos`;

// ─── POS-specific token ───────────────────────────────────────────────────────

export function getPosSessionToken(): string {
  try {
    const raw = localStorage.getItem("pos_session");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? "";
  } catch {
    return "";
  }
}

// ─── POS-specific fetch ───────────────────────────────────────────────────────

export async function posReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getPosSessionToken();
  const headers: Record<string, string> = {};
  if (token) { headers["Authorization"] = `Bearer ${token}`; }
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json() as { message?: string }; msg = j.message ?? msg; } catch { /* noop */ }
    throw new Error(`POS API ${method} ${path} → ${res.status}: ${msg}`);
  }

  const ct = res.headers.get("content-type");
  if (res.status === 204 || !ct?.includes("application/json")) {
    return null as T;
  }

  const json: unknown = await res.json();

  // Format 1: { isSuccess, value, error }
  if (
    json !== null && typeof json === "object" &&
    "isSuccess" in (json as Record<string, unknown>) &&
    "isFailure" in (json as Record<string, unknown>)
  ) {
    const wrapped = json as { isSuccess: boolean; value: T; error: string };
    if (wrapped.isSuccess) return wrapped.value;
    throw new Error(wrapped.error ?? "Server xatosi");
  }

  // Format 2: { ok: true, data: T } — Result wrapper
  if (
    json !== null && typeof json === "object" &&
    "ok" in (json as Record<string, unknown>) &&
    typeof (json as Record<string, unknown>).ok === "boolean"
  ) {
    const wrapped = json as unknown as { ok: boolean; data?: T; error?: { message?: string } | string };
    if (wrapped.ok) {
      // Recursive unwrap (double-wrap holatlar uchun)
      const inner = wrapped.data;
      if (inner && typeof inner === "object" && "ok" in (inner as Record<string, unknown>)) {
        const innerWrapped = inner as unknown as { ok: boolean; data?: T };
        if (innerWrapped.ok) return innerWrapped.data as T;
      }
      return inner as T;
    }
    const errMsg = typeof wrapped.error === "object" && wrapped.error !== null
      ? wrapped.error.message ?? "Server xatosi"
      : String(wrapped.error ?? "Server xatosi");
    throw new Error(errMsg);
  }

  return json as T;
}
