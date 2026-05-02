import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Result, AppError } from '@common/result';
import { AnalyticsExtendedRepository } from './analytics-extended.repository';

@Injectable()
export class AnalyticsExtendedService {
  private readonly logger = new Logger(AnalyticsExtendedService.name);
  constructor(private readonly repo: AnalyticsExtendedRepository) {}

  async getActiveUsers(): Promise<Result<object, AppError>> {
    const r = await this.repo.findActiveUsers();
    return r.ok ? r : Ok({ dau: 0, wau: 0, mau: 0, totalActiveUsers: 0, dau_wau_ratio: 0, wau_mau_ratio: 0 });
  }

  async getActivityTrend() {
    const r = await this.repo.findActivityTrend();
    return r.ok ? r : Ok([] as { date: string; activeUsers: number }[]);
  }

  async getRetention() {
    const r = await this.repo.findRetention();
    return r.ok ? r : Ok({ day1Retention: 0, day7Retention: 0, day30Retention: 0, day1Count: 0, day7Count: 0, day30Count: 0, totalUsers: 0 });
  }

  async getSessionStats() {
    const r = await this.repo.findSessionStats();
    return r.ok ? r : Ok({ totalSessions: 0, averageDuration: 0, maxDuration: 0, minDuration: 0 });
  }

  async getDifficultyAnalysis() {
    const r = await this.repo.findDifficultyAnalysis();
    return r.ok ? r : Ok({ levels: [] as { level: string; count: number; averageScore: number }[] });
  }

  async getDiscriminationData() {
    const r = await this.repo.findDiscriminationData();
    return r.ok ? r : Ok({
      highScorers: { averageScore: 0, sampleSize: 0 },
      lowScorers: { averageScore: 0, sampleSize: 0 },
      discriminationIndex: 0,
      computedAt: _time.now().toISOString(),
    });
  }

  async getReliabilityData() {
    const r = await this.repo.findReliabilityData();
    return r.ok ? r : Ok({ cronbachAlpha: 0, standardError: 0, totalItems: 0 });
  }

  async getItemAnalysis() {
    const r = await this.repo.findItemAnalysis();
    return r.ok ? r : Ok({ items: [] as { itemId: string; title: string; attempts: number; facilityIndex: number; averageScore: number }[] });
  }

  async getMentorshipsStats() {
    const r = await this.repo.findMentorshipsStats();
    return r.ok ? r : Ok({ total: 0, active: 0, completed: 0, topMentors: [] as { mentorName: string; menteeCount: number }[] });
  }

  async getEventsStats() {
    const r = await this.repo.findEventsStats();
    return r.ok ? r : Ok({ total: 0, scheduled: 0, completed: 0, byType: [] as { type: string; count: number }[] });
  }

  async getApplicationsStats() {
    const r = await this.repo.findApplicationsStats();
    return r.ok ? r : Ok({ totalApplications: 0, totalResponses: 0, pendingResponses: 0, approvedResponses: 0, rejectedResponses: 0 });
  }

  async getSurveysStats() {
    const r = await this.repo.findSurveysStats();
    return r.ok ? r : Ok({ total: 0, active: 0, closed: 0, totalResponses: 0, responseRate: 0 });
  }

  async getBroadcastsStats() {
    const r = await this.repo.findBroadcastsStats();
    return r.ok ? r : Ok({ total: 0, totalRecipients: 0, totalSuccess: 0, totalFailed: 0, successRate: 0 });
  }

  async getSkillsStats() {
    const r = await this.repo.findSkillsStats();
    return r.ok ? r : Ok({ totalSkills: 0, totalUserSkills: 0, verifiedSkills: 0, byCategory: [] as { category: string; count: number }[] });
  }

  async getEmployeeStats() {
    const r = await this.repo.findEmployeeStats();
    return r.ok ? r : Ok({ newEmployees: 0, departedEmployees: 0, activeEmployees: 0, nonParticipatingEmployees: 0, studyingEmployees: 0 });
  }

  async getAiGeneralAnalysis() {
    const r = await this.repo.findAiGeneralAnalysis();
    return r.ok ? r : Ok({ analysis: '', generatedAt: _time.now().toISOString(), stats: {} as Record<string, unknown> });
  }

  async getScoreDistribution() {
    const r = await this.repo.findScoreDistribution();
    return r.ok ? r : Ok({ ranges: [] as { range: string; count: number }[] });
  }

  async getSkillsMatrix() {
    const r = await this.repo.findSkillsMatrix();
    return r.ok ? r : Ok([] as { subject: string; A: number; B: number }[]);
  }
}
