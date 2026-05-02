export interface Company {
  id: number;
  title: string;
  industry: string | null;
  stir: string | null;
  employees: number | null;
  revenue: number | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  websites: { value: string; type: string }[];
  address: string | null;
  assignedById: string | null;
  dateCreate: string;
  dateModify: string;
  customerCategory: string | null;
  segment: string | null;
  openDebt: number | null;
  creditLimit: number | null;
}

export interface Contact {
  id: number;
  name: string | null;
  secondName: string | null;
  lastName: string | null;
  post: string | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  linkRole?: string | null;
  linkIsPrimary?: boolean | null;
  linkId?: number;
}

export interface Deal {
  id: number;
  title: string;
  opportunity: number | null;
  stageId: string;
}

export interface CreditLimit {
  id: number;
  creditLimit: string;
  availableCredit: string;
  currentBalance: string;
  paymentTermsDays: number;
  riskRating: string;
  blockedForCredit: boolean;
}

export interface CreditLimitResponse {
  requiresApproval: boolean;
  approvalRequestId?: number;
  currentLimit?: number;
  requestedLimit?: number;
  increasePercent?: number;
  success?: boolean;
  creditLimit?: CreditLimit;
}

export const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export const RISK_LABELS: Record<string, string> = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
};

export function formatAmount(val: string | number | null | undefined) {
  if (val === null || val === undefined) return "0";
  return parseFloat(String(val)).toLocaleString("uz-UZ");
}

export function generateId() {
  return crypto.randomUUID();
}
