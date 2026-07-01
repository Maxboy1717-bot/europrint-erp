/**
 * POS Monitor API Layer
 * §1.2: ERP SSO — ERP httpOnly access_token cookie (credentials:include) bilan auth.
 * Alohida pos_session token YO'Q.
 */

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const BASE = `${_base}/api/pos`;

// ─── POS fetch (ERP cookie auth) ──────────────────────────────────────────────

async function posReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
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
  /**
   * GET /api/pos/stock/issuable/:barcode — CHIQIM oqimi (spec 2026-06-27, FAQAT SKANER):
   * skanlangan barkod → material + jami qoldiq + bron → bo'sh qoldiq; bron>0 → blocked
   * (faqat super_admin/direktor override). BE: PosStockIssuableService.getIssuable.
   */
  getIssuable:     (barcode: string, warehouseId?: string) =>
    posReq<IssuableResult>(
      "GET",
      `/stock/issuable/${encodeURIComponent(barcode)}${warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : ""}`,
    ),
};

/** CHIQIM bron-blok javobi — BE IssuableResult bilan bir xil (stock-issuable.service.ts). */
export interface IssuableResult {
  found:          boolean;
  barcode:        string;
  materialCardId?: number;
  materialCode?:  string | null;
  materialName?:  string;
  unit?:          string;
  warehouseId?:   number;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  onHand:         number;
  reserved:       number;
  freeStock:      number;
  /** Bron > 0 → CHIQIM blok (faqat override roli buzadi). */
  blocked:        boolean;
  /** Ushbu user blokni buza oladimi (super_admin / direktor). */
  canOverride:    boolean;
  reservations:   Array<{
    reservationId:     number;
    reservationNumber: string | null;
    reservedQuantity:  number;
    reservedByAi:      boolean;
    orderId:           number | null;
    orderType:         string | null;
  }>;
}

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
  getAll: (params?: { status?: string; type?: string; fromDate?: string; toDate?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.type) q.set("type", params.type);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return posReq<unknown[]>("GET", `/movements${qs ? "?" + qs : ""}`);
  },
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

/** Canonical scan material card — mirrors BE ScanBarcodeResultDto.materialCard. */
export interface ScanMaterialCard {
  id: number;
  kod: string;
  xomAshyo: string;
  xomAshyoRu: string;
  barcode: string;
  unitOfMeasure: string;
  materialType: string;
  unitPrice: number;
  lastPurchasePrice: number;
  isConsumable: boolean;
  isIndivisible: boolean;
  minIntervalDays: number;
  maxQtyPerIssue: number;
  currentStock?: number;
  availableStock?: number;
}

/** Canonical /barcode/scan envelope — mirrors BE ScanBarcodeResultDto. */
export interface ScanBarcodeResult {
  found: boolean;
  materialCard?: ScanMaterialCard;
  aiSuggestionId?: number;
  aiSuggestion?: {
    suggestedName: string;
    suggestedNameRu: string;
    suggestedUnit: string;
    confidence: number;
    reasoning: string;
  };
}

/** Etiket fizik o'lchami — ombor turi label-config'iga moslashadi (KIRIM spec). */
export interface InboundLabelDimensions {
  template: string;
  widthMm:  number;
  heightMm: number;
  dpi:      number;
}

/** POST /api/pos/barcode/generate javobi — BE InboundBarcodeResult bilan bir xil. */
export interface InboundBarcodeResult {
  barcode:        string;
  queueId:        number;
  materialCardId: number;
  warehouseId:    number;
  label: {
    materialCode:  string | null;
    materialName:  string;
    unit:          string;
    quantity:      number | null;
    warehouseCode: string;
    barcodeType:   "CODE128";
    dimensions:    InboundLabelDimensions;
  };
}

export const barcodeApi = {
  scan:       (b: { barcode: string; warehouseId?: string }) =>
    posReq<ScanBarcodeResult>("POST", "/barcode/scan", b),
  printLabel: (b: Record<string, unknown>) =>
    posReq("POST", "/barcode/print", b),
  lookup:     (barcode: string) =>
    posReq("GET", `/barcode/lookup?barcode=${encodeURIComponent(barcode)}`),
  /**
   * POST /api/pos/barcode/generate — KIRIM uchun noyob barkod "tug'iladi" (POS Monitor
   * printeridan, ERP'dan EMAS). Ombor-prefiks + seq, etiket o'lchami ombor turiga moslashadi.
   * Barkod MAJBURIY: bu chaqirilmasa KIRIM saqlanmaydi (spec 2026-06-27).
   */
  generate:   (b: { materialCardId: number; warehouseId: number; quantity?: number; unit?: string }) =>
    posReq<InboundBarcodeResult>("POST", "/barcode/generate", b),
};

// ─── Materials ─────────────────────────────────────────────────────────────

export const materialsApi = {
  getAll: (params?: { q?: string; category?: string; warehouseId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.q)           p.set("q", params.q);
    if (params?.category)    p.set("category", params.category);
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    if (params?.limit)       p.set("limit", String(params.limit));
    const qs = p.toString();
    return posReq("GET", `/wms/materials${qs ? "?" + qs : ""}`);
  },
  getStock: (warehouseId?: string) =>
    warehouseId
      ? posReq("GET", `/wms/warehouse/${encodeURIComponent(warehouseId)}/stock`)
      : posReq("GET", "/reports/stock"),
  printLabel: (b: Record<string, unknown>) => barcodeApi.printLabel(b),
};

// ─── Warehouses ────────────────────────────────────────────────────────────

export const warehousesApi = {
  getAll:    () => posReq("GET", "/wms/warehouses"),
  getStock:  (id: string) => posReq("GET", `/wms/warehouse/${encodeURIComponent(id)}/stock`),
  getMovements: (id: string, limit?: number) =>
    posReq("GET", `/wms/warehouse/${encodeURIComponent(id)}/movements${limit ? `?limit=${limit}` : ""}`),
  getKpi:    () => posReq("GET", "/reports/kpi"),
};

// ─── Employee ──────────────────────────────────────────────────────────────

export const employeeApi = {
  getMyInventory: () => posReq("GET", "/employees/me/inventory"),
  getChecklist:   () => posReq("GET", "/employees/me/checklist"),
  requestReturn:  (b: Record<string, unknown>) => posReq("POST", "/employees/me/return", b),
  getHrCheck:     (userId: number) => posReq("GET", `/employees/${userId}/hr-check`),
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
  /** Submit a DRAFT request → SUBMITTED */
  submit:   (id: number)                      => posReq("PATCH", `/requests/${id}/submit`),
  /** Fulfill an APPROVED request via barcode scan */
  fulfill:  (b: { requestId: number; barcodes?: string[] }) => posReq("POST", "/requests/fulfill", b),
};

// ─── Employee / Ledger ─────────────────────────────────────────────────────

export const ledgerApi = {
  getMyBalance:  (userId: number) => posReq("GET", `/employees/${userId}/balance`),
  /** GET /pos/employees/me/inventory — personal inventory balance */
  getMyBalance2: ()               => posReq("GET", "/employees/me/inventory"),
  getStatement:  (userId: number, from: string, to: string) =>
    posReq("GET", `/employees/${userId}/statement?dateFrom=${from}&dateTo=${to}`),
  returnItem:    (b: Record<string, unknown>) => posReq("POST", "/movements", b),
  /** GET /pos/employees/me/checklist — HR exit checklist */
  getChecklist:  ()               => posReq("GET", "/employees/me/checklist"),
};

// ─── Printers ─────────────────────────────────────────────────────────────

export const printerApi = {
  getAll:   ()                             => posReq("GET",  "/printer-config"),
  getActive: ()                            => posReq("GET",  "/printer-config/active"),
  create:   (b: Record<string, unknown>)  => posReq("POST", "/printer-config", b),
  update:   (id: number, b: Record<string, unknown>) => posReq("PATCH", `/printer-config/${id}`, b),
  test:     (id: number)                  => posReq("POST", `/printer-config/${id}/test`),
};

// ─── Quarantine & Inventory Passport API ─────────────────────────────────────
export const quarantineApi = {
  getList: () =>
    posReq<unknown[]>("GET", "/inventory-passport/quarantine"),

  recordQcDecision: (movementId: number, qcResult: "QABUL" | "REWORK" | "CHIQARISH", qcNote?: string) =>
    posReq("POST", `/inventory-passport/${movementId}/qc-decision`, { qcResult, qcNote }),

  createPassport: (dto: {
    movementId: number;
    supplierName?: string;
    contractNumber?: string;
    waybillNumber?: string;
    quantity: number;
    weightKg?: number;
    certificateNumber?: string;
  }) => posReq("POST", "/inventory-passport", dto),

  getPassport: (movementId: number) =>
    posReq("GET", `/inventory-passport/${movementId}`),

  listPassports: (params: { fromDate?: string; toDate?: string; qcResult?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.fromDate) q.set("fromDate", params.fromDate);
    if (params.toDate) q.set("toDate", params.toDate);
    if (params.qcResult) q.set("qcResult", params.qcResult);
    if (params.limit) q.set("limit", String(params.limit));
    return posReq<unknown>("GET", `/inventory-passport?${q.toString()}`);
  },
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
  getAbcAnalysis:   (warehouseId?: string) =>
    posReq("GET", `/reports/abc-analysis${warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : ""}`),
  getInactiveMaterials: (days = 90, warehouseId?: string) => {
    const p = new URLSearchParams({ days: String(days) });
    if (warehouseId) p.set("warehouseId", warehouseId);
    return posReq("GET", `/reports/inactive-materials?${p.toString()}`);
  },
};

// ─── Warehouse Features (Xodimlar, Auto-Barcode, Material 360) ──────────────

export const warehouseFeaturesApi = {
  // Xodimlar
  listEmployees:    (warehouseId: number) =>
    posReq(`GET`, `/wh-features/warehouse/${warehouseId}/employees`),
  listUserWarehouses: (userId: number) =>
    posReq(`GET`, `/wh-features/user/${userId}/warehouses`),
  assignEmployee:   (warehouseId: number, body: {
    userId: number;
    role: "manager" | "staff" | "keeper" | "qc_inspector" | "observer";
    isPrimary?: boolean;
    notes?: string;
  }) =>
    posReq(`POST`, `/wh-features/warehouse/${warehouseId}/employees`, body),
  removeEmployee:   (assignmentId: number) =>
    posReq(`DELETE`, `/wh-features/employees/${assignmentId}`),

  // Auto-barkod
  generateBarcodes: (movementId: number) =>
    posReq(`POST`, `/wh-features/movement/${movementId}/auto-barcode`),
  listBarcodes:     (movementId: number) =>
    posReq(`GET`, `/wh-features/movement/${movementId}/barcodes`),

  // Material 360°
  getMaterialProfile: (materialId: number) =>
    posReq(`GET`, `/wh-features/material/${materialId}/profile`),

  // GL Posting (avtomatik)
  postGl:           (movementId: number) =>
    posReq(`POST`, `/wh-features/movement/${movementId}/gl-post`),
  listGl:           (movementId: number) =>
    posReq(`GET`, `/wh-features/movement/${movementId}/gl-postings`),
  getGlJournal:     (params?: { dateFrom?: string; dateTo?: string; debitAccount?: string; creditAccount?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.dateFrom)      p.set('dateFrom', params.dateFrom);
    if (params?.dateTo)        p.set('dateTo', params.dateTo);
    if (params?.debitAccount)  p.set('debitAccount', params.debitAccount);
    if (params?.creditAccount) p.set('creditAccount', params.creditAccount);
    if (params?.limit)         p.set('limit', String(params.limit));
    const qs = p.toString();
    return posReq(`GET`, `/wh-features/gl/journal${qs ? '?' + qs : ''}`);
  },

  // KPI
  getWarehouseKpis: () =>
    posReq(`GET`, `/wh-features/kpi/warehouses`),
  getSystemKpi:     () =>
    posReq(`GET`, `/wh-features/kpi/system`),

  // GRN (Qabul Akti)
  listGrn:    (params?: { status?: string; warehouseId?: number; supplier?: string; dateFrom?: string; dateTo?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.status)      p.set('status', params.status);
    if (params?.warehouseId) p.set('warehouseId', String(params.warehouseId));
    if (params?.supplier)    p.set('supplier', params.supplier);
    if (params?.dateFrom)    p.set('dateFrom', params.dateFrom);
    if (params?.dateTo)      p.set('dateTo', params.dateTo);
    if (params?.limit)       p.set('limit', String(params.limit));
    const qs = p.toString();
    return posReq(`GET`, `/wh-features/grn${qs ? '?' + qs : ''}`);
  },
  createGrn:  (body: {
    supplierName: string; supplierTin?: string; warehouseId: number;
    waybillNumber?: string; contractNumber?: string; totalAmount?: number;
    currency?: string; notes?: string; movementId?: number; purchaseOrderId?: string;
  }) => posReq(`POST`, `/wh-features/grn`, body),
  approveGrn: (id: number) =>
    posReq(`POST`, `/wh-features/grn/${id}/approve`),
};

// ─── Handovers / Smena topshirig'i (POS Monitor 1-to'lqin) ────────────────────
// BE: /api/pos/handovers + /api/pos/handovers/pallets — smena/pallet topshirig'i,
// imzolash (2-imzo), bekor qilish, pallet balansi.

export const handoversApi = {
  /** GET /api/pos/handovers — barcha smena topshiriqlari (filtrlanadi). */
  getAll: (params?: { status?: string; warehouseId?: string; shiftId?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.status)      p.set("status", params.status);
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    if (params?.shiftId)     p.set("shiftId", String(params.shiftId));
    if (params?.limit)       p.set("limit", String(params.limit));
    const qs = p.toString();
    return posReq<unknown[]>("GET", `/handovers${qs ? "?" + qs : ""}`);
  },
  /** GET /api/pos/handovers/:id — bitta topshiriq tafsiloti. */
  getOne:  (id: number)                      => posReq("GET",  `/handovers/${id}`),
  /** POST /api/pos/handovers — yangi smena topshirig'i (Q-43 real saqlash). */
  create:  (b: Record<string, unknown>)      => posReq("POST", "/handovers", b),
  /** POST /api/pos/handovers/:id/sign — topshiriqni imzolash (qabul/topshiruvchi 2-imzo). */
  sign:    (id: number, b?: Record<string, unknown>) => posReq("POST", `/handovers/${id}/sign`, b ?? {}),
  /** POST /api/pos/handovers/:id/cancel — topshiriqni bekor qilish. */
  cancel:  (id: number, reason?: string)     => posReq("POST", `/handovers/${id}/cancel`, { reason }),
  /** GET /api/pos/handovers/pallets — pallet ro'yxati (smena bo'yicha). */
  getPallets:       (params?: { warehouseId?: string; status?: string }) => {
    const p = new URLSearchParams();
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    if (params?.status)      p.set("status", params.status);
    const qs = p.toString();
    return posReq<unknown[]>("GET", `/handovers/pallets${qs ? "?" + qs : ""}`);
  },
  /** GET /api/pos/handovers/pallets/balance — pallet balansi (kirim/chiqim farqi). */
  getPalletBalance: (params?: { warehouseId?: string }) => {
    const p = new URLSearchParams();
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    const qs = p.toString();
    return posReq("GET", `/handovers/pallets/balance${qs ? "?" + qs : ""}`);
  },
};

// ─── In-Transit / Yo'ldagi yuk (WMS) ──────────────────────────────────────────
// BE: /api/wms/in-transit/* — omborlararo ko'chirishda yo'lda turgan yuk holati.

export const inTransitApi = {
  /** GET /api/wms/in-transit — yo'ldagi yuklar ro'yxati. */
  getAll: (params?: { fromWarehouseId?: string; toWarehouseId?: string; status?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.fromWarehouseId) p.set("fromWarehouseId", params.fromWarehouseId);
    if (params?.toWarehouseId)   p.set("toWarehouseId", params.toWarehouseId);
    if (params?.status)          p.set("status", params.status);
    if (params?.limit)           p.set("limit", String(params.limit));
    const qs = p.toString();
    return posReq<unknown[]>("GET", `${_base}/api/wms/in-transit${qs ? "?" + qs : ""}`);
  },
  /** GET /api/wms/in-transit/:id — bitta yo'ldagi yuk tafsiloti. */
  getOne:   (id: number) => posReq("GET",  `${_base}/api/wms/in-transit/${id}`),
  /** POST /api/wms/in-transit/:id/receive — yo'ldagi yukni manzil omborida qabul qilish. */
  receive:  (id: number, b?: Record<string, unknown>) =>
    posReq("POST", `${_base}/api/wms/in-transit/${id}/receive`, b ?? {}),
  /** POST /api/wms/in-transit/:id/report-loss — yo'lda yo'qotish/kamomad qayd qilish. */
  reportLoss: (id: number, b: Record<string, unknown>) =>
    posReq("POST", `${_base}/api/wms/in-transit/${id}/report-loss`, b),
};

// ─── Material Life / Material umri (WMS) ──────────────────────────────────────
// BE: /api/wms/material-life/* — material yaroqlilik muddati, qoldiq umri, eskirish.

export const materialLifeApi = {
  /** GET /api/wms/material-life — material umri ro'yxati (muddat bo'yicha). */
  getAll: (params?: { warehouseId?: string; status?: string; daysLeft?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    if (params?.status)      p.set("status", params.status);
    if (params?.daysLeft)    p.set("daysLeft", String(params.daysLeft));
    if (params?.limit)       p.set("limit", String(params.limit));
    const qs = p.toString();
    return posReq<unknown[]>("GET", `${_base}/api/wms/material-life${qs ? "?" + qs : ""}`);
  },
  /** GET /api/wms/material-life/:materialId — bitta material umri tafsiloti. */
  getOne:    (materialId: number) =>
    posReq("GET", `${_base}/api/wms/material-life/${materialId}`),
  /** GET /api/wms/material-life/expiring — muddati tugayotgan materiallar. */
  getExpiring: (days = 30) =>
    posReq<unknown[]>("GET", `${_base}/api/wms/material-life/expiring?days=${days}`),
};

// ─── Variance / Inventarizatsiya og'ishi (POS) ────────────────────────────────
// BE: /api/pos/inventory-count/* — og'ish konfiguratsiyasi, qarori, sabab kataloglari, muzlatilgan zonalar.

export const varianceApi = {
  /** GET /api/pos/inventory-count/variance-config — og'ish chegaralari konfiguratsiyasi. */
  getVarianceConfig: () =>
    posReq("GET", "/inventory-count/variance-config"),
  /** POST /api/pos/inventory-count/variance-config — og'ish chegarasini saqlash (Q-43). */
  saveVarianceConfig: (b: Record<string, unknown>) =>
    posReq("POST", "/inventory-count/variance-config", b),
  /** POST /api/pos/inventory-count/variance-decision — og'ish bo'yicha qaror (qabul/rad/tekshir). */
  recordVarianceDecision: (b: Record<string, unknown>) =>
    posReq("POST", "/inventory-count/variance-decision", b),
  /** GET /api/pos/inventory-count/count-deviation-reasons — og'ish sabab katalogi. */
  getDeviationReasons: () =>
    posReq<unknown[]>("GET", "/inventory-count/count-deviation-reasons"),
  /** GET /api/pos/inventory-count/freeze-zones — muzlatilgan (sanash) zonalar. */
  getFreezeZones: () =>
    posReq<unknown[]>("GET", "/inventory-count/freeze-zones"),
  /** POST /api/pos/inventory-count/freeze-zones — zonani muzlatish/muzdan chiqarish. */
  setFreezeZone: (b: Record<string, unknown>) =>
    posReq("POST", "/inventory-count/freeze-zones", b),
};

// ─── Movement Extra / Harakat qo'shimcha (POS) ────────────────────────────────
// BE: /api/pos/movements/:id/recheck-techcard + /confirmations + /api/pos/anomalies.

export const movementExtraApi = {
  /** POST /api/pos/movements/:id/recheck-techcard — texkartani qayta tekshirish (ruxsat/bloklar). */
  recheckTechcard: (id: number) =>
    posReq<{
      allowed: boolean;
      blocks?: { code: string; message: string }[];
      techCardId?: number;
      checkedAt?: string;
    }>("POST", `/movements/${id}/recheck-techcard`),
  /** GET /api/pos/movements/:id/confirmations — harakat tasdiqlari (kim imzolagan). */
  getConfirmations: (id: number) =>
    posReq<unknown[]>("GET", `/movements/${id}/confirmations`),
  /** GET /api/pos/anomalies — anomaliya-flag qo'yilgan harakatlar ro'yxati. */
  getAnomalies: (params?: { status?: string; warehouseId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.status)      p.set("status", params.status);
    if (params?.warehouseId) p.set("warehouseId", params.warehouseId);
    if (params?.limit)       p.set("limit", String(params.limit));
    const qs = p.toString();
    return posReq<unknown[]>("GET", `/anomalies${qs ? "?" + qs : ""}`);
  },
};
