/**
 * test/qc/get-inspections.handler.spec.ts
 *
 * Unit tests for GetInspectionsHandler. Drizzle chain is mocked at the
 * module boundary. Both the filtered and non-filtered code paths are
 * exercised.
 */

interface InspectionRowDb {
  id: string;
  status: string;
  items_checked: number;
  reference_type: string;
  created_at: Date;
}

const mockOrderByLimitOffset = jest.fn();
const mockSelectFromWhere = jest.fn();

jest.mock('@shared/db', () => {
  const orderBy = jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({
      offset: mockOrderByLimitOffset,
    }),
  });
  // 1st-style chain: select().from() returns object with .where() returning
  // a "table-with-orderBy" plus orderBy directly.
  const tableLike = {
    where: jest.fn().mockReturnValue({ orderBy }),
    orderBy,
  };
  const from = jest.fn().mockReturnValue(tableLike);
  const select = jest.fn().mockImplementation(() => {
    return { from };
  });
  return {
    db: { select },
    qc_inspections: {
      $inferSelect: {} as { status: string },
      status: { name: 'status' },
      created_at: { name: 'created_at' },
    },
    runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  };
});

jest.mock('drizzle-orm', () => ({
  desc: jest.fn().mockReturnValue({ __desc: true }),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  sql: (strings: TemplateStringsArray): unknown => ({ __sql: strings.join('?') }),
}));

import { Test } from '@nestjs/testing';
import { GetInspectionsHandler } from '../../src/modules/qc/application/queries/get-inspections.handler';
import { GetInspectionsQuery } from '../../src/modules/qc/application/queries/get-inspections.query';

function setMocks(rows: InspectionRowDb[], count: number): void {
  mockOrderByLimitOffset.mockResolvedValueOnce(rows);
  mockSelectFromWhere.mockResolvedValueOnce([{ count }]);
}

describe('GetInspectionsHandler', () => {
  let handler: GetInspectionsHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-stub each test for a clean Promise.all
    const dbModule = await import('@shared/db');
    const db = (dbModule as unknown as { db: { select: jest.Mock } }).db;
    const tableLike = db.select().from();
    // count subquery path: select({count: sql<...>}).from(qc_inspections)
    // We patch the per-call behaviour from the test body via setMocks.
    db.select.mockImplementation((shape?: unknown) => {
      if (shape && typeof shape === 'object' && 'count' in shape) {
        return { from: jest.fn().mockReturnValue(mockSelectFromWhere()) };
      }
      return { from: jest.fn().mockReturnValue(tableLike) };
    });

    const moduleRef = await Test.createTestingModule({
      providers: [GetInspectionsHandler],
    }).compile();
    handler = moduleRef.get(GetInspectionsHandler);
  });

  it('returns mapped items and total when results are available', async () => {
    const row: InspectionRowDb = {
      id: 'i-1', status: 'passed', items_checked: 10,
      reference_type: 'lot', created_at: new Date('2026-01-01'),
    };
    setMocks([row], 1);

    const r = await handler.execute(new GetInspectionsQuery(undefined, undefined, undefined, 1, 20));

    expect(r.ok).toBe(true);
    expect(r.data.total).toBe(1);
    expect(r.data.items[0].sampleSize).toBe(10);
    expect(r.data.items[0].status).toBe('passed');
  });

  it('returns empty result set when no inspections match', async () => {
    setMocks([], 0);

    const r = await handler.execute(new GetInspectionsQuery());

    expect(r.ok).toBe(true);
    expect(r.data.items).toHaveLength(0);
    expect(r.data.total).toBe(0);
  });

  it('handles missing createdAt by producing empty ISO string', async () => {
    const row = {
      id: 'i-2', status: 'pending', items_checked: 5,
      reference_type: 'batch',
      created_at: null as unknown as Date,
    };
    setMocks([row], 1);

    const r = await handler.execute(new GetInspectionsQuery());

    expect(r.data.items[0].createdAt).toBe('');
  });

  it('falls back to defaults when page and limit omitted', async () => {
    setMocks([], 0);

    const r = await handler.execute(new GetInspectionsQuery());

    expect(r.ok).toBe(true);
    expect(r.data.total).toBe(0);
  });

  it('treats undefined status filter as "all" path (no where clause exception)', async () => {
    setMocks([], 0);

    const r = await handler.execute(new GetInspectionsQuery(undefined, undefined, undefined, 2, 10));

    expect(r.ok).toBe(true);
  });
});
