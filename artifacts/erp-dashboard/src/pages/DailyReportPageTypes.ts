/**
 * @module DailyReportPageTypes
 * @description Types and interfaces for DailyReportPage.
 */

// ── Report types ─────────────────────────────────────────────────────────────

export interface DailyReport {
  id: number;
  report_date: string;
  status: string;
  submitted_at?: string;
  tasks_completed?: string;
  metrics?: string;
  tomorrow_plan?: string;
  is_auto_absent?: boolean;
}

export interface DailyReportEmployee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  submitted_at?: string;
  tasks_completed?: string;
  is_machine_operator?: boolean;
  is_machine_operator_report?: boolean;
  is_auto_absent?: boolean;
  status?: string;
  oee?: number;
}

export interface DeptItem {
  id: number;
  name: string;
}

export interface DailyReportStats {
  stats?: {
    submitted_count?: number;
    auto_absent_count?: number;
    pending_count?: number;
    departments_with_reports?: number;
  };
}

export interface DeptReports {
  submitted?: DailyReportEmployee[];
  missing?: DailyReportEmployee[];
}

// ── Form state ────────────────────────────────────────────────────────────────

export interface ReportFormState {
  tasks_completed: string;
  metrics: string;
  tomorrow_plan: string;
}

export const INITIAL_FORM: ReportFormState = {
  tasks_completed: "",
  metrics: "",
  tomorrow_plan: "",
};

export type ReportType = "all" | "operator" | "office";
