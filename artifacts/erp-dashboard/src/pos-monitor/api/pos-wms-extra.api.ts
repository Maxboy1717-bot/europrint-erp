/**
 * @module pos-wms-extra.api
 * @description FE-P2 qo'shimcha POS/WMS API klienti — VARIANCE (farq) konfiguratsiyasi,
 *   farq qarori, og'ish-sabab katalogi, muzlatilgan-zona boshqaruvi va MATERIAL
 *   HAYOT-TSIKLI (atribut + analog/substitute) endpointlari.
 *
 *   ⚠️ Nega alohida fayl: P1 (`pos-monitor.api.ts`) dagi varianceApi/materialLifeApi
 *   metodlari noto'g'ri yo'l (URL) ishlatadi (`/inventory-count/...` + posReq ichidagi
 *   `/api/pos` prefiksi WMS yo'liga qo'shilib ketadi). Q-46 regress-himoya: P1 metodlarini
 *   o'zgartirmasdan, BU yerda BE controller'lariga AYNAN mos to'g'ri yo'llar yoziladi:
 *     • POS:  GET/PATCH /api/pos/inventory-counts/variance-config
 *             GET       /api/pos/inventory-counts/:id/variance-decision
 *     • WMS:  GET       /api/wms/count-deviation-reasons
 *             GET/POST  /api/wms/freeze-zones, PATCH /api/wms/freeze-zones/:id/release
 *             GET/PATCH /api/wms/material-life/:id
 *             GET/POST  /api/wms/material-life/:id/substitutes
 *             DELETE    /api/wms/material-life/substitutes/:subId
 *             GET       /api/wms/material-life/aging-alerts | hazard-stock
 *
 *   Auth: ERP httpOnly cookie (credentials:include) — pos-monitor.api.ts bilan bir xil.
 * @layer FE (pos-monitor)
 */

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${_base}/api`;

/** posReq bilan bir xil unwrap mantig'i (Result envelope: {isSuccess,value} | {ok,data} | {items,total} | xom). */
async function wmsReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json() as { message?: string }; msg = j.message ?? msg; } catch { /* noop */ }
    throw new Error(`WMS API ${method} ${path} → ${res.status}: ${msg}`);
  }

  const ct = res.headers.get("content-type");
  if (res.status === 204 || !ct?.includes("application/json")) return null as T;

  const json: unknown = await res.json();

  if (json !== null && typeof json === "object" &&
      "isSuccess" in (json as Record<string, unknown>) &&
      "isFailure" in (json as Record<string, unknown>)) {
    const w = json as { isSuccess: boolean; value: T; error: string };
    if (w.isSuccess) return w.value;
    throw new Error(w.error ?? "Server xatosi");
  }

  if (json !== null && typeof json === "object" &&
      "ok" in (json as Record<string, unknown>) &&
      typeof (json as Record<string, unknown>).ok === "boolean") {
    const w = json as unknown as { ok: boolean; data?: T; error?: { message?: string } | string };
    if (w.ok) return w.data as T;
    const e = typeof w.error === "object" && w.error !== null ? w.error.message ?? "Server xatosi" : String(w.error ?? "Server xatosi");
    throw new Error(e);
  }

  return json as T;
}

/** `{ items, total }` envelope'dan massivni ajratib oladi (yoki xom massiv). */
function asList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && Array.isArray((v as { items?: unknown }).items)) {
    return (v as { items: T[] }).items;
  }
  return [];
}

// ─── Variance (farq) konfiguratsiyasi + qarori (POS) ──────────────────────────

export interface VarianceThreshold {
  warehouseId?: number | null;
  autoApproveQtyPct: number;
  autoApproveValueUzs: number;
  notes?: string | null;
}

export interface VarianceDecisionView {
  countId: number;
  warehouseId: number | null;
  varianceLineCount: number;
  decision: "AUTO_APPROVE" | "ESCALATE";
  escalatedLines: number;
  threshold: VarianceThreshold;
  reasons: string[];
}

export interface DeviationReason {
  code: string;
  name?: string | null;
  nameUz?: string | null;
  description?: string | null;
}

export interface FreezeZone {
  id: number;
  warehouseId: number;
  materialId?: number | null;
  countId?: number | null;
  reason?: string | null;
  status?: string;
  frozenBy?: number | null;
  createdAt?: string;
}

export const varianceConfigApi = {
  /** GET /api/pos/inventory-counts/variance-config — farq avto-tasdiq chegarasi. */
  getConfig: (warehouseId?: number | null) =>
    wmsReq<VarianceThreshold>("GET", `/pos/inventory-counts/variance-config${warehouseId != null ? `?warehouseId=${warehouseId}` : ""}`),
  /** PATCH /api/pos/inventory-counts/variance-config — chegarani saqlash (Q-43). */
  saveConfig: (b: { warehouseId?: number | null; autoApproveQtyPct: number; autoApproveValueUzs: number; notes?: string }) =>
    wmsReq<VarianceThreshold>("PATCH", "/pos/inventory-counts/variance-config", b),
  /** GET /api/pos/inventory-counts/:id/variance-decision — avto-tasdiq yoki eskalatsiya qarori. */
  getDecision: (countId: number) =>
    wmsReq<VarianceDecisionView>("GET", `/pos/inventory-counts/${countId}/variance-decision`),
};

export const deviationApi = {
  /** GET /api/wms/count-deviation-reasons — og'ish-sabab katalogi. */
  getReasons: () =>
    wmsReq<unknown>("GET", "/wms/count-deviation-reasons").then(asList<DeviationReason>),
};

export const freezeZonesApi = {
  /** GET /api/wms/freeze-zones — muzlatilgan (sanash) zonalar. */
  getAll: (params?: { status?: string; warehouseId?: number }) => {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    if (params?.warehouseId != null) p.set("warehouseId", String(params.warehouseId));
    const qs = p.toString();
    return wmsReq<unknown>("GET", `/wms/freeze-zones${qs ? "?" + qs : ""}`).then(asList<FreezeZone>);
  },
  /** POST /api/wms/freeze-zones — zonani muzlatish (Q-43 real saqlash). */
  freeze: (b: { warehouse_id: number; material_id?: number | null; count_id?: number | null; reason?: string }) =>
    wmsReq<FreezeZone>("POST", "/wms/freeze-zones", b),
  /** PATCH /api/wms/freeze-zones/:id/release — muzlatishni bekor qilish. */
  release: (id: number) =>
    wmsReq<unknown>("PATCH", `/wms/freeze-zones/${id}/release`),
};

// ─── Material hayot-tsikli (WMS) ──────────────────────────────────────────────

export interface MaterialLife {
  materialId: number;
  name: string | null;
  ownerType: string;
  hazardClass: string | null;
  storageCondition: string | null;
  ageAlertDays: number | null;
  isRecyclable: boolean;
  palletUnitQty: number | null;
  isSample: boolean;
}

export interface Substitute {
  id: number;
  materialId: number;
  substituteId: number;
  substituteName: string | null;
  priority: number;
  isApproved: boolean;
  notes: string | null;
}

export interface MaterialLifeUpdate {
  ownerType?: "own" | "customer";
  hazardClass?: string | null;
  storageCondition?: string | null;
  ageAlertDays?: number | null;
  isRecyclable?: boolean;
  palletUnitQty?: number | null;
  isSample?: boolean;
}

export const materialLifeExtraApi = {
  /** GET /api/wms/material-life/:id — hayot-tsikli atributlari. */
  getLife: (materialId: number) =>
    wmsReq<MaterialLife | null>("GET", `/wms/material-life/${materialId}`),
  /** PATCH /api/wms/material-life/:id — atributlarni yangilash (Q-43). */
  updateLife: (materialId: number, b: MaterialLifeUpdate) =>
    wmsReq<MaterialLife>("PATCH", `/wms/material-life/${materialId}`, b),
  /** GET /api/wms/material-life/:id/substitutes — analoglar ro'yxati. */
  listSubstitutes: (materialId: number) =>
    wmsReq<unknown>("GET", `/wms/material-life/${materialId}/substitutes`).then(asList<Substitute>),
  /** POST /api/wms/material-life/:id/substitutes — analog qo'shish. */
  addSubstitute: (materialId: number, b: { substituteId: number; priority?: number; isApproved?: boolean; notes?: string | null }) =>
    wmsReq<Substitute>("POST", `/wms/material-life/${materialId}/substitutes`, b),
  /** DELETE /api/wms/material-life/substitutes/:subId — analog juftlikni o'chirish. */
  removeSubstitute: (subId: number) =>
    wmsReq<unknown>("DELETE", `/wms/material-life/substitutes/${subId}`),
  /** GET /api/wms/material-life/aging-alerts — eskirish ogohlantirishidagi partiyalar. */
  getAgingAlerts: () =>
    wmsReq<unknown>("GET", "/wms/material-life/aging-alerts").then(asList<Record<string, unknown>>),
  /** GET /api/wms/material-life/hazard-stock — xavfli materiallar qoldig'i. */
  getHazardStock: () =>
    wmsReq<unknown>("GET", "/wms/material-life/hazard-stock").then(asList<Record<string, unknown>>),
};

/** Ruxsat etilgan egalik turlari (BE MATERIAL_OWNER_TYPES). */
export const MATERIAL_OWNER_TYPES = ["own", "customer"] as const;
/** Tavsiya etilgan xavf-sinflari (BE MATERIAL_HAZARD_CLASSES). */
export const MATERIAL_HAZARD_CLASSES = ["flammable", "toxic", "corrosive", "oxidizer", "irritant"] as const;
