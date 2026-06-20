/**
 * @module hr-dashboard.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HR_DASHBOARD_REPO, type IHrDashboardRepo } from '../domain/repositories/i-hr-dashboard.repo';
import type { CreatePipDto, UpdatePipDto } from '../presentation/dto/hr.dto';

@Injectable()
export class HrDashboardService {
  constructor(@Inject(HR_DASHBOARD_REPO) private readonly repo: IHrDashboardRepo) {}

  async getBirthdaysToday(): Promise<Result<object, AppError>> {
    return this.repo.getBirthdaysToday();
  }

  async getBirthdaysUpcoming(d: number) {
    return this.repo.getBirthdaysUpcoming(d);
  }

  async getMilestonesUpcoming(d: number) {
    return this.repo.getMilestonesUpcoming(d);
  }

  async getMonthlyTrend() {
    return this.repo.getMonthlyTrend();
  }

  async getAbcAnalysis() {
    return this.repo.getAbcAnalysis();
  }

  async getAlerts() {
    return this.repo.getAlerts();
  }

  async getDisciplineRecords() {
    return this.repo.getDisciplineRecords();
  }

  async getPip() {
    return this.repo.getPip();
  }

  async createPip(data: CreatePipDto) {
    return this.repo.createPip(data);
  }

  async updatePip(id: number, data: UpdatePipDto) {
    return this.repo.updatePip(id, data);
  }

  async getEnpsSurveys() {
    return this.repo.getEnpsSurveys();
  }

  async getAiInterviewSessions() {
    return this.repo.getAiInterviewSessions();
  }

  async getDailyReportsStats() {
    return this.repo.getDailyReportsStats();
  }

  async getAdaptationAtRisk() {
    return this.repo.getAdaptationAtRisk();
  }

  async getShiftsToday(today: string) {
    return this.repo.getShiftsToday(today);
  }

  async getAlumni() {
    return this.repo.getAlumni();
  }

  async createDailyReport(dto: { user_id: number; report_date: string; tasks_completed?: string }) {
    return this.repo.createDailyReport(dto);
  }

  // ── New delegation methods ─────────────────────────────────────────────────
  async getRiskScores() { return this.repo.getRiskScores(); }
  async getSafetySummary() { return this.repo.getSafetySummary(); }
  async getSafetyIncidents(limit?: number) { return this.repo.getSafetyIncidents(limit); }
  async getDisciplineBlocked() { return this.repo.getDisciplineBlocked(); }
  async getResignationStats() { return this.repo.getResignationStats(); }
  async getContractsExpiring(days: number) { return this.repo.getContractsExpiring(days); }
  async getAttendanceSummary(days?: number) { return this.repo.getAttendanceSummary(days); }
  async getGamificationLeaderboard(period: string) { return this.repo.getGamificationLeaderboard(period); }
  async getOffboardingStats() { return this.repo.getOffboardingStats(); }
  // ── Daily-report list endpoints ────────────────────────────────────────────
  async getReportsByDate(date: string | undefined, type: string | undefined, limit: number) {
    return this.repo.getReportsByDate(date, type, limit);
  }
  async getReportsByDepartment(departmentId: number | undefined, date: string | undefined) {
    return this.repo.getReportsByDepartment(departmentId, date);
  }
  async getMyReports(userId: number, limit: number) {
    return this.repo.getMyReports(userId, limit);
  }
}
