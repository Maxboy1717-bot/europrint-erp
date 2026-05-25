/**
 * @module analytics.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { AnalyticsRepository } from './analytics.repository';
import type { StatsRow, CourseProgressRow, UserActivityRow, TestResultRow, LearningOutcomesRow, FunnelRow, DeptRow, PosRow, LeaderEmpRow, LeaderDeptRow, LeaderCourseRow } from './analytics.repository';

const EMPTY_STATS: StatsRow = { totalUsers: 0, totalCourses: 0, activeCourses: 0, totalTests: 0, passedTests: 0, passRate: 0, averageScore: 0, avgTestScore: 0, completionRate: 0, averageTestTime: 0, completedCourses: 0 };

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(private readonly repo: AnalyticsRepository) {}

  async getStats(): Promise<Result<StatsRow & { topUsers: unknown[] }>> {
    const r = await this.repo.findStats();
    if (!r.ok) { this.logger.warn('getStats: DB unavailable, returning defaults'); return Ok({ ...EMPTY_STATS, topUsers: [] }); }
    return Ok({ ...r.data, topUsers: [] });
  }

  async getCourseProgress(): Promise<Result<CourseProgressRow[]>> {
    const r = await this.repo.findCourseProgress();
    if (!r.ok) { this.logger.warn('getCourseProgress: DB unavailable'); return Ok([]); }
    return r;
  }

  async getUserActivity(): Promise<Result<UserActivityRow[]>> {
    const r = await this.repo.findUserActivity();
    if (!r.ok) { this.logger.warn('getUserActivity: DB unavailable'); return Ok([]); }
    return r;
  }

  async getTestResults(): Promise<Result<TestResultRow[]>> {
    const r = await this.repo.findTestResults();
    if (!r.ok) { this.logger.warn('getTestResults: DB unavailable'); return Ok([]); }
    return r;
  }

  async getLearningOutcomes(): Promise<Result<LearningOutcomesRow>> {
    const r = await this.repo.findLearningOutcomes();
    if (!r.ok) { this.logger.warn('getLearningOutcomes: DB unavailable'); return Ok({ averageScore: 0, completionRate: 0, passRate: 0 }); }
    return r;
  }

  async getFunnel(): Promise<Result<FunnelRow>> {
    const r = await this.repo.findFunnel();
    if (!r.ok) { this.logger.warn('getFunnel: DB unavailable'); return Ok({ enrolled: 0, started: 0, completed: 0, passed: 0 }); }
    return r;
  }

  async getByDepartment(): Promise<Result<DeptRow[]>> {
    const r = await this.repo.findByDepartment();
    if (!r.ok) { this.logger.warn('getByDepartment: DB unavailable'); return Ok([]); }
    return r;
  }

  async getByPosition(): Promise<Result<PosRow[]>> {
    const r = await this.repo.findByPosition();
    if (!r.ok) { this.logger.warn('getByPosition: DB unavailable'); return Ok([]); }
    return r;
  }

  async getLeaderboardEmployees(): Promise<Result<LeaderEmpRow[]>> {
    const r = await this.repo.findLeaderboardEmployees();
    if (!r.ok) { this.logger.warn('getLeaderboardEmployees: DB unavailable'); return Ok([]); }
    return r;
  }

  async getLeaderboardDepartments(): Promise<Result<LeaderDeptRow[]>> {
    const r = await this.repo.findLeaderboardDepartments();
    if (!r.ok) { this.logger.warn('getLeaderboardDepartments: DB unavailable'); return Ok([]); }
    return r;
  }

  async getLeaderboardCourses(): Promise<Result<LeaderCourseRow[]>> {
    const r = await this.repo.findLeaderboardCourses();
    if (!r.ok) { this.logger.warn('getLeaderboardCourses: DB unavailable'); return Ok([]); }
    return r;
  }
}
