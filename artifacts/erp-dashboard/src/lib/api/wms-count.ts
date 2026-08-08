/**
 * @module wms-count
 * @description W3-COUNT inventarizatsiya kuchaytirish FE client (BE: /api/wms/*).
 *   Ko'r-sanoq (blind count) count-line yozish + og'ish-sabab katalogi (deviation
 *   reasons) + muzlatish-zona (freeze zones). Ombor (EP) ilovasi uchun additive —
 *   mavjud /api/warehouse/inventory-counts oqimi O'ZGARMAYDI.
 *
 * BE manba: apps/api/src/modules/wms/presentation/wms-counts.controller.ts
 *   POST  /api/wms/count-lines                  (count-line yozish, og'ish-sabab)
 *   GET   /api/wms/count-deviation-reasons      (sabab katalogi)
 *   GET   /api/wms/freeze-zones                 (muzlatishlar ro'yxati)
 *   POST  /api/wms/freeze-zones                 (zona/material muzlatish)
 *   PATCH /api/wms/freeze-zones/:id/release     (muzlatishni bo'shatish)
 */
import { apiRequest } from "@/lib/api-request";

const BASE = "/api/wms";

/** Og'ish-sabab katalogi (count_deviation_reasons). */
export interface CountDeviationReason {
  id: number;
  code: string;
  name: string;
  name_ru?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

/** Count-line yozish kirishi (system≠counted bo'lsa deviation_reason_code majburiy). */
export interface RecordCountLineInput {
  count_id: number | string;
  material_id: number | string;
  system_qty: number;
  counted_qty: number;
  deviation_reason_code?: string | null;
  notes?: string | null;
}

/** Muzlatish-zona qatori (inventory_freeze_zones + JOIN nomlari). */
export interface FreezeZone {
  id: number;
  warehouse_id: number;
  material_id: number | null;
  count_id: number | null;
  status: string;
  reason: string | null;
  frozen_by: number | null;
  frozen_at: string | null;
  released_at?: string | null;
  warehouse_name?: string | null;
  material_name?: string | null;
}

/** Muzlatish kirishi (material_id NULL = butun zona muzlaydi). */
export interface FreezeZoneInput {
  warehouse_id: number | string;
  material_id?: number | string | null;
  count_id?: number | string | null;
  reason?: string | null;
}

interface ListEnvelope<T> {
  items: T[];
  total: number;
}

export const wmsCountApi = {
  /** Og'ish-sabab katalogi (faqat aktiv). */
  deviationReasons: () =>
    apiRequest<ListEnvelope<CountDeviationReason>>("GET", `${BASE}/count-deviation-reasons`),

  /** Count-line yozish (ko'r-sanoq natijasi + og'ish-sabab). */
  recordCountLine: (input: RecordCountLineInput) =>
    apiRequest<unknown>("POST", `${BASE}/count-lines`, input),

  /** Muzlatishlar ro'yxati (ixtiyoriy status / ombor filtri). */
  freezeZones: (params?: { status?: string; warehouseId?: number | string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", String(params.status));
    if (params?.warehouseId != null && params.warehouseId !== "")
      qs.set("warehouseId", String(params.warehouseId));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest<ListEnvelope<FreezeZone>>("GET", `${BASE}/freeze-zones${suffix}`);
  },

  /** Zona/material muzlatish. */
  freezeZone: (input: FreezeZoneInput) =>
    apiRequest<FreezeZone>("POST", `${BASE}/freeze-zones`, input),

  /** Muzlatishni bo'shatish (idempotent — faqat aktivni bo'shatadi). */
  releaseFreezeZone: (id: number) =>
    apiRequest<FreezeZone | null>("PATCH", `${BASE}/freeze-zones/${id}/release`),
};
