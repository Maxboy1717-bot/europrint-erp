/** @module DocumentWorkflowPageTypes @description Shared interfaces, constants, Zod schema, and the DeadlineBadge helper for the DocumentWorkflow feature. No JSX. */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DOC_TYPES_KEYS = [
  { value: "LEAVE_REQUEST",       key: "docTypeLeave" },
  { value: "ADVANCE_REQUEST",     key: "docTypeAdvance" },
  { value: "EXPENSE_CLAIM",       key: "docTypeExpense" },
  { value: "TRAINING_REQUEST",    key: "docTypeTraining" },
  { value: "INCIDENT_REPORT",     key: "docTypeIncident" },
  { value: "DISCIPLINE_NOTICE",   key: "docTypeDiscipline" },
  { value: "EMPLOYMENT_CONTRACT", key: "docTypeEmployment" },
  { value: "AMENDMENT_CONTRACT",  key: "docTypeAmendment" },
  { value: "DISMISSAL_ORDER",     key: "docTypeDismissal" },
  { value: "TRANSFER_ORDER",      key: "docTypeTransferOrder" },
  { value: "PIP_PLAN",            key: "docTypePIP" },
  { value: "OTHER",               key: "docTypeOther" },
] as const;

export const ROUTE_TYPES = ["VERTICAL", "HORIZONTAL", "SPECIFIC"] as const;

export const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-muted text-muted-foreground",
  pending:   "bg-yellow-700",
  approved:  "bg-green-700",
  rejected:  "bg-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

export const STATUS_LABEL_KEYS: Record<string, string> = {
  draft:     "statusDraft",
  pending:   "statusPending",
  approved:  "statusApproved",
  rejected:  "statusRejected",
  cancelled: "statusCancelled",
};

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface PendingStep {
  id: number;
  document_id: number;
  doc_number: string;
  title: string;
  creator_name: string;
  deadline_at: string;
  doc_status: string;
  doc_type: string;
}

export interface WorkflowDoc {
  id: number;
  title: string;
  doc_number: string;
  created_at: string;
  doc_type: string;
  status: string;
  total_steps: number;
  approved_steps: number;
  is_immutable: boolean;
  creator_name: string;
  rejection_reason: string;
}

export interface DocStep {
  id: number;
  status: string;
  assignee_name: string;
  assignee_role: string;
  deadline_at: string;
  escalated_at: string;
  reminder_1_sent: boolean;
  reminder_2_sent: boolean;
  notes: string;
  action_by_name: string;
  action_at: string;
}

export interface DocVersion {
  id: number;
  version: number;
  changed_by_name: string;
  created_at: string;
  change_reason: string;
}

export interface DocDetail {
  steps: DocStep[];
  versions: DocVersion[];
  document?: WorkflowDoc;
  [key: string]: unknown;
}

export interface RouteConfig {
  id: number;
  step_order: number;
  document_type: string;
  route_type: string;
  deadline_hours: number;
  levels_up: number;
  target_department: string;
  target_role_code: string;
  reminder_hours: number[];
  is_active: boolean;
}

export interface CreateDocForm {
  doc_type: string;
  title: string;
  content: string;
  created_by: number;
}

export interface RouteForm {
  document_type: string;
  step_order: number;
  route_type: string;
  levels_up: number;
  target_department: string;
  target_role_code: string;
  deadline_hours: number;
  reminder_hours_1: number;
  reminder_hours_2: number;
}

// ---------------------------------------------------------------------------
// Zod schema (used in admin route config form)
// ---------------------------------------------------------------------------

export const RouteConfigSchema = z.object({
  document_type:    z.string().min(1),
  step_order:       z.number().positive(),
  route_type:       z.string().min(1),
  levels_up:        z.number().positive(),
  target_department: z.string().optional(),
  target_role_code:  z.string().optional(),
  deadline_hours:   z.number().positive(),
  reminder_hours_1: z.number().positive(),
  reminder_hours_2: z.number().positive(),
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_ROUTE_FORM: RouteForm = {
  document_type:    "LEAVE_REQUEST",
  step_order:       1,
  route_type:       "VERTICAL",
  levels_up:        1,
  target_department: "",
  target_role_code:  "",
  deadline_hours:   24,
  reminder_hours_1: 4,
  reminder_hours_2: 2,
};
