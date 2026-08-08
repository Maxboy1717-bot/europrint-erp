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

/** Xodim/rahbar picker qatori — mavjud `/api/coordination/users-for-select` dan. */
export interface EmployeeSelectOption {
  id: number;
  user_id: number | null;
  full_name: string;
  role: string | null;
}

const BASE = "/api/pos/procurement";

export const procurementApi = {
  /** Xodim uchun org-sxema tasdiq zanjiri (eng yaqin rahbar → direktor). */
  approvalChain: (employeeId: number) =>
    apiRequest<ApprovalStep[]>("GET", `${BASE}/approval-chain/${employeeId}`),
  /** Xodim/rahbar dropdown ro'yxati (odam-do'st picker; ID-input o'rniga). Q-46: mavjud CC picker qayta ishlatiladi. */
  employeesForSelect: () =>
    apiRequest<EmployeeSelectOption[]>("GET", "/api/coordination/users-for-select"),
  /** Yangi xarid so'rovi + tasdiq zanjirini biriktirish. */
  createRequest: (body: CreateProcurementRequest) =>
    apiRequest<Record<string, unknown>>("POST", `${BASE}/requests`, body),
  /** So'rovlar ro'yxati (filtr: status/requester/navbatdagi tasdiqlovchi). */
  list: (params: { status?: string; requesterEmployeeId?: number; pendingApproverUserId?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.requesterEmployeeId) q.set("requesterEmployeeId", String(params.requesterEmployeeId));
    if (params.pendingApproverUserId) q.set("pendingApproverUserId", String(params.pendingApproverUserId));
    const qs = q.toString();
    return apiRequest<Record<string, unknown>[]>("GET", `${BASE}/requests${qs ? `?${qs}` : ""}`);
  },
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
