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
}

export const DIRECTOR_DATA_REPO = Symbol('DIRECTOR_DATA_REPO');
