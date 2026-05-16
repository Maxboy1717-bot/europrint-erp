/**
 * test/pp/get-boms.handler.spec.ts
 *
 * Unit tests for GetBomsHandler. The handler bypasses repositories and uses
 * the @shared/db `runQuery` helper directly — mocked here.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { GetBomsHandler } from '../../src/modules/pp/application/queries/get-boms.handler';
import { GetBomsQuery } from '../../src/modules/pp/application/queries/get-boms.query';
import { runQuery } from '@shared/db';

const mockRunQuery = runQuery as jest.Mock;

function rowsFor(items: unknown[], count: number): jest.Mock {
  return mockRunQuery
    .mockResolvedValueOnce({ rows: [{ count }] })
    .mockResolvedValueOnce({ rows: items });
}

describe('GetBomsHandler', () => {
  beforeEach(() => {
    mockRunQuery.mockReset();
  });

  it('returns first page with defaults when no pagination filters supplied', async () => {
    rowsFor([{ id: 1, product_name: 'X' }, { id: 2, product_name: 'Y' }], 2);
    const handler = new GetBomsHandler();

    const r = await handler.execute(new GetBomsQuery({}));

    expect(r.page).toBe(1);
    expect(r.limit).toBe(10);
    expect(r.total).toBe(2);
    expect(r.items).toHaveLength(2);
  });

  it('returns total=0 and items=[] when no boms exist', async () => {
    rowsFor([], 0);
    const handler = new GetBomsHandler();

    const r = await handler.execute(new GetBomsQuery({}));

    expect(r.total).toBe(0);
    expect(r.items).toEqual([]);
  });

  it('respects supplied page and limit values in pagination math', async () => {
    rowsFor([{ id: 5 }], 100);
    const handler = new GetBomsHandler();

    const r = await handler.execute(new GetBomsQuery({ page: 3, limit: 20 }));

    expect(r.page).toBe(3);
    expect(r.limit).toBe(20);
    expect(r.total).toBe(100);
  });

  it('coerces non-numeric count rows to 0 safely', async () => {
    rowsFor([{ id: 99 }], NaN as unknown as number);
    const handler = new GetBomsHandler();

    const r = await handler.execute(new GetBomsQuery({ page: 1, limit: 10 }));

    expect(r.total).toBe(0);
    expect(r.items).toHaveLength(1);
  });
});
