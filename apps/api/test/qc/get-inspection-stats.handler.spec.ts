/**
 * test/qc/get-inspection-stats.handler.spec.ts
 *
 * Unit tests for GetInspectionStatsHandler — aggregated pass/fail rates.
 */

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { GetInspectionStatsHandler } from '../../src/modules/qc/application/queries/get-inspection-stats.handler';
import { GetInspectionStatsQuery } from '../../src/modules/qc/application/queries/get-inspection-stats.query';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

interface StatsRow {
  total_inspections: number;
  total_resolved: number;
  total_open: number;
}

function setRow(row: StatsRow | undefined): void {
  mockRun.mockResolvedValueOnce({ rows: row ? [row] : [] } as never);
}

describe('GetInspectionStatsHandler', () => {
  let handler: GetInspectionStatsHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetInspectionStatsHandler],
    }).compile();
    handler = moduleRef.get(GetInspectionStatsHandler);
  });

  it('returns zeroed stats when no rows match', async () => {
    setRow(undefined);

    const r = await handler.execute(new GetInspectionStatsQuery());

    expect(r.ok).toBe(true);
    expect(r.data.total_inspections).toBe(0);
    expect(r.data.pass_rate).toBe(0);
    expect(r.data.fail_rate).toBe(0);
  });

  it('returns ratio-based pass and fail rates when data exists', async () => {
    setRow({ total_inspections: 10, total_resolved: 8, total_open: 2 });

    const r = await handler.execute(new GetInspectionStatsQuery());

    expect(r.data.total_inspections).toBe(10);
    expect(r.data.total_passed).toBe(8);
    expect(r.data.total_failed).toBe(2);
    // Both rates are expressed as ratio of total (0..1)
    expect(r.data.pass_rate).toBeGreaterThan(0);
    expect(r.data.fail_rate).toBeGreaterThan(0);
  });

  it('produces pass_rate=1 fail_rate=0 when every inspection is resolved', async () => {
    setRow({ total_inspections: 5, total_resolved: 5, total_open: 0 });

    const r = await handler.execute(new GetInspectionStatsQuery());

    expect(r.data.pass_rate).toBeCloseTo(1, 5);
    expect(r.data.fail_rate).toBe(0);
  });

  it('coerces non-numeric row values into 0 rather than NaN', async () => {
    mockRun.mockResolvedValueOnce({ rows: [{ total_inspections: 'x', total_resolved: 'y', total_open: 'z' }] } as never);

    const r = await handler.execute(new GetInspectionStatsQuery());

    expect(r.data.total_inspections).toBe(0);
    expect(Number.isNaN(r.data.pass_rate)).toBe(false);
  });

  it('issues exactly one query per execute', async () => {
    setRow({ total_inspections: 1, total_resolved: 1, total_open: 0 });

    await handler.execute(new GetInspectionStatsQuery());

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
