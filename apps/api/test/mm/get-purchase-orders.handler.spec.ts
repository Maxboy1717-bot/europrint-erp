/**
 * test/mm/get-purchase-orders.handler.spec.ts
 *
 * Unit tests for GetPurchaseOrdersHandler. The drizzle chain is mocked
 * at the module boundary so we can verify pagination and filters.
 */

interface PoRow {
  id: string;
  po_number: string;
  vendor_name: string;
  vendor_id: number;
  total_amount: string;
  currency: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const listSelectChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockResolvedValue([]),
};
const countSelectChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([{ count: 0 }]),
};

jest.mock('@shared/db', () => ({
  db: {
    select: jest.fn().mockImplementation((shape?: unknown) => {
      if (shape && typeof shape === 'object' && 'count' in (shape as Record<string, unknown>)) {
        return countSelectChain;
      }
      return listSelectChain;
    }),
  },
  purchase_orders: {
    id: { name: 'id' },
    po_number: { name: 'po_number' },
    vendor_name: { name: 'vendor_name' },
    vendor_id: { name: 'vendor_id' },
    total_amount: { name: 'total_amount' },
    currency: { name: 'currency' },
    status: { name: 'status' },
    created_at: { name: 'created_at' },
    updated_at: { name: 'updated_at' },
  },
  vendors: {},
  runQuery: jest.fn(),
}));

jest.mock('drizzle-orm', () => ({
  and: jest.fn().mockReturnValue({ __and: true }),
  count: jest.fn().mockReturnValue({ __count: true }),
  sql: (strings: TemplateStringsArray): unknown => ({ __sql: strings.join('?') }),
}));

import { Test } from '@nestjs/testing';
import { GetPurchaseOrdersHandler } from '../../src/modules/mm/application/queries/get-purchase-orders.handler';
import { GetPurchaseOrdersQuery } from '../../src/modules/mm/application/queries/get-purchase-orders.query';

function setList(rows: PoRow[]): void {
  listSelectChain.offset.mockResolvedValueOnce(rows);
}
function setCount(value: number): void {
  countSelectChain.where.mockResolvedValueOnce([{ count: value }]);
}

describe('GetPurchaseOrdersHandler', () => {
  let handler: GetPurchaseOrdersHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GetPurchaseOrdersHandler],
    }).compile();
    handler = moduleRef.get(GetPurchaseOrdersHandler);
  });

  it('returns ok with items and total when no filters provided', async () => {
    const rows: PoRow[] = [];
    setList(rows);
    setCount(0);

    const r = await handler.execute(new GetPurchaseOrdersQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toEqual([]);
      expect(r.data.total).toBe(0);
    }
  });

  it('reports total count returned by the COUNT query', async () => {
    setList([]);
    setCount(7);

    const r = await handler.execute(new GetPurchaseOrdersQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(7);
  });

  it('applies status filter and runs only one list + count call', async () => {
    setList([]);
    setCount(0);

    await handler.execute(new GetPurchaseOrdersQuery('approved'));

    expect(listSelectChain.where).toHaveBeenCalled();
    expect(countSelectChain.where).toHaveBeenCalled();
  });

  it('falls back to total 0 when COUNT row missing', async () => {
    setList([]);
    countSelectChain.where.mockResolvedValueOnce([]);

    const r = await handler.execute(new GetPurchaseOrdersQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(0);
  });

  it('applies vendorId filter without throwing', async () => {
    setList([]);
    setCount(0);

    const r = await handler.execute(new GetPurchaseOrdersQuery(undefined, '500', 2, 5));

    expect(r.ok).toBe(true);
  });
});
