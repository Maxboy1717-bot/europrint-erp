/**
 * test/remaining/company-state.repository.spec.ts
 *
 * Unit tests for CompanyStateRepository.getOperationsMetrics() — the
 * director-level query that surfaces real downtime_events + mes_telemetry
 * data (both had live rows but nothing at director level consumed them
 * before this fix). `runQuery` is mocked (Rule: repo unit tests mock `db`).
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

import { CompanyStateRepository } from '../../src/modules/remaining/company-state.repository';

describe('CompanyStateRepository.getOperationsMetrics', () => {
  let repo: CompanyStateRepository;

  beforeEach(() => {
    kit.reset();
    repo = new CompanyStateRepository();
  });

  it('returns Ok with real downtime + telemetry figures when rows exist', async () => {
    kit.runQuery.mockResolvedValueOnce({
      rows: [
        { events: '2', minutes_total: '30', avg_availability: '80.025', avg_performance: '78.825' },
      ],
    });

    const r = await repo.getOperationsMetrics();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.downtimeEventsCount).toBe(2);
      expect(r.data.downtimeMinutesTotal).toBe(30);
      expect(r.data.downtimeMinutesAvg).toBe(15);
      expect(r.data.machineAvailabilityPct).toBeCloseTo(80.025);
      expect(r.data.machinePerformancePct).toBeCloseTo(78.825);
    }
  });

  it('returns finite zeros (never NaN) when both tables are empty', async () => {
    kit.runQuery.mockResolvedValueOnce({
      rows: [
        { events: '0', minutes_total: '0', avg_availability: null, avg_performance: null },
      ],
    });

    const r = await repo.getOperationsMetrics();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.downtimeEventsCount).toBe(0);
      expect(r.data.downtimeMinutesTotal).toBe(0);
      expect(r.data.downtimeMinutesAvg).toBe(0);
      expect(r.data.machineAvailabilityPct).toBe(0);
      expect(r.data.machinePerformancePct).toBe(0);
      Object.values(r.data).forEach((v) => expect(Number.isFinite(v)).toBe(true));
    }
  });

  it('returns Ok with zeros when the query yields no row at all', async () => {
    kit.runQuery.mockResolvedValueOnce({ rows: [] });

    const r = await repo.getOperationsMetrics();

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.downtimeEventsCount).toBe(0);
      expect(r.data.downtimeMinutesAvg).toBe(0);
    }
  });

  it('returns Err on DB failure', async () => {
    kit.runQuery.mockRejectedValueOnce(new Error('connection lost'));

    const r = await repo.getOperationsMetrics();

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('connection lost');
  });
});
