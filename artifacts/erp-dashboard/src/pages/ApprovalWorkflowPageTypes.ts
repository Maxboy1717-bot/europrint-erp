/**
 * @module ApprovalWorkflowPageTypes
 * @description Types, constants, and helpers for ApprovalWorkflowPage.
 */

export interface Workflow {
  id: string;
  documentType?: string;
  document_type?: string;
  documentId?: string;
  document_id?: string;
  documentNumber?: string;
  document_number?: string;
  amount?: number;
  currency?: string;
  requestedBy?: string;
  requested_by?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  approvedAt?: string;
  approved_at?: string;
}

export const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending:   { label: "Kutilmoqda",   variant: "secondary" },
  approved:  { label: "Tasdiqlandi",  variant: "default" },
  rejected:  { label: "Rad etildi",   variant: "destructive" },
  completed: { label: "Tugallandi",   variant: "outline" },
};

export const fmtAmt = (v?: number, cur?: string) =>
  v !== undefined ? `${Number(v).toLocaleString("uz-UZ")} ${cur ?? "UZS"}` : "—";

export interface WorkflowForm {
  documentType: string;
  documentId: string;
  documentNumber: string;
  amount: string;
  currency: string;
  requestedBy: string;
  notes: string;
}

export const EMPTY_FORM: WorkflowForm = {
  documentType: "",
  documentId: "",
  documentNumber: "",
  amount: "",
  currency: "UZS",
  requestedBy: "",
  notes: "",
};
