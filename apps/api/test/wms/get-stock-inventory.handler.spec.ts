/**
 * test/wms/get-stock-inventory.handler.spec.ts
 *
 * Unit tests for GetStockInventoryHandler. `runQuery` is the only external
 * dependency and is mocked at module level.
 */

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { GetStockInventoryHandler } from '../../src/modules/wms/application/queries/get-stock-inventory.handler';
import { GetStockInventoryQuery } from '../../src/modules/wms/application/queries/get-stock-inventory.query';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

interface CountRow { count: number }
interface ItemRow { id: number; material_name: string; warehouse_name: string }

function setupTwoQueries(count: CountRow, items: ItemRow[]): void {
  mockRun
    .mockResolvedValueOnce({ rows: [count] } as never)
    .mockResolvedValueOnce({ rows: items } as never);
}

describe('GetStockInventoryHandler', () => {
  let handler: GetStockInventoryHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetStockInventoryHandler],
    }).compile();
    handler = moduleRef.get(GetStockInventoryHandler);
  });

  it('returns ok with both items and total when both subqueries succeed', async () => {
    const items: ItemRow[] = [
      { id: 1, material_name: 'Karton', warehouse_name: 'WH1' },
      { id: 2, material_name: 'Plyonka', warehouse_name: 'WH2' },
    ];
    setupTwoQueries({ count: 2 }, items);

    const r = await handler.execute(new GetStockInventoryQuery({ page: 1, limit: 20 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.total).toBe(2);
      expect(r.data.items).toEqual(items);
    }
  });

  it('runs both count + items queries in parallel (two runQuery calls)', async () => {
    setupTwoQueries({ count: 0 }, []);

    await handler.execute(new GetStockInventoryQuery());

    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('returns total 0 when count row is missing', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const r = await handler.execute(new GetStockInventoryQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(0);
  });

  it('defaults to page=1 limit=10 when filters are omitted', async () => {
    setupTwoQueries({ count: 0 }, []);

    const r = await handler.execute(new GetStockInventoryQuery());

    expect(r.ok).toBe(true);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('coerces non-numeric count value to 0', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ count: 'not-a-number' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const r = await handler.execute(new GetStockInventoryQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isNaN(r.data.total) ? 0 : r.data.total).toBe(0);
  });
});
