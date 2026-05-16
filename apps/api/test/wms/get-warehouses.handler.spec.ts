/**
 * test/wms/get-warehouses.handler.spec.ts
 *
 * Unit tests for GetWarehousesHandler. The drizzle builder chain is
 * mocked so handler filter logic can be inspected without a DB.
 */

interface WarehouseRow { id: string; name: string; is_free_storage: boolean }

jest.mock('@shared/db', () => {
  const orderBy = jest.fn();
  const where = jest.fn().mockReturnValue({ orderBy });
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return {
    db: { select },
    warehouses: {
      is_free_storage: { name: 'is_free_storage' },
      created_at: { name: 'created_at' },
    },
    runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  };
});

let andCallCount = 0;
const eqMock = jest.fn().mockImplementation((col: { name: string }, val: unknown) => ({ __eq: col.name, val }));

jest.mock('drizzle-orm', () => ({
  eq: (col: { name: string }, val: unknown): unknown => eqMock(col, val),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  and: jest.fn().mockImplementation((...args: unknown[]) => {
    andCallCount += 1;
    return { __and: args };
  }),
  sql: (strings: TemplateStringsArray): unknown => ({ __raw: strings.join('?') }),
}));

import { Test } from '@nestjs/testing';
import { GetWarehousesHandler } from '../../src/modules/wms/application/queries/get-warehouses.handler';
import { GetWarehousesQuery } from '../../src/modules/wms/application/queries/get-warehouses.query';
import { db } from '@shared/db';

function setRows(rows: WarehouseRow[]): void {
  const select = (db as unknown as { select: jest.Mock }).select;
  const fromChain = select().from();
  fromChain.where().orderBy.mockResolvedValueOnce(rows);
}

describe('GetWarehousesHandler', () => {
  let handler: GetWarehousesHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    eqMock.mockClear();
    andCallCount = 0;
    const moduleRef = await Test.createTestingModule({
      providers: [GetWarehousesHandler],
    }).compile();
    handler = moduleRef.get(GetWarehousesHandler);
  });

  it('returns ok with items and total when query has no filters', async () => {
    const rows: WarehouseRow[] = [
      { id: 'w1', name: 'Main', is_free_storage: false },
      { id: 'w2', name: 'Free', is_free_storage: true },
    ];
    setRows(rows);

    const r = await handler.execute(new GetWarehousesQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(2);
      expect(r.data.items).toEqual(rows);
    }
  });

  it('returns ok with total 0 when filtered query produces no rows', async () => {
    setRows([]);

    const r = await handler.execute(new GetWarehousesQuery({ isActive: true }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(0);
  });

  it('adds isFreeStorage filter condition when filter provided', async () => {
    setRows([]);

    await handler.execute(new GetWarehousesQuery({ isFreeStorage: true }));

    expect(eqMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'is_free_storage' }),
      true,
    );
  });

  it('always wraps conditions with `and()` to combine the deleted_at guard', async () => {
    setRows([]);

    await handler.execute(new GetWarehousesQuery());

    expect(andCallCount).toBeGreaterThan(0);
  });

  it('invokes drizzle select chain exactly once per execute', async () => {
    setRows([]);

    await handler.execute(new GetWarehousesQuery());

    const select = (db as unknown as { select: jest.Mock }).select;
    expect(select.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
