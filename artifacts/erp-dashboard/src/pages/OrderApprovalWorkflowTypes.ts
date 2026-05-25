/**
 * @module OrderApprovalWorkflowTypes
 * @description Interfaces, types, Zod schemas, and constants for OrderApprovalWorkflow.
 */

import { z } from "zod";
import { FileCheck, Wrench, Shield, DollarSign } from "lucide-react";

export interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj: number;
  status: string;
  tayyorBolishSanasi?: string;
  createdAt: string;
  totalPrice?: number;
}

export interface ApprovalItem {
  id: string;
  orderId: string;
  stage: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  rejectionReason?: string;
  stageLabel: { uz: string; ru: string };
  order: PapkaOrder;
  approverName?: string;
}

export interface StageStats {
  stage: string;
  label: { uz: string; ru: string };
  pending: number;
  approved: number;
  rejected: number;
  approvedToday: number;
}

export interface DashboardData {
  stageStats: StageStats[];
  totals: { pending: number; approved: number; rejected: number; approvedToday: number };
}

export interface WorkflowData {
  order: PapkaOrder;
  workflow: Array<{
    stage: string;
    label: { uz: string; ru: string };
    approval: { id: string; status: string; approvedAt?: string; comments?: string; rejectionReason?: string } | null;
    approver: { fullName: string } | null;
  }>;
  currentStage: string;
}

export const STAGES = [
  { id: "design", icon: FileCheck, color: "text-[var(--ep-blue)]", bg: "bg-blue-500" },
  { id: "technical", icon: Wrench, color: "text-[var(--ep-primary)]", bg: "bg-orange-500" },
  { id: "qc", icon: Shield, color: "text-[var(--ep-purple)]", bg: "bg-purple-500" },
  { id: "finance", icon: DollarSign, color: "text-[var(--ep-green)]", bg: "bg-green-500" },
];

export const approvalSchema = z.object({
  comments: z.string().optional(),
  designFileUrl: z.string().optional(),
  designVersion: z.string().optional(),
  bomApproved: z.boolean().optional(),
  routingApproved: z.boolean().optional(),
  techCardApproved: z.boolean().optional(),
  qcTestId: z.string().optional(),
  materialApproved: z.boolean().optional(),
  advancePercentage: z.number().min(0).max(100).optional(),
  advanceAmount: z.number().min(0).optional(),
  creditLimitOk: z.boolean().optional(),
  debtStatusOk: z.boolean().optional(),
});

export const rejectionSchema = z.object({
  rejectionReason: z.string().min(1, "Rad etish sababi majburiy / Причина отказа обязательна"),
  comments: z.string().optional(),
});

export type ApprovalFormValues = z.infer<typeof approvalSchema>;
export type RejectionFormValues = z.infer<typeof rejectionSchema>;
