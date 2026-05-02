import { z } from "zod";

export interface PayrollContract {
  id: string;
  employeeId: string;
  contractNumber: string;
  payType: "fixed" | "hourly" | "piecework";
  baseSalary: number | null;
  hourlyRate: number | null;
  pieceworkRate: number | null;
  pieceworkUnit: string | null;
  minWageGuarantee: boolean;
  monthlyHours: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: string;
}

export interface PayrollCalculation {
  id: string;
  periodId: string | null;
  employeeId: string;
  contractId: string;
  payType: string;
  workDays: number;
  workHours: number;
  productionUnits: number;
  basePay: number;
  hourlyPay: number;
  pieceworkPay: number;
  bonuses: number;
  allowances: number;
  grossPay: number;
  taxInps: number;
  taxJshd: number;
  totalTaxes: number;
  advances: number;
  loans: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  minWageTopUp: number;
  status: string;
  calculatedAt: string;
  approvedAt: string | null;
}

export interface PayrollTaxRule {
  id: string;
  taxCode: string;
  taxName: string;
  taxNameRu: string | null;
  taxType: string;
  rate: number;
  employeeShare: number;
  employerShare: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface PayrollUser {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string | null;
  positionId: string | null;
}

export interface AIPayrollResult {
  employeeId: string;
  employeeName: string;
  periodMonth: string;
  payType: string;
  workDays: number;
  workHours: number;
  overtimeHours: number;
  productionUnits: number;
  basePay: number;
  hourlyPay: number;
  pieceworkPay: number;
  overtimePay: number;
  grossPay: number;
  taxInps: number;
  taxJshd: number;
  totalTaxes: number;
  totalDeductions: number;
  netPay: number;
  minWageTopUp: number;
  confidence: number;
  dataQuality: string;
  recommendations: AIRecommendation[];
  evidence: WorkEvidence;
}

export interface WorkEvidence {
  attendanceWorkDays: number;
  attendanceWorkHours: number;
  attendanceConfidence: number;
  productionUnits: number;
  productionConfidence: number;
  trackedHours: number;
  taskCompletionCount: number;
  timeTrackingConfidence: number;
  overtimeHours: number;
  overallConfidence: number;
  dataQualityScore: string;
  anomaliesDetected: boolean;
  anomalyDetails: Array<{ type: string; description: string; severity: string }>;
}

export interface AIRecommendation {
  type: "bonus" | "penalty" | "adjustment" | "warning" | "optimization";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  suggestedAmount?: number;
  impactPercentage?: number;
  confidence: number;
}

export const payTypeKeys: Record<string, string> = {
  fixed: "fixedPay",
  hourly: "hourlyPay",
  piecework: "pieceworkPay",
};

export const statusKeys: Record<string, { key: string; module: "finance" | "common" }> = {
  draft: { key: "draft", module: "common" },
  calculated: { key: "calculated", module: "finance" },
  approved: { key: "approved", module: "common" },
  paid: { key: "paid", module: "finance" },
  active: { key: "active", module: "common" },
  suspended: { key: "suspended", module: "finance" },
  terminated: { key: "terminated", module: "finance" },
};

export const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  calculated: "outline",
  approved: "default",
  paid: "default",
  active: "default",
  suspended: "secondary",
  terminated: "destructive",
};

export const calculationFormSchema = z.object({
  employeeId: z.string().min(1),
  workDays: z.coerce.number().min(0).max(31).default(0),
  workHours: z.coerce.number().min(0).default(0),
  productionUnits: z.coerce.number().min(0).default(0),
  bonuses: z.coerce.number().min(0).default(0),
  allowances: z.coerce.number().min(0).default(0),
  advances: z.coerce.number().min(0).default(0),
  loans: z.coerce.number().min(0).default(0),
  otherDeductions: z.coerce.number().min(0).default(0),
});

export type CalculationFormValues = z.infer<typeof calculationFormSchema>;
