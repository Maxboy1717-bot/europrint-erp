/**
 * POS Monitor API Layer
 * Uses its own JWT from pos_session (not the ERP access_token).
 * All requests send Authorization: Bearer {pos_token} header.
 */

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const BASE = `${_base}/api/pos`;

// ─── POS-specific fetch (uses pos_session token, not ERP access_token) ───────

function getPosSessionToken(): string {
  try {
    const raw = localStorage.getItem("pos_session");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? "";
  } catch {
    return "";
  }
}

async function posReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
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
  if (
    json !== null && typeof json === "object" &&
    "isSuccess" in (json as Record<string, unknown>) &&
    "isFailure" in (json as Record<string, unknown>)
  ) {
    const wrapped = json as { isSuccess: boolean; value: T; error: string };
    if (wrapped.isSuccess) return wrapped.value;
    throw new Error(wrapped.error ?? "Server xatosi");
  }
  return json as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  validate: () => posReq<{ valid: boolean; userId: number; role: string; username: string }>("POST", "/auth/validate"),
};

// ─── Stock ─────────────────────────────────────────────────────────────────

export const stockApi = {
  getAll:          ()                               => posReq("GET",  "/stock"),
  getBalance:      (wh: string, matId: number)      => posReq("GET",  `/stock/${wh}/${matId}`),
  adjust:          (b: Record<string, unknown>)     => posReq("POST", "/stock/adjust", b),
  getLowAlerts:    ()                               => posReq("GET",  "/stock/low-alerts"),
  getExpiryAlerts: (days?: number)                  => posReq("GET",  `/stock/expiry-alerts${days ? `?days=${days}` : ""}`),
};

// ─── GL ────────────────────────────────────────────────────────────────────

export const glApi = {
  getByMovement:      (id: number)  => posReq("GET",  `/gl/movement/${id}`),
  approveByMovement:  (id: number)  => posReq("POST", `/gl/approve/${id}`),
  approve:            (id: number)  => posReq("POST", `/gl/entry/${id}/approve`),
  reject:             (id: number)  => posReq("POST", `/gl/entry/${id}/reject`),
  getPending:         ()            => posReq("GET",  "/gl/pending"),
  getJournal:         ()            => posReq("GET",  "/gl/journal"),
};

// ─── Sync ──────────────────────────────────────────────────────────────────

export const syncApi = {
  push:      (b: Record<string, unknown>) => posReq("POST", "/sync/push", b),
  pull:      (b: Record<string, unknown>) => posReq("POST", "/sync/pull", b),
  getStatus: ()                           => posReq("GET",  "/sync/status"),
};

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll:      ()           => posReq("GET",  "/notifications"),
  markRead:    (id: number) => posReq("POST", `/notifications/${id}/read`),
  markAllRead: ()           => posReq("POST", "/notifications/read-all"),
};

// ─── Movements ─────────────────────────────────────────────────────────────

export const movementsApi = {
  getAll:       (params?: Record<string, string>) =>
    posReq("GET", `/movements${params ? `?${new URLSearchParams(params).toString()}` : ""}`),
  getOne:       (id: number)                      => posReq("GET",  `/movements/${id}`),
  create:       (b: Record<string, unknown>)      => posReq("POST", "/movements", b),
  updateStatus: (id: number, status: string, reason?: string) =>
    posReq("PATCH", `/movements/${id}/status`, { status, reason }),
  qcDecision:  (b: Record<string, unknown>)  => posReq("POST", "/movements/qc-decision", b),
  damage:      (b: Record<string, unknown>)  => posReq("POST", "/movements/damage", b),
  getPdf:      (id: number)                  => `${BASE}/movements/${id}/pdf`,
  getHistory:       (id: number)             => posReq("GET", `/movements/${id}/history`),
  getConfirmations: (id: number)             => posReq("GET", `/movements/${id}/confirmations`),
};

// ─── Barcode ───────────────────────────────────────────────────────────────

export const barcodeApi = {
  scan:       (b: { barcode: string; warehouseId?: string }) =>
    posReq("POST", "/barcode/scan", b),
  printLabel: (b: Record<string, unknown>) =>
    posReq("POST", "/barcode/print", b),
  lookup:     (barcode: string) =>
    posReq("GET", `/barcode/lookup?barcode=${encodeURIComponent(barcode)}`),
};

// ─── Materials ─────────────────────────────────────────────────────────────

export const materialsApi = {
  getAll:  (q?: string) =>
    posReq("GET", `/reports/top-materials${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getStock: () => posReq("GET", "/reports/stock"),
  printLabel: (b: Record<string, unknown>) => barcodeApi.printLabel(b),
};

// ─── Warehouses ────────────────────────────────────────────────────────────

export const warehousesApi = {
  getAll: () => posReq("GET", "/reports/stock"),
  getKpi: () => posReq("GET", "/reports/kpi"),
};

// ─── Inventory Counts ──────────────────────────────────────────────────────

export const inventoryApi = {
  getAll:       (params?: Record<string, string>) =>
    posReq("GET", `/inventory-counts${params ? `?${new URLSearchParams(params).toString()}` : ""}`),
  create:       (b: Record<string, unknown>)      => posReq("POST", "/inventory-counts", b),
  recordLine:   (b: Record<string, unknown>)      => posReq("POST", "/inventory-counts/lines/record", b),
  bulkRecord:   (b: Record<string, unknown>)      => posReq("POST", "/inventory-counts/lines/bulk-record", b),
  approve:      (b: Record<string, unknown>)      => posReq("PATCH", "/inventory-counts/approve", b),
  getVariance:  (id: number)                      => posReq("GET", `/inventory-counts/${id}/variance`),
  getPdf:       (id: number)                      => `${BASE}/inventory-counts/${id}/pdf`,
};

// ─── Requests ──────────────────────────────────────────────────────────────

export const requestsApi = {
  getAll:   (params?: Record<string, string>) =>
    posReq("GET", `/requests${params ? `?${new URLSearchParams(params).toString()}` : ""}`),
  getOne:   (id: number)                      => posReq("GET", `/requests/${id}`),
  create:   (b: Record<string, unknown>)      => posReq("POST", "/requests", b),
  approve:  (b: Record<string, unknown>)      => posReq("PATCH", "/requests/approve", b),
  reject:   (b: Record<string, unknown>)      => posReq("PATCH", "/requests/reject", b),
  issue:    (b: Record<string, unknown>)      => posReq("POST", "/requests/issue", b),
};

// ─── Employee / Ledger ─────────────────────────────────────────────────────

export const ledgerApi = {
  getMyBalance:  (userId: number) => posReq("GET", `/employees/${userId}/balance`),
  getMyBalance2: ()               => posReq("GET", "/employees/me/balance"),
  getStatement:  (userId: number, from: string, to: string) =>
    posReq("GET", `/employees/${userId}/statement?dateFrom=${from}&dateTo=${to}`),
  returnItem:    (b: Record<string, unknown>) => posReq("POST", "/movements", b),
};

// ─── Printers ─────────────────────────────────────────────────────────────

export const printerApi = {
  getAll:   ()                             => posReq("GET",  "/printer-config"),
  getActive: ()                            => posReq("GET",  "/printer-config/active"),
  create:   (b: Record<string, unknown>)  => posReq("POST", "/printer-config", b),
  update:   (id: number, b: Record<string, unknown>) => posReq("PATCH", `/printer-config/${id}`, b),
  test:     (id: number)                  => posReq("POST", `/printer-config/${id}/test`),
};

// ─── Reports ──────────────────────────────────────────────────────────────

export const reportsApi = {
  getKpi:           () => posReq("GET", "/reports/kpi"),
  getStock:         (wh?: string) =>
    posReq("GET", `/reports/stock${wh ? `?warehouseId=${encodeURIComponent(wh)}` : ""}`),
  getMovementStats: (period?: string) =>
    posReq("GET", `/reports/movement-stats${period ? `?period=${encodeURIComponent(period)}` : ""}`),
  getTopMaterials:  () => posReq("GET", "/reports/top-materials"),
  getThreeWayMismatch: () => posReq("GET", "/reports/three-way-match"),
  getLiabilities:   () => posReq("GET", "/reports/liabilities"),
  getAudit:         (params?: Record<string, string>) =>
    posReq("GET", `/reports/audit${params ? `?${new URLSearchParams(params).toString()}` : ""}`),
};
