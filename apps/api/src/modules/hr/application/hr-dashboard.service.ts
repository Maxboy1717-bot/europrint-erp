import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HrDashboardRepository } from './hr-dashboard.repository';

@Injectable()
export class HrDashboardService {
  constructor(private readonly repo: HrDashboardRepository) {}

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
}
