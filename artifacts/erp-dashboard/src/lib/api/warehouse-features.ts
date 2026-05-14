/**
 * warehouse-features.ts
 * ERP main app uchun warehouse features API client.
 * Backend endpoints — POS module ichida (/api/pos/wh-features/*),
 * lekin har qanday ERP foydalanuvchi (admin/director/manager) ulanishi mumkin.
 */
import { apiRequest } from "@/lib/queryClient";

const BASE = "/api/pos/wh-features";

export const warehouseFeaturesApi = {
  // Xodimlar
  listEmployees:      (warehouseId: number) =>
    apiRequest("GET", `${BASE}/warehouse/${warehouseId}/employees`),
  listUserWarehouses: (userId: number) =>
    apiRequest("GET", `${BASE}/user/${userId}/warehouses`),
  assignEmployee:     (warehouseId: number, body: {
    userId: number;
    role: "manager" | "staff" | "keeper" | "qc_inspector" | "observer";
    isPrimary?: boolean;
    notes?: string;
  }) => apiRequest("POST", `${BASE}/warehouse/${warehouseId}/employees`, body),
  removeEmployee:     (assignmentId: number) =>
    apiRequest("DELETE", `${BASE}/employees/${assignmentId}`),

  // Auto-barkod
  generateBarcodes:   (movementId: number) =>
    apiRequest("POST", `${BASE}/movement/${movementId}/auto-barcode`),
  listBarcodes:       (movementId: number) =>
    apiRequest("GET", `${BASE}/movement/${movementId}/barcodes`),

  // Material 360°
  getMaterialProfile: (materialId: number) =>
    apiRequest("GET", `${BASE}/material/${materialId}/profile`),

  // GL Posting
  postGl:             (movementId: number) =>
    apiRequest("POST", `${BASE}/movement/${movementId}/gl-post`),
  listGl:             (movementId: number) =>
    apiRequest("GET", `${BASE}/movement/${movementId}/gl-postings`),
  getGlJournal:       (params?: {
    dateFrom?: string; dateTo?: string;
    debitAccount?: string; creditAccount?: string; limit?: number;
  }) => {
    const p = new URLSearchParams();
    if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
    if (params?.dateTo) p.set("dateTo", params.dateTo);
    if (params?.debitAccount) p.set("debitAccount", params.debitAccount);
    if (params?.creditAccount) p.set("creditAccount", params.creditAccount);
    if (params?.limit) p.set("limit", String(params.limit));
    const qs = p.toString();
    return apiRequest("GET", `${BASE}/gl/journal${qs ? "?" + qs : ""}`);
  },

  // KPI
  getWarehouseKpis:   () => apiRequest("GET", `${BASE}/kpi/warehouses`),
  getSystemKpi:       () => apiRequest("GET", `${BASE}/kpi/system`),

  // GRN (Qabul Akti)
  listGrn:            (params?: {
    status?: string; warehouseId?: number; supplier?: string;
    dateFrom?: string; dateTo?: string; limit?: number;
  }) => {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    if (params?.warehouseId) p.set("warehouseId", String(params.warehouseId));
    if (params?.supplier) p.set("supplier", params.supplier);
    if (params?.dateFrom) p.set("dateFrom", params.dateFrom);
    if (params?.dateTo) p.set("dateTo", params.dateTo);
    if (params?.limit) p.set("limit", String(params.limit));
    const qs = p.toString();
    return apiRequest("GET", `${BASE}/grn${qs ? "?" + qs : ""}`);
  },
  createGrn:          (body: {
    supplierName: string; supplierTin?: string; warehouseId: number;
    waybillNumber?: string; contractNumber?: string; totalAmount?: number;
    currency?: string; notes?: string; movementId?: number; purchaseOrderId?: string;
  }) => apiRequest("POST", `${BASE}/grn`, body),
  approveGrn:         (id: number) =>
    apiRequest("POST", `${BASE}/grn/${id}/approve`),
};
