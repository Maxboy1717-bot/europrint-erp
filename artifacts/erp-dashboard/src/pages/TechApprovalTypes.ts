/**
 * @module TechApprovalTypes
 * @description Shared TypeScript interfaces and constants for the TechApproval page.
 *              Contains domain types for orders, AI check results, approval logs,
 *              and material alternatives used across all TechApproval sub-modules.
 */

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface TechOrderData {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  mahsulotTuri: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  tayyorBolishSanasi: string | null;
  status: string;
}

export interface AiCheckWarning {
  code: string;
  level: "error" | "warning" | "info";
  message: string;
}

export interface AiCheckResult {
  orderId: string;
  orderNo: string;
  score: number;
  status: "passed" | "warnings" | "failed";
  warnings: AiCheckWarning[];
  techCardFound: boolean;
  recommendation: string;
}

export interface ApprovalLog {
  orderId: string;
  orderNo: string;
  currentStatus: string;
  techAction: "pending" | "approved" | "rejected";
  checkpoints: {
    bomApproved: boolean;
    routingApproved: boolean;
    techCardApproved: boolean;
  };
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
  isRejected: boolean;
}

export interface MaterialAlt {
  name: string;
  saving: string;
  note: string;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

export type ApprovalTab = "approval" | "ai" | "materials";

export type ReturnTarget = "manager" | "designer";
