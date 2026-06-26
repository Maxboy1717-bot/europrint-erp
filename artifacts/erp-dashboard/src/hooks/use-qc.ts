/**
 * @module use-qc
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";

type BrakRow = { quantity?: number | string; cost_impact?: number | string; is_reworkable?: boolean | string };
type CostImpactSummary = { totalBraks: number; totalQuantity: number; totalCostImpact: number; reworkable: number };

function aggregateBrakRows(raw: unknown): CostImpactSummary | null {
  const rows = Array.isArray(raw) ? (raw as BrakRow[]) : null;
  if (!rows || !rows.length) return null;
  return {
    totalBraks: rows.length,
    totalQuantity: (Array.isArray(rows) ? rows : []).reduce((s, r) => s + Number(r.quantity ?? 0), 0),
    totalCostImpact: (Array.isArray(rows) ? rows : []).reduce((s, r) => s + Number(r.cost_impact ?? 0), 0),
    reworkable: (Array.isArray(rows) ? rows : []).filter((r) => r.is_reworkable === true || r.is_reworkable === "true").length,
  };
}

export function useQCDashboard() {
  return useQuery({ queryKey: ["/api/qc/dashboard"] });
}

export function useQCDefects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/qc/defects", filters],
    select: (data) => safeArray(data, "defects"),
  });
}

export function useQCStats() {
  return useQuery({ queryKey: ["/api/qc/defects/stats"] });
}

type InspectionItem = { id: string; status?: string; sampleSize?: number; referenceType?: string; createdAt?: string };

export function useQCInspections() {
  return useQuery({
    queryKey: ["/api/qc/inspections"],
    select: (res: unknown): InspectionItem[] => {
      if (Array.isArray(res)) return res as InspectionItem[];
      const r = res as { ok?: boolean; data?: { items?: InspectionItem[] } };
      return r?.data?.items ?? [];
    },
  });
}

export function useQCInspectionById(id: string | null) {
  return useQuery({
    queryKey: ["/api/qc/inspections", id],
    queryFn: () => apiRequest<{ statusCode: number; data: Record<string, unknown> }>("GET", `/api/qc/inspections/${id}`),
    select: (res) => (res as { statusCode?: number; data?: Record<string, unknown> })?.data ?? (res as Record<string, unknown>),
    enabled: !!id,
  });
}

export function useQCSupplierQuality() {
  return useQuery({ queryKey: ["/api/qc/supplier-quality"] });
}

export function useQCCheckpoints() {
  return useQuery({ queryKey: ["/api/qc/checkpoints"] });
}

export function useQCBrakCostImpact(papkaOrderId: string | null) {
  return useQuery({
    queryKey: ["/api/qc/braks/cost-impact", papkaOrderId],
    queryFn: () => apiRequest("GET", `/api/qc/braks/cost-impact/${papkaOrderId}`),
    select: (raw) => aggregateBrakRows(raw),
    enabled: !!papkaOrderId && papkaOrderId.length > 0,
  });
}

export function useCreateDefect() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/qc/defects", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/qc/defects"] }),
  });
}

export function useResolveDefect() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string | number;
      [key: string]: unknown;
    }) => apiRequest("PATCH", `/api/qc/defects/${id}/resolve`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/qc/defects"] }),
  });
}

export function useCreateInspection() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/qc/inspections", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/qc/inspections"] }),
  });
}

/**
 * QC inspector's 3-way verdict on an inspection: Qabul (pass) / Rad (fail) /
 * REWORK (qayta ishlash). `decision` drives the backend; `passed` is kept for
 * legacy callers. REWORK returns the batch to production instead of accepting
 * or scrapping it.
 */
export function useSubmitInspection() {
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string | number;
      orderId: number;
      decision: "pass" | "fail" | "rework";
      reason?: string;
      supplierId?: number;
    }) => apiRequest("POST", `/api/qc/inspections/${id}/submit`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/qc/inspections"] }),
  });
}

/** Dedicated REWORK decision — sends the inspected batch back to production. */
export function useReworkInspection() {
  return useMutation({
    mutationFn: ({ id, orderId, reason }: {
      id: string | number;
      orderId: number;
      reason?: string;
    }) => apiRequest("POST", `/api/qc/inspections/${id}/rework`, { orderId, reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/qc/inspections"] }),
  });
}
