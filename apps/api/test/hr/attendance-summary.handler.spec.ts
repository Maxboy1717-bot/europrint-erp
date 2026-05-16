/**
 * test/hr/attendance-summary.handler.spec.ts
 *
 * Unit tests for AttendanceSummaryHandler. The HrRepository instance is
 * mocked with a minimal partial — only `getAttendanceByPeriod` is invoked.
 */

import {
  AttendanceSummaryHandler,
  AttendanceSummaryQuery,
} from '../../src/modules/hr/application/queries/attendance-summary.handler';
import type { HrRepository } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr.repo';

interface AttRow { status: string; overtimeHours?: number }

function makeRepo(rows: AttRow[]): jest.Mocked<HrRepository> {
  return {
    getAttendanceByPeriod: jest.fn().mockResolvedValue(rows),
  } as unknown as jest.Mocked<HrRepository>;
}

describe('AttendanceSummaryHandler', () => {
  it('returns zero summary when employee has no records in the period', async () => {
    const repo = makeRepo([]);
    const handler = new AttendanceSummaryHandler(repo);

    const r = await handler.execute(new AttendanceSummaryQuery(42, 6, 2026));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.presentDays).toBe(0);
      expect(r.data.absentDays).toBe(0);
      expect(r.data.attendanceRate).toBe(0);
    }
  });

  it('counts present, absent, late and half_day buckets correctly', async () => {
    const rows: AttRow[] = [
      { status: 'present' }, { status: 'present' }, { status: 'present' },
      { status: 'absent' },
      { status: 'late' }, { status: 'late' },
      { status: 'half_day' },
    ];
    const repo = makeRepo(rows);
    const handler = new AttendanceSummaryHandler(repo);

    const r = await handler.execute(new AttendanceSummaryQuery(42, 6, 2026));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.presentDays).toBe(3);
      expect(r.data.absentDays).toBe(1);
      expect(r.data.lateDays).toBe(2);
      expect(r.data.halfDays).toBe(1);
    }
  });

  it('sums overtime hours numerically across records', async () => {
    const rows: AttRow[] = [
      { status: 'present', overtimeHours: 2 },
      { status: 'present', overtimeHours: 1.5 },
      { status: 'present' },
    ];
    const repo = makeRepo(rows);
    const handler = new AttendanceSummaryHandler(repo);

    const r = await handler.execute(new AttendanceSummaryQuery(42, 6, 2026));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.totalOvertimeHours).toBe(3.5);
  });

  it('caps attendance rate at 100% even when present days exceed working days', async () => {
    // June 2026 has 22 weekdays; supply 30 "present" rows to force >100%
    const rows: AttRow[] = Array.from({ length: 30 }, () => ({ status: 'present' }));
    const repo = makeRepo(rows);
    const handler = new AttendanceSummaryHandler(repo);

    const r = await handler.execute(new AttendanceSummaryQuery(42, 6, 2026));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.attendanceRate).toBe(100);
  });

  it('formats the month label as M/YYYY in the response', async () => {
    const repo = makeRepo([]);
    const handler = new AttendanceSummaryHandler(repo);

    const r = await handler.execute(new AttendanceSummaryQuery(7, 3, 2026));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.month).toBe('3/2026');
  });
});
