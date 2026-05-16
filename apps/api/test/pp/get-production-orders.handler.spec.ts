/**
 * test/pp/get-production-orders.handler.spec.ts
 *
 * Unit tests for GetProductionOrdersHandler. Mocks `@shared/db` and the
 * chained Drizzle query builder. The handler executes two queries: a count
 * (awaiting .where()) and a page (.where().orderBy().limit().offset()).
 */

interface FakeRow { [k: string]: unknown }
let queued: FakeRow[][] = [];

function nextRows(): FakeRow[] {
  return queued.shift() ?? [];
}

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const passthrough = jest.fn().mockImplementation(() => chain);
  chain.select = passthrough;
  chain.from = passthrough;
  return chain;
}

jest.mock('@shared/db', () => ({
  db: makeChain(),
  production_orders: {
    id: 'id', status: 'status', sales_order_id: 'sales_order_id',
    scheduled_start: 'scheduled_start', scheduled_end: 'scheduled_end',
    created_at: 'created_at',
  },
}));

import { GetProductionOrdersHandler } from '../../src/modules/pp/application/queries/get-production-orders.handler';
import { GetProductionOrdersQuery } from '../../src/modules/pp/application/queries/get-production-orders.query';
import { db } from '@shared/db';

const dbAny = db as unknown as { where: jest.Mock };

beforeEach(() => {
  queued = [];
  // .where() returns a lazy thenable. Awaiting it pops the next queued rows.
  // If the caller chains .orderBy().limit().offset(), the eventual await on
  // the offset promise pops a different queue entry. To keep behaviour
  // identical between count and listing paths, the resolver only fires on
  // first explicit `then` or chain terminal.
  dbAny.where = jest.fn().mockImplementation(() => {
    let consumed = false;
    const consume = (): FakeRow[] => {
      if (consumed) return [];
      consumed = true;
      return nextRows();
    };
    const obj: {
      then: (res: (v: FakeRow[]) => unknown) => unknown;
      orderBy: () => { limit: () => { offset: () => Promise<FakeRow[]> } };
    } = {
      then: (res) => Promise.resolve(consume()).then(res),
      orderBy: () => ({
        limit: () => ({ offset: () => Promise.resolve(nextRows()) }),
      }),
    };
    return obj;
  });
});

describe('GetProductionOrdersHandler', () => {
  it('returns empty page with total=0 when there are no orders', async () => {
    queued.push([{ count: '0' }]); // total count
    queued.push([]); // page items
    const handler = new GetProductionOrdersHandler();

    const r = await handler.execute(new GetProductionOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(0);
      expect(r.data.items).toEqual([]);
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('returns Ok with paginated orders when filters yield results', async () => {
    queued.push([{ count: '37' }]);
    queued.push([{ id: 1 }, { id: 2 }]);
    const handler = new GetProductionOrdersHandler();

    const r = await handler.execute(new GetProductionOrdersQuery({ page: 2, limit: 10 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(37);
      expect(r.data.items).toHaveLength(2);
      expect(r.data.page).toBe(2);
    }
  });

  it('applies status filter without crashing the query chain', async () => {
    queued.push([{ count: '5' }]);
    queued.push([{ id: 99, status: 'in_progress' }]);
    const handler = new GetProductionOrdersHandler();

    const r = await handler.execute(new GetProductionOrdersQuery({ status: 'in_progress' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(1);
      expect((r.data.items[0] as Record<string, unknown>).status).toBe('in_progress');
    }
  });

  it('parses non-numeric count strings to integer total', async () => {
    queued.push([{ count: 'abc' }]); // parseInt → NaN
    queued.push([]);
    const handler = new GetProductionOrdersHandler();

    const r = await handler.execute(new GetProductionOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isNaN(r.data.total) || r.data.total === 0).toBe(true);
  });
});
