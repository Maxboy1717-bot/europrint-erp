/**
 * test/wms/dashboard.service.spec.ts
 *
 * Unit tests for WmsCatalogDashboardService. The service issues raw SQL via
 * the `@shared/db` `rawSql` helper, which is mocked here to return shaped
 * rows so the aggregation/mapping/fallback logic can be verified without a
 * live database.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { WmsCatalogDashboardService } from '../../src/modules/wms/application/wms-catalog/dashboard.service';
import { rawSql } from '@shared/db';

describe('WmsCatalogDashboardService', () => {
  let svc: WmsCatalogDashboardService;

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
    svc = new WmsCatalogDashboardService();
  });

  describe('getStatsTotal()', () => {
    it('maps warehouse/material/quantity totals from the DB row', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce({
        rows: [{ total_warehouses: 3, total_materials: 120, total_quantity: '4567.5' }],
      });

      const r = await svc.getStatsTotal();

      expect(r).toEqual({
        totalWarehouses: 3,
        totalMaterials: 120,
        totalQuantity: 4567.5,
        totalBins: 0,
        utilization: 0,
      });
    });

    it('defaults to zero when the query returns no rows', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const r = await svc.getStatsTotal();

      expect(r).toEqual({
        totalWarehouses: 0,
        totalMaterials: 0,
        totalQuantity: 0,
        totalBins: 0,
        utilization: 0,
      });
    });

    it('returns the safe fallback shape when the query throws', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('db down'));

      const r = await svc.getStatsTotal();

      // Note: the catch-branch fallback intentionally omits totalMaterials/
      // totalQuantity (unlike the success path) — this locks that contract.
      expect(r).toEqual({ totalWarehouses: 0, totalBins: 0, utilization: 0 });
    });
  });

  describe('getDashboardKpis()', () => {
    it('aggregates all four sub-queries when they all succeed', async () => {
      (rawSql as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_materials: 10, total_value: 500000 }] }) // material_cards
        .mockResolvedValueOnce({ rows: [{ cnt: 2 }] }) // pending goods_receipts
        .mockResolvedValueOnce({ rows: [{ cnt: 3 }] }) // warehouse_transfers (primary, succeeds)
        .mockResolvedValueOnce({ rows: [{ cnt: 1 }] }); // low-stock count

      const r = await svc.getDashboardKpis();

      expect(r).toEqual({
        totalMaterials: 10,
        totalValue: 500000,
        lowStockCount: 1,
        pendingReceipts: 2,
        pendingTransfers: 3,
        overdueReservations: 0,
      });
    });

    it('falls back to stock_transfers when warehouse_transfers query fails', async () => {
      (rawSql as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total_materials: 5, total_value: 1000 }] }) // material_cards
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // pending goods_receipts
        .mockRejectedValueOnce(new Error('relation "warehouse_transfers" does not exist')) // primary fails
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // low-stock count
        .mockResolvedValueOnce({ rows: [{ cnt: 7 }] }); // stock_transfers fallback

      const r = await svc.getDashboardKpis();

      expect(r.pendingTransfers).toBe(7);
    });

    it('returns the zeroed fallback shape when every sub-query rejects', async () => {
      (rawSql as jest.Mock).mockRejectedValue(new Error('db down'));

      const r = await svc.getDashboardKpis();

      expect(r).toEqual({
        totalMaterials: 0,
        totalValue: 0,
        lowStockCount: 0,
        pendingReceipts: 0,
        pendingTransfers: 0,
        overdueReservations: 0,
      });
    });
  });

  describe('getMovementSummary()', () => {
    it('computes netChange = totalIn - totalOut for the default (day) period', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce({
        rows: [{ total_in: '100', total_out: '40', transaction_count: 5 }],
      });

      const r = await svc.getMovementSummary();

      expect(r).toEqual({ totalIn: 100, totalOut: 40, netChange: 60, transactionCount: 5 });
    });

    it('supports a negative netChange when outbound exceeds inbound (week period)', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce({
        rows: [{ total_in: 10, total_out: 30, transaction_count: 2 }],
      });

      const r = await svc.getMovementSummary('week');

      expect(r.netChange).toBe(-20);
      expect(r.transactionCount).toBe(2);
    });

    it('returns a zeroed summary when the query rejects', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      const r = await svc.getMovementSummary();

      expect(r).toEqual({ totalIn: 0, totalOut: 0, netChange: 0, transactionCount: 0 });
    });
  });

  describe('getDashboardAlerts()', () => {
    it('maps low-stock rows and counts expiry/QC alerts', async () => {
      (rawSql as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { id: 1, name: 'Karton', kod: 'K-001', current_stock: '5', min_stock: '20' },
          ],
        }) // low stock
        .mockResolvedValueOnce({ rows: [{ cnt: 4 }] }) // expiring batches
        .mockResolvedValueOnce({ rows: [{ cnt: 2 }] }); // pending QC

      const r = await svc.getDashboardAlerts();

      expect(r.lowStock).toEqual([
        { id: 1, name: 'Karton', kod: 'K-001', currentStock: 5, minStock: 20 },
      ]);
      expect(r.lowStockCount).toBe(1);
      expect(r.expiringBatches).toBe(4);
      expect(r.pendingQC).toBe(2);
      expect(r.overdueTasks).toBe(0);
    });

    it('falls back to "—" name when the material name is missing', async () => {
      (rawSql as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 2, name: null, kod: null, current_stock: null, min_stock: null }],
        })
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] })
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] });

      const r = await svc.getDashboardAlerts();

      expect(r.lowStock[0]).toEqual({ id: 2, name: '—', kod: '', currentStock: 0, minStock: 0 });
    });

    it('returns the empty fallback shape when every sub-query rejects', async () => {
      (rawSql as jest.Mock).mockRejectedValue(new Error('down'));

      const r = await svc.getDashboardAlerts();

      expect(r).toEqual({
        lowStock: [],
        lowStockCount: 0,
        pendingQC: 0,
        expiringBatches: 0,
        overdueTasks: 0,
      });
    });
  });
});
