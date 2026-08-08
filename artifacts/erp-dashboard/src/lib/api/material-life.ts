/**
 * material-life.ts
 * ERP main app uchun WMS Material hayot-tsikli (W4-MATERIAL-LIFE) API client.
 * Backend: apps/api/src/modules/wms/presentation/material-life.controller.ts
 *   Base: /api/wms/material-life
 *   - GET    /aging-alerts            → { items, total }
 *   - GET    /hazard-stock            → { items, total }
 *   - GET    /:id                     → MaterialLifeView
 *   - PATCH  /:id                     → MaterialLifeView (atribut tahrir)
 *   - GET    /:id/substitutes         → { items, total }
 *   - POST   /:id/substitutes         → SubstituteRow (201)
 *   - DELETE /substitutes/:subId      → void
 *
 * Q-46: faqat ADDITIVE — yangi client fayl, mavjud WMS chiqim-yo'liga tegmaydi.
 */
import { apiRequest } from "@/lib/queryClient";

const BASE = "/api/wms/material-life";

/** Bitta material-kartaning hayot-tsikli ko'rinishi (o'qish). */
export interface MaterialLifeView {
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

/** Atribut yangilash payload (faqat berilgan maydonlar yangilanadi). */
export interface MaterialLifeAttrs {
  ownerType?: "own" | "customer";
  hazardClass?: string | null;
  storageCondition?: string | null;
  ageAlertDays?: number | null;
  isRecyclable?: boolean;
  palletUnitQty?: number | null;
  isSample?: boolean;
}

/** Bitta analog/substitute juftlik. */
export interface SubstituteRow {
  id: number;
  materialId: number;
  substituteId: number;
  substituteName: string | null;
  priority: number;
  isApproved: boolean;
  notes: string | null;
}

/** Yosh/eskirish ogohlantirishidagi partiya (EP-WMS-126). */
export interface AgingAlertRow {
  stockId: number;
  materialId: number;
  materialName: string | null;
  warehouseId: number | null;
  quantity: number;
  ageDays: number;
  ageAlertDays: number;
}

/** Yangi analog qo'shish payload. */
export interface AddSubstituteInput {
  substituteId: number;
  priority?: number;
  isApproved?: boolean;
  notes?: string | null;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export const materialLifeApi = {
  /** Yosh/eskirish ogohlantirishidagi partiyalar (EP-WMS-126). */
  getAgingAlerts: () =>
    apiRequest("GET", `${BASE}/aging-alerts`) as Promise<ListResponse<AgingAlertRow>>,

  /** Xavfli materiallar qoldig'i (EP-WMS-128 — xavf-zona). */
  getHazardStock: () =>
    apiRequest("GET", `${BASE}/hazard-stock`) as Promise<ListResponse<MaterialLifeView>>,

  /** Bitta material-kartaning hayot-tsikli atributlari. */
  getLife: (materialId: number) =>
    apiRequest("GET", `${BASE}/${materialId}`) as Promise<MaterialLifeView>,

  /** Hayot-tsikli atributlarini yangilaydi (PATCH). */
  updateLife: (materialId: number, attrs: MaterialLifeAttrs) =>
    apiRequest("PATCH", `${BASE}/${materialId}`, attrs as Record<string, unknown>) as Promise<MaterialLifeView>,

  /** Material analoglari (substitute) ro'yxati (EP-WMS-101). */
  listSubstitutes: (materialId: number) =>
    apiRequest("GET", `${BASE}/${materialId}/substitutes`) as Promise<ListResponse<SubstituteRow>>,

  /** Material uchun analog qo'shadi (EP-WMS-101). */
  addSubstitute: (materialId: number, body: AddSubstituteInput) =>
    apiRequest("POST", `${BASE}/${materialId}/substitutes`, body as unknown as Record<string, unknown>) as Promise<SubstituteRow>,

  /** Analog juftlikni o'chiradi (soft-delete). */
  removeSubstitute: (subId: number) =>
    apiRequest("DELETE", `${BASE}/substitutes/${subId}`) as Promise<void>,
};
