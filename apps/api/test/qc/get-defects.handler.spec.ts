/**
 * test/qc/get-defects.handler.spec.ts
 *
 * Unit tests for GetDefectsHandler — paginated defect listing.
 */

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { GetDefectsHandler } from '../../src/modules/qc/application/queries/get-defects.handler';
import { GetDefectsQuery } from '../../src/modules/qc/application/queries/get-defects.query';
import {
  DefectSeverity,
  DefectStatus,
} from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

interface DefectRow {
  id: string;
  defect_type: string;
  severity: string;
  is_resolved: boolean;
}

function setup(count: number, rows: DefectRow[]): void {
  mockRun
    .mockResolvedValueOnce({ rows: [{ count }] } as never)
    .mockResolvedValueOnce({ rows } as never);
}

describe('GetDefectsHandler', () => {
  let handler: GetDefectsHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetDefectsHandler],
    }).compile();
    handler = moduleRef.get(GetDefectsHandler);
  });

  it('returns ok with rows when count and items both succeed', async () => {
    const rows: DefectRow[] = [
      { id: 'd1', defect_type: 'crease', severity: 'minor', is_resolved: false },
    ];
    setup(1, rows);

    const r = await handler.execute(new GetDefectsQuery(DefectSeverity.MINOR, DefectStatus.OPEN));

    expect(r.ok).toBe(true);
    expect(r.data.data).toEqual(rows);
    expect(r.data.pagination.total).toBe(1);
  });

  it('computes totalPages by ceiling division of total/limit', async () => {
    setup(45, []);

    const r = await handler.execute(new GetDefectsQuery(undefined, undefined, undefined, undefined, undefined, 1, 20));

    expect(r.data.pagination.totalPages).toBe(Math.ceil(45 / 20));
  });

  it('returns empty data when no defects exist', async () => {
    setup(0, []);

    const r = await handler.execute(new GetDefectsQuery());

    expect(r.ok).toBe(true);
    expect(r.data.data).toHaveLength(0);
    expect(r.data.pagination.total).toBe(0);
    expect(r.data.pagination.totalPages).toBe(0);
  });

  it('uses defaults page=1 limit=20 when omitted by caller', async () => {
    setup(0, []);

    const r = await handler.execute(new GetDefectsQuery());

    expect(r.data.pagination.page).toBe(1);
    expect(r.data.pagination.limit).toBe(20);
  });

  it('issues exactly two database queries (count + page)', async () => {
    setup(0, []);

    await handler.execute(new GetDefectsQuery());

    expect(mockRun).toHaveBeenCalledTimes(2);
  });
});
