/**
 * test/mes/get-oee.handler.spec.ts
 *
 * Unit tests for GetOeeHandler. Mocks the @shared/db module's `db.select(...).from(...).where(...)`
 * chain to feed deterministic session rows into the handler.
 */

interface SessionRow {
  started_at: Date;
  completed_at: Date | null;
  work_center_id: string | null;
  defect_qty: number;
  quality_passed: boolean;
}

const dbRows: { value: SessionRow[] } = { value: [] };

jest.mock('@shared/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(dbRows.value),
      }),
    }),
  },
  mes_sessions: {
    started_at: { name: 'started_at' },
    work_center_id: { name: 'work_center_id' },
  },
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
  });

  it('returns Ok with empty list when no sessions match the filters', async () => {
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('groups sessions by workCenterId when filter is omitted', async () => {
    dbRows.value = [
      { started_at: new Date('2024-01-01T08:00:00Z'), completed_at: new Date('2024-01-01T09:00:00Z'), work_center_id: 'wc-A', defect_qty: 0, quality_passed: true },
      { started_at: new Date('2024-01-01T08:00:00Z'), completed_at: new Date('2024-01-01T09:00:00Z'), work_center_id: 'wc-B', defect_qty: 0, quality_passed: true },
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

  it('returns 100% OEE when every session is passed with no defects', async () => {
    dbRows.value = [
      { started_at: new Date('2024-01-01T08:00:00Z'), completed_at: new Date('2024-01-01T09:00:00Z'), work_center_id: 'wc-A', defect_qty: 0, quality_passed: true },
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].oee).toBe(100);
      expect(rows[0].quality).toBe(100);
    }
  });

  it('reports zero quality when defects equal output', async () => {
    dbRows.value = [
      { started_at: new Date('2024-01-01T08:00:00Z'), completed_at: new Date('2024-01-01T09:00:00Z'), work_center_id: 'wc-A', defect_qty: 1, quality_passed: true },
    ];
    const handler = await build();

    const r = await handler.execute(new GetOeeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      const rows = r.data as OeeRow[];
      expect(rows[0].quality).toBe(0);
      expect(rows[0].oee).toBe(0);
    }
  });

  it('honours workCenterId filter by overriding the grouping key', async () => {
    dbRows.value = [
      { started_at: new Date('2024-01-01T08:00:00Z'), completed_at: new Date('2024-01-01T09:00:00Z'), work_center_id: 'wc-A', defect_qty: 0, quality_passed: true },
      { started_at: new Date('2024-01-01T10:00:00Z'), completed_at: new Date('2024-01-01T11:00:00Z'), work_center_id: 'wc-B', defect_qty: 0, quality_passed: true },
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
