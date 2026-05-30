/**
 * Procurement (P2P) FE API client — xarid-to'lov zanjiri (BE: /api/pos/procurement).
 * So'rov → org-sxema tasdiq → avans → qabul (chek) → podotchet reconcile.
 */
import { apiRequest } from "@/lib/api-request";

export interface ApprovalStep {
  depth: number;
  level: number | null;
  orgDepartmentId: number;
  departmentName: string;
  approverUserId: number;
}

export interface ProcurementItemInput {
  description: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: number;
  materialId?: number;
}

export interface CreateProcurementRequest {
  requesterEmployeeId: number;
  requesterUserId?: number;
  title: string;
  description?: string;
  vendorId?: number;
  paymentMode?: "advance" | "reimburse";
  targetWarehouseType?: string;
  neededByDate?: string;
  currency?: string;
  items: ProcurementItemInput[];
}

const BASE = "/api/pos/procurement";

export const procurementApi = {
  /** Xodim uchun org-sxema tasdiq zanjiri (eng yaqin rahbar → direktor). */
  approvalChain: (employeeId: number) =>
    apiRequest<ApprovalStep[]>("GET", `${BASE}/approval-chain/${employeeId}`),
  /** Yangi xarid so'rovi + tasdiq zanjirini biriktirish. */
  createRequest: (body: CreateProcurementRequest) =>
    apiRequest<Record<string, unknown>>("POST", `${BASE}/requests`, body),
  /** So'rov tafsilotlari (qatorlar + tasdiq bosqichlari). */
  getRequest: (id: number) =>
    apiRequest<Record<string, unknown>>("GET", `${BASE}/requests/${id}`),
  /** Tasdiq qadami (approve/reject). */
  decide: (id: number, body: { approverUserId: number; action: "approve" | "reject"; comments?: string }) =>
    apiRequest<Record<string, unknown>>("POST", `${BASE}/requests/${id}/decide`, body),
  /** Tovar qabul (chek + podotchet reconcile). */
  receive: (id: number, body: { chekNumber?: string; chekAmount?: number; warehouseId?: string; notes?: string }) =>
    apiRequest<Record<string, unknown>>("POST", `${BASE}/requests/${id}/receive`, body),
};
