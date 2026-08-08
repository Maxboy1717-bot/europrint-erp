/**
 * @module i-director-data.repo
 * @description Domain repository interface for director dashboard data queries.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/director-data.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface DashboardData {
  orders: { month: number; completed: number; inProduction: number; overdue: number };
  production: { oee: string | null };
  hr: { present: number; total: number; active: number; late: number; attendanceRate: number };
  alerts: { minStock: number; iot: number };
}

export interface SummaryData {
  orders: {
    today: number;
    monthTotal: number;
    monthRevenue: number;
    activeProduction: number;
    pending: number;
    overdue: number;
  };
  production: { oee: number | null };
  generatedAt: string;
  /**
   * VISION-3340 #12: bugungi kun bo'yicha ЦКП deadline-gate muvofiqlik foizi
   * (ckp-gate.ts'dagi HAQIQIY `applyCkpGate` qoidasi bilan hisoblangan — reimplement
   * emas). Repository qatlamining `querySummary()` bu maydonni to'ldirmaydi —
   * u faqat `DirectorDataService.getSummaryFull()` da (alohida
   * `getCkpDeadlineComplianceRate` so'rovidan keyin) qo'shiladi, shuning uchun
   * bu yerda ixtiyoriy. `null` faqat gate-so'rov DB xatoga uchraganda
   * (fail-open — asosiy summary bloklanmaydi, Q-40: soxta % o'rniga honest null).
   */
  ckpDeadlineCompliance?: CkpDeadlineComplianceRate | null;
}

/**
 * VISION-3340 #12 — bir kunlik ЦКП deadline-gate muvofiqlik hisoboti. Bir xil
 * `applyCkpGate` (hr/payroll/ckp-gate.ts) qoidasi HAR bir ЦКП-normasi belgilangan
 * karta (org_departments.tskp_target IS NOT NULL) uchun qo'llanadi; natija
 * pass/fail sonlariga yig'iladi. FABRIKATSIYA YO'Q: karta yo'q bo'lsa (totalCards=0)
 * complianceRate halol 0 (soxta 100% emas).
 */
export interface CkpDeadlineComplianceRate {
  /** ЦКП kuni ('YYYY-MM-DD'). */
  date: string;
  /** ЦКП-normasi belgilangan (tskp_target IS NOT NULL) kartalar soni. */
  totalCards: number;
  /** Gate OCHIQ (applyCkpGate().open === true) bo'lgan kartalar soni. */
  passCount: number;
  /** Gate YOPIQ (NO_FACT yoki DEADLINE_PASSED) bo'lgan kartalar soni. */
  failCount: number;
  /** passCount/totalCards*100, yaxlitlangan. totalCards=0 bo'lsa 0. */
  complianceRate: number;
}

export interface ProductionData {
  orderBreakdown: Record<string, number>;
  sessionsToday: unknown[];
  oeeToday: { avg: string | null; min: string | null; max: string | null; snapshots: number };
  overdueOrders: unknown[];
  defectPct: number;
  delayedOrders: number;
}

export interface HrData {
  employees: { total: number; active: number; onLeave: number; suspended: number };
  attendance: {
    date: string;
    present: number;
    absent: number;
    late: number;
    earlyLeave: number;
    attendanceRate: number;
  };
  byDepartment: { department: string; count: number }[];
}

export interface FinanceData {
  invoices: Record<string, { count: number; amount: number }>;
  totalReceivable: number;
  overdueAmount: number;
  pendingAmount: number;
  accounts: { type: string | null; count: number }[];
}

export interface AlertsData {
  alerts: {
    id: string;
    severity: string;
    title: string;
    message: string;
    module: string;
    createdAt: string;
  }[];
  count: number;
}

export interface AiSummaryData {
  summary: string;
  generatedAt: string;
  aiGenerated: boolean;
  stats: Record<string, unknown>;
}

export interface IDirectorDataRepo {
  queryDashboard(): Promise<Result<DashboardData>>;
  querySummary(): Promise<Result<SummaryData>>;
  queryProduction(): Promise<Result<ProductionData>>;
  queryHr(): Promise<Result<HrData>>;
  queryFinance(): Promise<Result<FinanceData>>;
  queryAlerts(): Promise<Result<AlertsData>>;
  queryAiSummary(): Promise<Result<AiSummaryData>>;
  /** VISION-3340 #12 — bir kunlik ЦКП deadline-gate muvofiqlik foizi (ckp-gate.ts qoidasi bilan). */
  getCkpDeadlineComplianceRate(date: string): Promise<Result<CkpDeadlineComplianceRate>>;
}

export const DIRECTOR_DATA_REPO = Symbol('DIRECTOR_DATA_REPO');
