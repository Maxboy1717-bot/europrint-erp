/**
 * @module i-hr-dashboard.repo
 * @description Domain repository interface for HR dashboard aggregates
 *   (birthdays, milestones, monthly trend, ABC analysis, alerts,
 *   discipline/PIP/eNPS, daily-reports stats, shifts, alumni).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/hr-dashboard.repository.ts`.
 * @layer Domain (HR)
 */

import type { Result } from '@common/result';
import type { CreatePipDto, UpdatePipDto } from '../../presentation/dto/hr.dto';

type Row = Record<string, unknown>;

export interface DailyReportsStatsRow {
  total: number;
  approved: number;
  pending: number;
  today: number;
}

export interface IHrDashboardRepo {
  /**
   * @param departmentId - when provided, restricts results to employees whose
   *   PRIMARY org department matches this id. Used to scope PII (birth_date +
   *   full name) for the `MANAGER` role to their own department instead of
   *   company-wide (security fix — see hr-dashboard.controller.ts).
   */
  getBirthdaysToday(departmentId?: number): Promise<Result<Row[]>>;
  getBirthdaysUpcoming(d: number, departmentId?: number): Promise<Result<Row[]>>;
  /** Resolves the caller's own primary org_department_id (for MANAGER PII scoping). Null when unresolvable. */
  getUserPrimaryDepartmentId(userId: number): Promise<Result<number | null>>;
  getMilestonesUpcoming(d: number): Promise<Result<unknown[]>>;
  getMonthlyTrend(): Promise<Result<unknown[]>>;
  getAbcAnalysis(): Promise<Result<unknown[]>>;
  getAlerts(): Promise<Result<Row[]>>;
  getDisciplineRecords(): Promise<Result<unknown[]>>;
  getPip(): Promise<Result<unknown[]>>;
  createPip(data: CreatePipDto): Promise<Result<{ id: number }>>;
  updatePip(id: number, data: UpdatePipDto): Promise<Result<void>>;
  getEnpsSurveys(): Promise<Result<unknown[]>>;
  getAiInterviewSessions(): Promise<Result<unknown[]>>;
  getDailyReportsStats(): Promise<Result<DailyReportsStatsRow>>;
  getAdaptationAtRisk(): Promise<Result<unknown[]>>;
  getShiftsToday(today: string): Promise<Result<unknown[]>>;
  getAlumni(): Promise<Result<Row[]>>;
  createDailyReport(dto: {
    user_id: number;
    report_date: string;
    tasks_completed?: string;
  }): Promise<Result<Row>>;
  // ── New endpoints (HR Dashboard missing) ──────────────────────────────────
  getRiskScores(): Promise<Result<Row[]>>;
  getSafetySummary(): Promise<Result<Row>>;
  getSafetyIncidents(limit?: number): Promise<Result<Row[]>>;
  getDisciplineBlocked(): Promise<Result<Row[]>>;
  getResignationStats(): Promise<Result<Row[]>>;
  getContractsExpiring(days: number): Promise<Result<Row[]>>;
  getAttendanceSummary(days?: number): Promise<Result<Row[]>>;
  getGamificationLeaderboard(period: string): Promise<Result<Row[]>>;
  getOffboardingStats(): Promise<Result<Row>>;
  // ── Daily-report list endpoints (real DB reads) ────────────────────────────
  getReportsByDate(date: string | undefined, type: string | undefined, limit: number): Promise<Result<Row[]>>;
  getReportsByDepartment(departmentId: number | undefined, date: string | undefined): Promise<Result<{ submitted: Row[]; missing: Row[] }>>;
  getMyReports(userId: number, limit: number): Promise<Result<Row[]>>;
}

export const HR_DASHBOARD_REPO = Symbol('HR_DASHBOARD_REPO');
