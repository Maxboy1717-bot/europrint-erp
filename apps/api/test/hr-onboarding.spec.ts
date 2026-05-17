/**
 * hr-onboarding.spec.ts — Phase 7 T7.3
 *
 * Coverage:
 *   - OnboardingProgressService: progress, atRisk, overdue, dashboard, buddy validation
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import {
  OnboardingProgressService,
  type OnboardingRecord,
  type WeeklyProgressEntry,
} from '../src/modules/hr/onboarding/onboarding-progress.service';

describe('OnboardingProgressService — T7.3', () => {
  let svc: OnboardingProgressService;
  beforeEach(() => { svc = new OnboardingProgressService(); });

  describe('computeOverallProgress', () => {
    it('empty array → 0', () => {
      expect(svc.computeOverallProgress([])).toBe(0);
    });

    it('null → 0', () => {
      expect(svc.computeOverallProgress(null)).toBe(0);
    });

    it('5/10 + 3/10 → 40', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 5, totalTasks: 10 },
        { week: 2, completedTasks: 3, totalTasks: 10 },
      ];
      expect(svc.computeOverallProgress(weeks)).toBe(40);
    });

    it('totals all 0 → 0 (safe div)', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 0, totalTasks: 0 },
      ];
      expect(svc.computeOverallProgress(weeks)).toBe(0);
    });

    it('completed > total → clamps to 100', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 99, totalTasks: 10 },
      ];
      expect(svc.computeOverallProgress(weeks)).toBe(100);
    });
  });

  describe('isAtRisk', () => {
    it('fewer than 2 weeks → false', () => {
      expect(svc.isAtRisk([{ week: 1, completedTasks: 5, totalTasks: 10, checkpointPassed: false }])).toBe(false);
    });

    it('pass rate 0/3 → true', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 5, totalTasks: 10, checkpointPassed: false },
        { week: 2, completedTasks: 5, totalTasks: 10, checkpointPassed: false },
        { week: 3, completedTasks: 5, totalTasks: 10, checkpointPassed: false },
      ];
      expect(svc.isAtRisk(weeks)).toBe(true);
    });

    it('pass rate 100% → false', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 5, totalTasks: 10, checkpointPassed: true },
        { week: 2, completedTasks: 5, totalTasks: 10, checkpointPassed: true },
      ];
      expect(svc.isAtRisk(weeks)).toBe(false);
    });

    it('no checkpointPassed flags → false', () => {
      const weeks: WeeklyProgressEntry[] = [
        { week: 1, completedTasks: 5, totalTasks: 10 },
        { week: 2, completedTasks: 5, totalTasks: 10 },
      ];
      expect(svc.isAtRisk(weeks)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    const today = '2026-05-17';

    it('IN_PROGRESS + expectedEndDate < today → true', () => {
      const r: OnboardingRecord = { id: 1, employeeId: 2, status: 'IN_PROGRESS', expectedEndDate: '2026-04-01' };
      expect(svc.isOverdue(r, today)).toBe(true);
    });

    it('COMPLETED → false (terminal)', () => {
      const r: OnboardingRecord = { id: 1, employeeId: 2, status: 'COMPLETED', expectedEndDate: '2026-04-01' };
      expect(svc.isOverdue(r, today)).toBe(false);
    });

    it('expectedEndDate after today → false', () => {
      const r: OnboardingRecord = { id: 1, employeeId: 2, status: 'IN_PROGRESS', expectedEndDate: '2026-09-01' };
      expect(svc.isOverdue(r, today)).toBe(false);
    });

    it('no expectedEndDate → false', () => {
      const r: OnboardingRecord = { id: 1, employeeId: 2, status: 'IN_PROGRESS' };
      expect(svc.isOverdue(r, today)).toBe(false);
    });
  });

  describe('computeDashboardStats', () => {
    it('empty array → zero stats', () => {
      const s = svc.computeDashboardStats([], '2026-05-17');
      expect(s.total).toBe(0);
      expect(s.active).toBe(0);
      expect(s.completed).toBe(0);
      expect(s.atRisk).toBe(0);
      expect(s.overdue).toBe(0);
    });

    it('mixed records: counts active / completed / failed correctly', () => {
      const records: OnboardingRecord[] = [
        { id: 1, employeeId: 1, status: 'IN_PROGRESS', expectedEndDate: '2026-09-01' },
        { id: 2, employeeId: 2, status: 'COMPLETED' },
        { id: 3, employeeId: 3, status: 'FAILED' },
        { id: 4, employeeId: 4, status: 'IN_PROGRESS', expectedEndDate: '2026-04-01' },
      ];
      const s = svc.computeDashboardStats(records, '2026-05-17');
      expect(s.total).toBe(4);
      expect(s.active).toBe(2);
      expect(s.completed).toBe(1);
      expect(s.failed).toBe(1);
      expect(s.overdue).toBe(1);
    });

    it('avgProgressPercent averages across all records', () => {
      const records: OnboardingRecord[] = [
        { id: 1, employeeId: 1, status: 'IN_PROGRESS', weeklyProgress: [{ week: 1, completedTasks: 10, totalTasks: 10 }] },
        { id: 2, employeeId: 2, status: 'IN_PROGRESS', weeklyProgress: [{ week: 1, completedTasks: 0, totalTasks: 10 }] },
      ];
      const s = svc.computeDashboardStats(records, '2026-05-17');
      expect(s.avgProgressPercent).toBe(50);
    });
  });

  describe('validateBuddyAssignment', () => {
    it('valid distinct ids → Ok', () => {
      const r = svc.validateBuddyAssignment(1, 2);
      expect(r.ok).toBe(true);
    });

    it('buddyId === employeeId → VALIDATION', () => {
      const r = svc.validateBuddyAssignment(5, 5);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('buddyId 0 → VALIDATION', () => {
      const r = svc.validateBuddyAssignment(1, 0);
      expect(r.ok).toBe(false);
    });

    it('buddyId negative → VALIDATION', () => {
      const r = svc.validateBuddyAssignment(1, -10);
      expect(r.ok).toBe(false);
    });
  });
});
