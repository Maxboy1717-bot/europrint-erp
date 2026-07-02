/**
 * Unit tests for OrdersRegistryService (Rule 22: every service needs a unit test).
 *
 * The service has no constructor dependencies — it calls `db.execute(sql...)`
 * directly against `orders_registry` (a compat shim table). `@shared/db` is
 * mocked so no real database is used; `drizzle-orm`'s `sql` tag stays real
 * (it just builds a query object, no I/O). These tests cover the service's
 * only real branching logic: the Ok/Err Result split and the defensive
 * fallbacks (`rows ?? []`, `row ?? {}`) that protect callers from malformed
 * driver responses.
 */

const mockExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: mockExecute },
}));

import { OrdersRegistryService } from '../src/modules/compatibility/orders-registry.service';

describe('OrdersRegistryService', () => {
  let svc: OrdersRegistryService;

  beforeEach(() => {
    svc = new OrdersRegistryService();
    mockExecute.mockReset();
  });

  it('class name matches expected', () => {
    expect(OrdersRegistryService.name).toBe('OrdersRegistryService');
  });

  describe('listOrders', () => {
    it('returns Ok with the rows from the query result', async () => {
      mockExecute.mockResolvedValue({
        rows: [
          { id: 1, title: 'Prikaz 1' },
          { id: 2, title: 'Prikaz 2' },
        ],
      });

      const res = await svc.listOrders();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual([
          { id: 1, title: 'Prikaz 1' },
          { id: 2, title: 'Prikaz 2' },
        ]);
      }
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('falls back to an empty array when the result has no rows property', async () => {
      mockExecute.mockResolvedValue({});

      const res = await svc.listOrders();

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([]);
    });

    it('returns Err with DB_ERROR when the query throws', async () => {
      mockExecute.mockRejectedValue(new Error('connection refused'));

      const res = await svc.listOrders();

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('DB_ERROR');
        expect(res.error.message).toBe('connection refused');
      }
    });
  });

  describe('createOrder', () => {
    it('returns Ok with the inserted row', async () => {
      const insertedRow = { id: 5, number: 'N-1', title: 'Buyruq', status: 'draft', department_ids: '[]' };
      mockExecute.mockResolvedValue({ rows: [insertedRow] });

      const res = await svc.createOrder({ title: 'Buyruq' });

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual(insertedRow);
    });

    it('falls back to an empty object when the insert returns no rows', async () => {
      mockExecute.mockResolvedValue({ rows: [] });

      const res = await svc.createOrder({ title: 'Buyruq' });

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({});
    });

    it('falls back to an empty object when the result has no rows property at all', async () => {
      mockExecute.mockResolvedValue({});

      const res = await svc.createOrder({ title: 'Buyruq' });

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({});
    });

    it('returns Err with DB_ERROR when the insert throws', async () => {
      mockExecute.mockRejectedValue(new Error('unique violation'));

      const res = await svc.createOrder({ title: 'Buyruq' });

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
    });

    it('accepts a non-array departmentIds without throwing (normalized to [] before insert)', async () => {
      mockExecute.mockResolvedValue({ rows: [{ id: 6 }] });

      const res = await svc.createOrder({
        title: 'X',
        departmentIds: 'not-an-array' as unknown as unknown[],
      });

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({ id: 6 });
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });
});
