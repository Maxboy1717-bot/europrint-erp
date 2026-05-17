/**
 * OnboardingProgressService — pure domain logic for onboarding analytics.
 *
 * Responsibilities:
 *   - Compute overall progress percent for an onboarding (week-weighted)
 *   - Compute dashboard stats (active / completed / at_risk / overdue)
 *   - Decide whether an onboarding is at-risk (low checkpoint pass rate)
 *   - Validate buddy assignment (cannot be the employee themselves)
 *
 * No DB / HTTP dependencies — fully unit-testable.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';

export interface WeeklyProgressEntry {
  week: number;
  completedTasks: number;
  totalTasks: number;
  checkpointPassed?: boolean;
}

export interface OnboardingRecord {
  id: number;
  employeeId: number;
  status: string;
  startDate?: string;
  expectedEndDate?: string;
  weeklyProgress?: WeeklyProgressEntry[];
}

export interface OnboardingDashboardStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  atRisk: number;
  overdue: number;
  avgProgressPercent: number;
}

const AT_RISK_PASS_RATE_THRESHOLD = 0.6;

@Injectable()
export class OnboardingProgressService {
  /**
   * Compute progress percent (0..100) based on completedTasks / totalTasks
   * summed across all weekly entries.
   */
  computeOverallProgress(weeklyProgress: WeeklyProgressEntry[] | undefined | null): number {
    if (!Array.isArray(weeklyProgress) || weeklyProgress.length === 0) return 0;
    let done = 0;
    let total = 0;
    for (const w of weeklyProgress) {
      if (!w || typeof w !== 'object') continue;
      const c = Number(w.completedTasks) || 0;
      const t = Number(w.totalTasks)     || 0;
      done  += Math.max(0, c);
      total += Math.max(0, t);
    }
    if (total <= 0) return 0;
    return Math.round((Math.min(done, total) / total) * 100);
  }

  /**
   * Decide whether an onboarding is at risk:
   *   - has at least 2 weeks of progress recorded
   *   - checkpoint pass rate < 60%
   */
  isAtRisk(weeklyProgress: WeeklyProgressEntry[] | undefined | null): boolean {
    if (!Array.isArray(weeklyProgress) || weeklyProgress.length < 2) return false;
    let total = 0;
    let passed = 0;
    for (const w of weeklyProgress) {
      if (typeof w !== 'object' || w === null) continue;
      if (typeof w.checkpointPassed === 'boolean') {
        total += 1;
        if (w.checkpointPassed) passed += 1;
      }
    }
    if (total === 0) return false;
    return passed / total < AT_RISK_PASS_RATE_THRESHOLD;
  }

  /**
   * Decide whether an onboarding is overdue:
   *   - status is IN_PROGRESS or 'active' and expectedEndDate < today.
   */
  isOverdue(record: OnboardingRecord, today: string): boolean {
    if (!record || typeof record !== 'object') return false;
    const status = String(record.status ?? '').toUpperCase();
    if (status !== 'IN_PROGRESS' && status !== 'ACTIVE') return false;
    if (!record.expectedEndDate) return false;
    return record.expectedEndDate < today;
  }

  /**
   * Aggregate dashboard stats across many onboarding records.
   */
  computeDashboardStats(
    records: OnboardingRecord[] | undefined | null,
    today: string,
  ): OnboardingDashboardStats {
    const arr = Array.isArray(records) ? records : [];
    const stats: OnboardingDashboardStats = {
      total: arr.length,
      active: 0,
      completed: 0,
      failed: 0,
      atRisk: 0,
      overdue: 0,
      avgProgressPercent: 0,
    };
    if (arr.length === 0) return stats;

    let totalProgress = 0;
    for (const r of arr) {
      const status = String(r.status ?? '').toUpperCase();
      if (status === 'COMPLETED') stats.completed += 1;
      else if (status === 'FAILED') stats.failed += 1;
      else stats.active += 1;

      if (this.isAtRisk(r.weeklyProgress)) stats.atRisk += 1;
      if (this.isOverdue(r, today))        stats.overdue += 1;
      totalProgress += this.computeOverallProgress(r.weeklyProgress);
    }
    stats.avgProgressPercent = Math.round(totalProgress / arr.length);
    return stats;
  }

  /**
   * Validate buddy assignment.
   *   - buddyId cannot equal employeeId (employee cannot be their own buddy)
   *   - buddyId must be a positive integer
   */
  validateBuddyAssignment(employeeId: number, buddyId: number): Result<{ buddyId: number }> {
    if (!Number.isInteger(buddyId) || buddyId <= 0) {
      return Err(AppErr('VALIDATION', "buddyId musbat butun son bo'lishi kerak"));
    }
    if (buddyId === employeeId) {
      return Err(AppErr('VALIDATION', "Xodim o'ziga o'zi buddy bo'lishi mumkin emas"));
    }
    return Ok({ buddyId });
  }
}
