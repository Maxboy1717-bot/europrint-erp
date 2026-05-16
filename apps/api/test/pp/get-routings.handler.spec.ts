/**
 * test/pp/get-routings.handler.spec.ts
 *
 * Unit tests for GetRoutingsHandler. Mocks `@shared/db` so the count and
 * page queries can be controlled in order.
 */

interface FakeRow { [k: string]: unknown }
let queued: FakeRow[][] = [];
function nextRows(): FakeRow[] { return queued.shift() ?? []; }

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.select = jest.fn().mockImplementation(() => chain);
  chain.from = jest.fn().mockImplementation(() => {
    // Lazy thenable: only pops queue when actually awaited (count path)
    // or when terminal .offset() is invoked (listing path).
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
  return chain;
}

jest.mock('@shared/db', () => ({
  db: makeChain(),
  routings: { createdAt: 'createdAt' },
}));

import { GetRoutingsHandler } from '../../src/modules/pp/application/queries/get-routings.handler';
import { GetRoutingsQuery } from '../../src/modules/pp/application/queries/get-routings.query';

beforeEach(() => {
  queued = [];
});

describe('GetRoutingsHandler', () => {
  it('returns empty page with total=0 when no routings exist', async () => {
    queued.push([{ count: '0' }]);
    queued.push([]);
    const handler = new GetRoutingsHandler();

    const r = await handler.execute(new GetRoutingsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(0);
      expect(r.data.items).toEqual([]);
    }
  });

  it('returns Ok with items when routings exist', async () => {
    queued.push([{ count: '3' }]);
    queued.push([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }]);
    const handler = new GetRoutingsHandler();

    const r = await handler.execute(new GetRoutingsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(3);
      expect(r.data.items).toHaveLength(3);
    }
  });

  it('uses default page=1 and limit=10 when filters do not specify them', async () => {
    queued.push([{ count: '0' }]);
    queued.push([]);
    const handler = new GetRoutingsHandler();

    const r = await handler.execute(new GetRoutingsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('respects custom page and limit in the response envelope', async () => {
    queued.push([{ count: '120' }]);
    queued.push([{ id: 'r1' }]);
    const handler = new GetRoutingsHandler();

    const r = await handler.execute(new GetRoutingsQuery({ page: 5, limit: 25 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(5);
      expect(r.data.limit).toBe(25);
      expect(r.data.total).toBe(120);
    }
  });
});
