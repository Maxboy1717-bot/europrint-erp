/**
 * test/sd/drizzle-sales-order.repo.find-items.spec.ts
 *
 * VISION-3340 #53 (2026-07-08): the "Takrorlash"/clone flow needs an order's
 * real persisted line-items, but the 360° order-detail view returns only the
 * header. Proves DrizzleSalesOrderRepository.findItemsByOrderId() reads
 * sales_order_items WHERE sales_order_id = :id ORDER BY item_number and maps the
 * live columns (product_id → productId, net_price → netPrice, ...) — copying REAL
 * rows, never fabricating (Q-40).
 *
 * Strategy: mock @shared/db (runQuery) so no real DB call is made, mirroring
 * test/sd/drizzle-sd-customers-duplicate.repo.spec.ts (same "raw SQL read"
 * shape). drizzle-orm's `sql` tag stays real — it only builds a query object.
 */

const mockRunQuery = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

import { DrizzleSalesOrderRepository } from '../../src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo';

// The drizzle `sql` tagged template's queryChunks alternate between
// {value: [text]} StringChunks and raw interpolated parameter values.
function queryText(query: { queryChunks: unknown[] }): string {
  return (query.queryChunks as Array<{ value?: string[] } | unknown>)
    .map((c) => (c as { value?: string[] })?.value?.join('') ?? '')
    .join('');
}
function rawValues(query: { queryChunks: unknown[] }): unknown[] {
  return (query.queryChunks as unknown[]).filter((c) => typeof c !== 'object' || c === null);
}

describe('DrizzleSalesOrderRepository.findItemsByOrderId (VISION-3340 #53 clone enabler)', () => {
  let repo: DrizzleSalesOrderRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DrizzleSalesOrderRepository();
  });

  it('reads sales_order_items by order id, ordered by item_number', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });

    await repo.findItemsByOrderId(77);

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    const query = mockRunQuery.mock.calls[0][0] as { queryChunks: unknown[] };
    const text = queryText(query);

    expect(text).toContain('FROM sales_order_items');
    expect(text).toContain('WHERE sales_order_id =');
    expect(text).toContain('ORDER BY item_number');

    // The order id is bound as a parameter (parametrized SQL — no interpolation).
    expect(rawValues(query)).toContain(77);
  });

  it('maps the live columns to the clone view (product_id → productId, net_price → netPrice)', async () => {
    mockRunQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          item_number: '000010',
          product_id: 42,
          material_id: null,
          material_number: 'FG-001',
          description: 'Karton quti 30x20',
          order_quantity: '150',
          unit: 'dona',
          net_price: '2500',
          total_price: '375000',
        },
      ],
    });

    const result = await repo.findItemsByOrderId(77);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      const line = result.data[0];
      expect(line.id).toBe(5);
      expect(line.itemNumber).toBe('000010');
      expect(line.productId).toBe(42);
      expect(line.materialId).toBeNull();
      expect(line.materialNumber).toBe('FG-001');
      expect(line.description).toBe('Karton quti 30x20');
      expect(line.orderQuantity).toBe(150);
      expect(line.unit).toBe('dona');
      expect(line.netPrice).toBe(2500);
      expect(line.totalPrice).toBe(375000);
    }
  });

  it('returns an empty array when the order has no line-items', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [] });

    const result = await repo.findItemsByOrderId(999);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it('returns a DB_ERROR result (never throws) when the query fails', async () => {
    mockRunQuery.mockRejectedValueOnce(new Error('connection lost'));

    const result = await repo.findItemsByOrderId(1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('DB_ERROR');
  });
});
