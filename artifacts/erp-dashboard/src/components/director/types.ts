export interface DirectorSummary {
  revenue: { value: number; formatted: string; change: string; trend: string };
  orders: { value: number; formatted: string; change: string; trend: string };
  production: { value: number; formatted: string; change: string; trend: string };
  employees: { value: number; formatted: string; change: string; trend: string };
}
export interface DirDashboard {
  orders: { month: number; completed: number; inProduction: number; overdue: number };
  production: { oee: string | null };
  hr: { present: number; total: number; active: number; late: number; attendanceRate: number };
  alerts: { minStock: number; iot: number };
}
export interface DirSummary {
  orders: { today: number; monthTotal: number; monthRevenue: number; activeProduction: number; pending: number; overdue: number };
  production: { oee: number | null };
  generatedAt: string;
}
export interface ProductionData {
  orderBreakdown: Record<string, number>;
  sessionsToday: Array<{ id: number; equipmentId: string; status: string; targetQty: number; producedQty: number; defectQty: number; oee: number }>;
  oeeToday: { avg: string | null; min: string | null; max: string | null; snapshots: number };
  overdueOrders: Array<{ id: number; papkaNo: string; tayyorBolishSanasi: string; status: string }>;
}
export interface HRData {
  employees: Record<string, number> & { total: number };
  attendance: { date: string; present: number; absent: number; late: number; earlyLeave: number; attendanceRate: number };
  byDepartment: Array<{ department: string; count: number }>;
}
export interface FinanceData {
  invoices: Record<string, { count: number; amount: number }>;
  totalReceivable: number;
  overdueAmount: number;
  pendingAmount: number;
  accounts: Array<{ type: string | null; count: number }>;
}
export interface AlertItem {
  id: string; severity: string; title: string; message: string; module: string; createdAt: string;
}
export interface AISummary {
  summary: string; generatedAt: string; aiGenerated?: boolean;
  stats: { totalOrders: number; totalRevenue?: number; completedOrders: number; overdueOrders: number; oee: string | null; attendance: { present: number; total: number; rate: number }; overdueInvoices?: { count: number; amount: number }; stockAlerts?: number };
}
export interface WMSRentalItem {
  warehouseId: string | null; warehouseName: string; warehouseType: string;
  totalQty: number; totalValue: number; itemCount: number;
  rentalCostMonthly: number; rentalCostToDate: number;
}
export interface WMSRentalData {
  rentalData: WMSRentalItem[]; grandTotal: number; grandTotalToDate: number;
  daysElapsed: number; daysInMonth: number; month: string; generatedAt: string;
}
export interface KpiWithValue {
  id: string; kpiCode: string; kpiName: string; category: string;
  targetValue: number; warningThreshold: number; criticalThreshold: number;
  thresholdDirection: string; unit: string; blockOnViolation: boolean; currentValue: number;
}
export interface CompanyStateCurrent {
  status: "osish" | "normal" | "ehtiyot" | "xavf" | "inqiroz";
  label: string; label_ru: string; emoji: string; week_start: string;
  kpis: { profit: number; revenue: number; costs: number; retention_pct: number; profit_pct: number; revenue_pct: number };
  thresholds: { profit: Record<string, number>; revenue: Record<string, number>; retention: Record<string, number> };
  generated_at: string;
}
export interface CompanyStateHistory {
  history: Array<{ week_label: string; week_start: string; revenue: number; profit: number; perf_ratio: number; state_key: string }>;
}
export interface IdealVsActual {
  week_start: string;
  profit: { actual: number; target: number; pct: number; deviation_pct: number; formatted_actual: string; formatted_target: string };
  revenue: { actual: number; target: number; pct: number; deviation_pct: number; formatted_actual: string; formatted_target: string };
  orders: { completed: number; total: number; completion_pct: number };
}
