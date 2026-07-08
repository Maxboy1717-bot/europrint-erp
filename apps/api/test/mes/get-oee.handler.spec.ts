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
 *
 * VISION-3340 #46 — 4-level cascade coverage:
 *   groupBy 'machine' (default) — legacy per-work-center behavior (unchanged).
 *   groupBy 'shift'             — keyed by production_sessions.shift_id via the
 *                                 mes_production_sessions VIEW binding; NULL
 *                                 shift_id rows are skipped (owner-DATA gap → []).
 *   groupBy 'shop'              — keyed by work_centers.org_department_id; work
 *                                 centers without a KARTA link are skipped.
 *   groupBy 'brigade'           — Err(NOT_IMPLEMENTED): no crew/brigade column
 *                                 exists in the schema (blocked-on-missing-column).
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

interface ProdSessionRow {
  id: number;
  shiftId: number | null;
  status: string | null;
  defectQty: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

interface WorkCenterRow {
  id: number;
  orgDepartmentId: number | null;
}

const dbRows: { value: SessionRow[] } = { value: [] };
const downtimeRows: { value: DowntimeRow[] } = { value: [] };
const prodSessionRows: { value: ProdSessionRow[] } = { value: [] };
const workCenterRows: { value: WorkCenterRow[] } = { value: [] };

jest.mock('@shared/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        // mes_sessions / mes_production_sessions queries use .where();
        // downtime_events and work_centers (shop lookup) do not.
        if (table === 'downtime_events') {
          return Promise.resolve(downtimeRows.value);
        }
        if (table === 'pp_work_centers') {
          return Promise.resolve(workCenterRows.value);
        }
        if (table === 'mes_production_sessions') {
          return { where: () => Promise.resolve(prodSessionRows.value) };
        }
        return {
          where: () => Promise.resolve(dbRows.value),
        };
      },
    }),
  },
  mes_sessions: 'mes_sessions',
  downtime_events: 'downtime_events',
  mes_production_sessions: 'mes_production_sessions',
  ppWorkCenters: 'pp_work_centers',
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

function prodSession(over: Partial<ProdSessionRow>): ProdSessionRow {
  return {
    id: 1,
    shiftId: 1,
    status: 'completed',
    defectQty: '0',
    startTime: new Date('2024-01-01T08:00:00Z'),
    endTime: new Date('2024-01-01T09:00:00Z'),
    ...over,
  };
}

describe('GetOeeHandler', () => {
  beforeEach(() => {
    dbRows.value = [];
    downtimeRows.value = [];
    prodSessionRows.value = [];
    workCenterRows.value = [];
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

  // ── VISION-3340 #46: 4-level cascade ───────────────────────────────────────

  it('default groupBy is machine — rows are tagged groupBy/groupKey additively', async () => {
    dbRows.value = [session({ id: 's1', work_center_id: 'wc-A' })];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as Array<OeeRow & { groupBy: string; groupKey: string }>;
      expect(rows[0].groupBy).toBe('machine');
      expect(rows[0].groupKey).toBe('wc-A');
      expect(rows[0].workCenterId).toBe('wc-A'); // legacy field name preserved (Q-39)
    }
  });

  it('groupBy shift: aggregates production_sessions keyed by shift_id with the SAME OEE math', async () => {
    prodSessionRows.value = [
      // Shift 1: one clean completed hour + one cancelled defective hour.
      prodSession({ id: 1, shiftId: 1 }),
      prodSession({ id: 2, shiftId: 1, status: 'cancelled', defectQty: '3', startTime: new Date('2024-01-01T09:00:00Z'), endTime: new Date('2024-01-01T10:00:00Z') }),
      // Shift 2: one clean completed hour.
      prodSession({ id: 3, shiftId: 2 }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'shift' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as Array<{ shiftId: string; groupBy: string; performance: number; quality: number; oee: number; sessionCount: number; availability: number }>;
      expect(rows).toHaveLength(2);
      const shift1 = rows.find((x) => x.shiftId === '1');
      const shift2 = rows.find((x) => x.shiftId === '2');
      expect(shift1).toBeDefined();
      expect(shift2).toBeDefined();
      if (!shift1 || !shift2) return;
      expect(shift1.groupBy).toBe('shift');
      expect(shift1.sessionCount).toBe(2);
      expect(shift1.availability).toBe(100); // no downtime recorded
      expect(shift1.performance).toBe(50);   // 1 completed of 2
      expect(shift1.quality).toBe(50);       // 1 defect-free of 2
      expect(shift1.oee).toBe(25);           // 1 × 0.5 × 0.5
      expect(shift2.oee).toBe(100);
    }
  });

  it('groupBy shift: unplanned downtime keyed by production-session id drags Availability', async () => {
    prodSessionRows.value = [prodSession({ id: 7, shiftId: 1 })]; // 60-min span
    downtimeRows.value = [
      { sessionId: '7', durationMin: '30', durationMinutes: null, startedAt: null, endedAt: null },
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'shift' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as Array<{ availability: number; downtimeMinutes: number; runMinutes: number }>;
      expect(rows[0].downtimeMinutes).toBe(30);
      expect(rows[0].runMinutes).toBe(30);
      expect(rows[0].availability).toBe(50);
    }
  });

  it('groupBy shift: NULL shift_id rows are skipped → [] until owner data is populated', async () => {
    prodSessionRows.value = [
      prodSession({ id: 1, shiftId: null }),
      prodSession({ id: 2, shiftId: null }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'shift' }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('groupBy shop: merges work centers sharing an org_department_id into one shop row', async () => {
    workCenterRows.value = [
      { id: 1, orgDepartmentId: 77 },
      { id: 2, orgDepartmentId: 77 },
      { id: 3, orgDepartmentId: 88 },
    ];
    dbRows.value = [
      session({ id: 's1', work_center_id: '1' }),
      session({ id: 's2', work_center_id: '2', status: 'cancelled', started_at: new Date('2024-01-01T09:00:00Z'), completed_at: new Date('2024-01-01T10:00:00Z') }),
      session({ id: 's3', work_center_id: '3' }),
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'shop' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as Array<{ orgDepartmentId: string; groupBy: string; sessionCount: number; performance: number }>;
      expect(rows).toHaveLength(2);
      const shop77 = rows.find((x) => x.orgDepartmentId === '77');
      const shop88 = rows.find((x) => x.orgDepartmentId === '88');
      expect(shop77).toBeDefined();
      expect(shop88).toBeDefined();
      if (!shop77 || !shop88) return;
      expect(shop77.groupBy).toBe('shop');
      expect(shop77.sessionCount).toBe(2);   // wc 1 + wc 2 cascade up into dept 77
      expect(shop77.performance).toBe(50);   // 1 completed of 2
      expect(shop88.sessionCount).toBe(1);
    }
  });

  it('groupBy shop: sessions on work centers without a KARTA link are skipped → [] (owner-DATA gap)', async () => {
    workCenterRows.value = [{ id: 1, orgDepartmentId: null }];
    dbRows.value = [
      session({ id: 's1', work_center_id: '1' }),      // wc exists but not linked
      session({ id: 's2', work_center_id: 'ghost' }),  // wc unknown entirely
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'shop' }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('groupBy brigade: honest Err(NOT_IMPLEMENTED) — no crew/brigade column in the schema', async () => {
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'brigade' }));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('NOT_IMPLEMENTED');
      expect(r.error.message).toContain('brigada');
    }
  });

  it('rejects an unknown groupBy value with a VALIDATION error (Zod-guarded)', async () => {
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({ groupBy: 'bogus' as never }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });
});
