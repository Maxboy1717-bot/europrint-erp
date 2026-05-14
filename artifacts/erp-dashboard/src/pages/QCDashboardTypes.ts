/**
 * @module QCDashboardTypes
 * @description TypeScript interfaces, types, and constants for the QC Dashboard.
 * No JSX — pure type definitions only.
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QcStats {
  braks: { count: number; totalQty: number; totalCostImpact?: number };
  tests: { total: number; passed: number; passRate: number };
  reclamations: { total: number; open: number };
  suppliers: number;
  finalInspections: number;
  openRca?: number;
}

export interface QcFlowStream {
  label: string;
  total?: number;
  lowQuality?: number;
  inProduction?: number;
  pendingOrders?: number;
  resultCounts?: Record<string, number>;
  open?: number;
  investigating?: number;
  status: "ok" | "warning" | "active" | "needs_attention";
}

export interface QcFlowData {
  streams: {
    incoming: QcFlowStream;
    inline: QcFlowStream;
    finalInspection: QcFlowStream;
    reclamation: QcFlowStream;
  };
  rca: { open: number };
}

export interface QcBrak {
  id: string;
  quantity: number;
  reason?: string;
  stage?: string;
  costImpact?: string | number;
}

export interface QcReclamation {
  id: string;
  status?: string;
  clientName?: string;
  claimDate?: string;
}

export interface QcSupplierQuality {
  id: string;
  supplierName?: string;
  qualityScore?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const RESULT_LABELS: Record<string, { label: string; cls: string }> = {
  passed:           { label: "O'tdi",               cls: "bg-green-50 text-[var(--ep-green)]" },
  conditional_pass: { label: "Shartli o'tdi",        cls: "bg-teal-50 text-[var(--ep-cyan)]" },
  rework_required:  { label: "Qayta ishlash",        cls: "bg-amber-50 text-[var(--ep-yellow)]" },
  failed:           { label: "Muvaffaqiyatsiz",      cls: "bg-red-50 text-[var(--ep-red)]" },
  pending:          { label: "Kutilmoqda",           cls: "bg-muted text-muted-foreground" },
};
