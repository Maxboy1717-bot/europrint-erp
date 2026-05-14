/**
 * @module AccountsPayableTypes
 * @description Shared types and pure helpers for AccountsPayable.
 */

export interface ApAgingData {
  buckets: ApAgingBucket[];
  totals: {
    current: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    over120: number;
    totalOutstanding: number;
  };
}

export interface ApAgingBucket {
  id: string;
  vendorId: string;
  vendorName: string;
  current: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120: number;
  totalOutstanding: number;
  lastCalculatedAt?: string;
}

export interface OverduePayable {
  id: string;
  poNumber: string;
  vendorName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  invoiceDate: string;
  paymentStatus: string;
}

export type SortField =
  | "vendorName"
  | "current"
  | "days31to60"
  | "days61to90"
  | "days91to120"
  | "over120"
  | "totalOutstanding";

export type SortDirection = "asc" | "desc";

export type ApFormState = {
  vendorId: string;
  amount: string;
  dueDate: string;
  description: string;
};

export const EMPTY_AP_FORM: ApFormState = {
  vendorId: "",
  amount: "",
  dueDate: "",
  description: "",
};

export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
