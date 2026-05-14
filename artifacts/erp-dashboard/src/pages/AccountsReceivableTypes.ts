/**
 * @module AccountsReceivableTypes
 * @description Shared types and pure helpers for AccountsReceivable.
 */

export interface ArAgingData {
  buckets: ArAgingBucket[];
  totals: {
    current: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    over120: number;
    totalOutstanding: number;
  };
}

export interface ArAgingBucket {
  id: string;
  customerId: string;
  customerType: string;
  current: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120: number;
  totalOutstanding: number;
  lastCalculatedAt?: string;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  invoiceDate: string;
  paymentStatus: string;
}

export type SortField =
  | "customerId"
  | "current"
  | "days31to60"
  | "days61to90"
  | "days91to120"
  | "over120"
  | "totalOutstanding";

export type SortDirection = "asc" | "desc";

export type ArFormState = {
  customerId: string;
  amount: string;
  dueDate: string;
  description: string;
};

export const EMPTY_AR_FORM: ArFormState = {
  customerId: "",
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
