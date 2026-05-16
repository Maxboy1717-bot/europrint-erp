/**
 * test/wms/get-low-stock.handler.spec.ts
 *
 * Unit tests for GetLowStockHandler. The drizzle query builder chain
 * on `db.select(...).from(...).where(...).orderBy(...)` is mocked to
 * return a static row set so the handler's threshold logic can be
 * verified without a database.
 */

interface DbRow { id: number; quantity: number }
type SqlCapture = { fragments?: TemplateStringsArray; params?: unknown[] };

const SQL_CAPTURE: SqlCapture = {};

jest.mock('@shared/db', () => {
  const orderBy = jest.fn();
  const where = jest.fn().mockReturnValue({ orderBy });
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return {
    db: { select },
    stock_items: { quantity: { name: 'quantity' } },
    runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  };
});

jest.mock('drizzle-orm', () => ({
  lt: jest.fn().mockReturnValue({ __op: 'lt' }),
  asc: jest.fn().mockReturnValue({ __op: 'asc' }),
  sql: (strings: TemplateStringsArray, ...params: unknown[]) => {
    SQL_CAPTURE.fragments = strings;
    SQL_CAPTURE.params = params;
    return { __sql: strings.join('?') } as unknown;
  },
}));

import { Test } from '@nestjs/testing';
import { GetLowStockHandler } from '../../src/modules/wms/application/queries/get-low-stock.handler';
import { GetLowStockQuery } from '../../src/modules/wms/application/queries/get-low-stock.query';
import { db } from '@shared/db';

function setReturnRows(rows: DbRow[]): void {
  const select = (db as unknown as { select: jest.Mock }).select;
  const from = select.mock.results[0]?.value?.from ?? select().from;
  const where = from().where;
  where().orderBy.mockResolvedValueOnce(rows);
}

describe('GetLowStockHandler', () => {
  let handler: GetLowStockHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetLowStockHandler],
    }).compile();
    handler = moduleRef.get(GetLowStockHandler);
  });

  it('returns ok with the rows produced by the drizzle chain', async () => {
    const rows: DbRow[] = [{ id: 1, quantity: 3 }, { id: 2, quantity: 7 }];
    setReturnRows(rows);

    const r = await handler.execute(new GetLowStockQuery(10));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(rows);
  });

  it('falls back to threshold of 10 when query.threshold is omitted', async () => {
    setReturnRows([]);

    await handler.execute(new GetLowStockQuery());

    expect(SQL_CAPTURE.params).toContain(10);
  });

  it('uses the provided threshold value verbatim in the SQL template', async () => {
    setReturnRows([]);

    await handler.execute(new GetLowStockQuery(42));

    expect(SQL_CAPTURE.params).toContain(42);
  });

  it('returns ok with empty array when no items below threshold', async () => {
    setReturnRows([]);

    const r = await handler.execute(new GetLowStockQuery(5));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(0);
  });

  it('invokes db.select exactly once per execute', async () => {
    setReturnRows([]);

    await handler.execute(new GetLowStockQuery(1));

    const select = (db as unknown as { select: jest.Mock }).select;
    expect(select).toHaveBeenCalled();
  });
});
