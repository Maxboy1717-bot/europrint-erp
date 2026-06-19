/**
 * test/mes/get-oee.handler.spec.ts
 *
 * Unit tests for GetOeeHandler. Mocks the @shared/db module's `db.select(...).from(...).where(...)`
 * chain to feed deterministic session rows into the handler, plus a second
 * `db.select().from()` call for downtime_events (no .where) used by Availability.
 *
 * These assertions encode the CORRECTED OEE math:
 *   Availability = runTime / plannedTime   (runTime = span − downtime)
 *   Performance  = completedSessions / totalSessions
 *   Quality      = (totalSessions − defectiveSessions) / totalSessions
 *                  (defective = quality_passed === false OR defect_qty > 0)
 *   OEE          = A × P × Q, guarded; empty table → [].
 */

interface SessionRow {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  work_center_id: string | null;
  status: string;
  defect_qty: number;
  quality_passed: boolean | null;
}

interface DowntimeRow {
  sessionId: string | null;
  durationMin: string | null;
  durationMinutes: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
}

const dbRows: { value: SessionRow[] } = { value: [] };
const downtimeRows: { value: DowntimeRow[] } = { value: [] };

jest.mock('@shared/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        // mes_sessions query uses .where(); downtime_events query does not.
        if (table === 'downtime_events') {
          return Promise.resolve(downtimeRows.value);
        }
        return {
          where: () => Promise.resolve(dbRows.value),
        };
      },
    }),
  },
  mes_sessions: 'mes_sessions',
  downtime_events: 'downtime_events',
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetOeeHandler } from '../../src/modules/mes/application/queries/get-oee.handler';
import { GetOeeQuery } from '../../src/modules/mes/application/queries/get-oee.query';

interface OeeRow {
  workCenterId: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  sessionCount: number;
  downtimeMinutes: number;
  runMinutes: number;
}

function session(over: Partial<SessionRow>): SessionRow {
  return {
    id: 's1',
    started_at: new Date('2024-01-01T08:00:00Z'),
    completed_at: new Date('2024-01-01T09:00:00Z'),
    work_center_id: 'wc-A',
    status: 'completed',
    defect_qty: 0,
    quality_passed: true,
    ...over,
  };
}

async function build(): Promise<GetOeeHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [GetOeeHandler],
  }).compile();
  return module.get(GetOeeHandler);
}

describe('GetOeeHandler', () => {
  beforeEach(() => {
    dbRows.value = [];
    downtimeRows.value = [];
  });

  it('returns Ok with empty list when no sessions match (empty table → 0, not 100)', async () => {
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('groups sessions by workCenterId when filter is omitted', async () => {
    dbRows.value = [
      session({ id: 's1', work_center_id: 'wc-A' }),
      session({ id: 's2', work_center_id: 'wc-B' }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      const ids = rows.map((x) => x.workCenterId).sort();
      expect(ids).toEqual(['wc-A', 'wc-B']);
    }
  });

  it('scores 100% only for a completed, defect-free run with NO downtime', async () => {
    dbRows.value = [session({ id: 's1' })];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].availability).toBe(100);
      expect(rows[0].performance).toBe(100);
      expect(rows[0].quality).toBe(100);
      expect(rows[0].oee).toBe(100);
    }
  });

  it('Availability drops below 100% when downtime is subtracted from run time', async () => {
    // 60-minute span, 30 minutes of recorded downtime → Availability = 30/60 = 50%.
    dbRows.value = [session({ id: 's1' })];
    downtimeRows.value = [
      { sessionId: 's1', durationMin: '30', durationMinutes: null, startedAt: null, endedAt: null },
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].downtimeMinutes).toBe(30);
      expect(rows[0].runMinutes).toBe(30);
      expect(rows[0].availability).toBe(50);
      expect(rows[0].oee).toBe(50); // 0.5 × 1 × 1
    }
  });

  it('Quality is a real fraction — defects drag it down (not a boolean cast)', async () => {
    dbRows.value = [
      session({ id: 's1', defect_qty: 0, quality_passed: true }),
      session({ id: 's2', defect_qty: 2, quality_passed: true }), // defective via defect_qty
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].quality).toBe(50); // 1 good of 2 sessions
    }
  });

  it('Performance reflects completion rate, not session count', async () => {
    dbRows.value = [
      session({ id: 's1', status: 'completed' }),
      session({ id: 's2', status: 'cancelled' }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].performance).toBe(50); // 1 completed of 2
    }
  });

  it('honours workCenterId filter by overriding the grouping key', async () => {
    dbRows.value = [
      session({ id: 's1', work_center_id: 'wc-A' }),
      session({ id: 's2', work_center_id: 'wc-B', started_at: new Date('2024-01-01T10:00:00Z'), completed_at: new Date('2024-01-01T11:00:00Z') }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ workCenterId: 'forced' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows).toHaveLength(1);
      expect(rows[0].workCenterId).toBe('forced');
      expect(rows[0].sessionCount).toBe(2);
    }
  });
});
