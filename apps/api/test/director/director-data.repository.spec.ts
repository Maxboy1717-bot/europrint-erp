/**
 * test/director/director-data.repository.spec.ts
 *
 * VISION-3340 #12 — unit tests for `DirectorDataRepository.getCkpDeadlineComplianceRate(date)`.
 *
 * Only the NEW/CHANGED method is covered here (the repository's pre-existing
 * methods — queryDashboard/querySummary/queryProduction/... — build their own
 * Drizzle `db.select()` chains and are out of scope for this change).
 *
 * The gate decision itself (`applyCkpGate`, `apps/api/src/modules/hr/payroll/ckp-gate.ts`)
 * is intentionally NOT mocked — these tests prove the repository reuses the REAL,
 * already-tested gate rule (Q-39: one rule, one place) rather than reimplementing
 * pass/fail logic locally. Only `runQuery` (the DB touchpoint) is mocked.
 *
 * Coverage:
 *   TC-01  Fact submitted before deadline -> OPEN -> counted as PASS
 *   TC-02  No ckp_fact_values row at all (LEFT JOIN NULL) -> NO_FACT -> FAIL
 *   TC-03  Fact submitted after deadline -> DEADLINE_PASSED -> FAIL
 *   TC-04  Fact present, no deadline rule (deadline_hours NULL) -> OPEN -> PASS
 *   TC-05  Mixed population -> passCount/failCount/complianceRate aggregate correctly
 *   TC-06  No cards with a ЦКП norma configured (empty result set) -> totalCards=0,
 *          complianceRate=0 (Q-40: honest zero, not fabricated 100%)
 *   TC-07  DB failure -> Err (fail-closed), never silently reports a rate
 *   TC-08  Returned `date` echoes the input date verbatim
 */

const mockRunQuery = jest.fn();

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

import { DirectorDataRepository } from '../../src/modules/director/infrastructure/repositories/director-data.repository';

type FactRow = {
  fact_id: number | null;
  submitted_at: string | Date | null;
  deadline_hours: number | null;
};

function row(overrides: Partial<FactRow> = {}): FactRow {
  return { fact_id: null, submitted_at: null, deadline_hours: 24, ...overrides };
}

describe('DirectorDataRepository.getCkpDeadlineComplianceRate', () => {
  let repo: DirectorDataRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new DirectorDataRepository();
  });

  it('TC-01: fact submitted well before deadline -> OPEN -> PASS', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [row({ fact_id: 1, submitted_at: '2026-06-01T10:00:00.000Z', deadline_hours: 24 })],
    });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({
      date: '2026-06-01',
      totalCards: 1,
      passCount: 1,
      failCount: 0,
      complianceRate: 100,
    });
  });

  it('TC-02: no ckp_fact_values row (LEFT JOIN NULL) -> NO_FACT -> FAIL', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [row({ fact_id: null, submitted_at: null, deadline_hours: 24 })],
    });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.passCount).toBe(0);
    expect(r.data.failCount).toBe(1);
    expect(r.data.complianceRate).toBe(0);
  });

  it('TC-03: fact submitted AFTER deadline -> DEADLINE_PASSED -> FAIL', async () => {
    // factDate 2026-06-01, deadline = 2026-06-02T00:00Z + 24h = 2026-06-03T00:00Z.
    mockRunQuery.mockResolvedValueOnce({
      rows: [row({ fact_id: 2, submitted_at: '2026-06-04T00:00:00.000Z', deadline_hours: 24 })],
    });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.passCount).toBe(0);
    expect(r.data.failCount).toBe(1);
    expect(r.data.complianceRate).toBe(0);
  });

  it('TC-04: fact present, no deadline rule (deadline_hours NULL) -> OPEN -> PASS', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [row({ fact_id: 3, submitted_at: '2026-06-01T10:00:00.000Z', deadline_hours: null })],
    });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.passCount).toBe(1);
    expect(r.data.failCount).toBe(0);
    expect(r.data.complianceRate).toBe(100);
  });

  it('TC-05: mixed population aggregates pass/fail/rate correctly', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [
        row({ fact_id: 1, submitted_at: '2026-06-01T10:00:00.000Z', deadline_hours: 24 }), // PASS
        row({ fact_id: null, submitted_at: null, deadline_hours: 24 }), // FAIL (NO_FACT)
        row({ fact_id: 2, submitted_at: '2026-06-04T00:00:00.000Z', deadline_hours: 24 }), // FAIL (late)
        row({ fact_id: 3, submitted_at: '2026-06-01T12:00:00.000Z', deadline_hours: null }), // PASS
      ],
    });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.totalCards).toBe(4);
    expect(r.data.passCount).toBe(2);
    expect(r.data.failCount).toBe(2);
    expect(r.data.complianceRate).toBe(50);
  });

  it('TC-06: no ЦКП-configured cards at all -> totalCards=0, complianceRate=0 (no fabrication)', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({
      date: '2026-06-01',
      totalCards: 0,
      passCount: 0,
      failCount: 0,
      complianceRate: 0,
    });
  });

  it('TC-07: DB failure -> Err (fail-closed, never a silently-reported rate)', async () => {
    mockRunQuery.mockRejectedValueOnce(new Error('connection reset'));
    const r = await repo.getCkpDeadlineComplianceRate('2026-06-01');
    expect(r.ok).toBe(false);
  });

  it('TC-08: returned `date` echoes the requested date verbatim', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });
    const r = await repo.getCkpDeadlineComplianceRate('2026-07-08');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.date).toBe('2026-07-08');
  });
});
