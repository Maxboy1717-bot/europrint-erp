/**
 * test/mes/get-sessions.handler.spec.ts
 *
 * Unit tests for GetSessionsHandler. The handler reads sessions via runQuery
 * (raw SQL) from @shared/db; we mock that module to return deterministic rows.
 */

interface Row {
  count?: number;
  id?: string;
  started_at?: Date;
}

const queueRef: { items: Array<{ rows: Row[] }> } = { items: [] };

const runQueryMock = jest.fn().mockImplementation(() => {
  const next = queueRef.items.shift();
  return Promise.resolve(next ?? { rows: [] });
});

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: runQueryMock,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetSessionsHandler } from '../../src/modules/mes/application/queries/get-sessions.handler';
import { GetSessionsQuery } from '../../src/modules/mes/application/queries/get-sessions.query';

async function build(): Promise<GetSessionsHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [GetSessionsHandler],
  }).compile();
  return module.get(GetSessionsHandler);
}

describe('GetSessionsHandler', () => {
  beforeEach(() => {
    queueRef.items = [];
    runQueryMock.mockClear();
  });

  it('returns paginated result with default page and limit when filters are empty', async () => {
    queueRef.items = [
      { rows: [{ count: 0 }] },
      { rows: [] },
    ];
    const handler = await build();

    const r = await handler.execute(new GetSessionsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
      expect(r.data.total).toBe(0);
      expect(r.data.items).toEqual([]);
    }
  });

  it('returns items when database has matching rows', async () => {
    queueRef.items = [
      { rows: [{ count: 2 }] },
      { rows: [{ id: 'a', started_at: new Date() }, { id: 'b', started_at: new Date() }] },
    ];
    const handler = await build();

    const r = await handler.execute(new GetSessionsQuery({ page: 1, limit: 10 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(2);
      expect(r.data.items).toHaveLength(2);
    }
  });

  it('honours custom page and limit values from the query', async () => {
    queueRef.items = [
      { rows: [{ count: 100 }] },
      { rows: [{ id: 'x' }] },
    ];
    const handler = await build();

    const r = await handler.execute(new GetSessionsQuery({ page: 3, limit: 25 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(3);
      expect(r.data.limit).toBe(25);
      expect(r.data.total).toBe(100);
    }
  });

  it('coerces missing count to zero when row shape is unexpected', async () => {
    queueRef.items = [
      { rows: [] },
      { rows: [] },
    ];
    const handler = await build();

    const r = await handler.execute(new GetSessionsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(0);
  });
});
