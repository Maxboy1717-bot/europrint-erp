/**
 * test/wms/stock-turnover.service.spec.ts
 *
 * Unit tests for WmsCatalogStockTurnoverService. The service issues raw SQL
 * via the `@shared/db` `rawSql` helper, which is mocked here to return shaped
 * rows so the real classification / turnover-rate arithmetic can be exercised.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { WmsCatalogStockTurnoverService } from '../../src/modules/wms/application/wms-catalog/stock-turnover.service';
import { rawSql } from '@shared/db';

function rowsResult(rows: Record<string, unknown>[]) {
  return { rows: [...rows] };
}

describe('WmsCatalogStockTurnoverService', () => {
  const svc = new WmsCatalogStockTurnoverService();

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
  });

  describe('getStockBalance()', () => {
    it('classifies a material with zero stock and a min_stock as critical', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Paper', material_code: 'M-1', unit_of_measure: 'KG',
          total_qty: 0, min_stock: 10, unit_price: 100, total_value: 0 },
      ]));

      const r = await svc.getStockBalance();

      expect(r.data).toHaveLength(1);
      expect(r.data[0].status).toBe('critical');
      expect(r.summary.criticalCount).toBe(1);
      expect(r.summary.lowStockCount).toBe(0);
    });

    it('classifies a material below min_stock (but > 0) as low', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Glue', material_code: 'M-2', unit_of_measure: 'L',
          total_qty: 5, min_stock: 10, unit_price: 50, total_value: 250 },
      ]));

      const r = await svc.getStockBalance();

      expect(r.data[0].status).toBe('low');
      expect(r.summary.lowStockCount).toBe(1);
      expect(r.summary.criticalCount).toBe(0);
    });

    it('classifies a material at/above min_stock as normal', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Ink', material_code: 'M-3', unit_of_measure: 'L',
          total_qty: 20, min_stock: 10, unit_price: 10, total_value: 200 },
      ]));

      const r = await svc.getStockBalance();

      expect(r.data[0].status).toBe('normal');
      expect(r.summary.lowStockCount).toBe(0);
      expect(r.summary.criticalCount).toBe(0);
    });

    it('treats min_stock = 0 as normal even with zero quantity', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Scrap', material_code: 'M-4', unit_of_measure: 'KG',
          total_qty: 0, min_stock: 0, unit_price: 1, total_value: 0 },
      ]));

      const r = await svc.getStockBalance();

      expect(r.data[0].status).toBe('normal');
    });

    it('lowStockOnly=true filters out normal-status rows and shrinks totalMaterials', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Low', material_code: 'M-1', unit_of_measure: 'KG',
          total_qty: 2, min_stock: 10, unit_price: 10, total_value: 20 },
        { id: 2, material_name: 'Normal', material_code: 'M-2', unit_of_measure: 'KG',
          total_qty: 50, min_stock: 10, unit_price: 10, total_value: 500 },
      ]));

      const r = await svc.getStockBalance(undefined, undefined, true);

      expect(r.data).toHaveLength(1);
      expect(r.data[0].materialId).toBe('1');
      expect(r.summary.totalMaterials).toBe(1);
      // totalValue in the summary is recomputed from the filtered data set.
      expect(r.summary.totalValue).toBe(20);
    });

    it('sums totalValue across all rows when lowStockOnly is false', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'A', material_code: 'M-1', unit_of_measure: 'KG',
          total_qty: 5, min_stock: 0, unit_price: 10, total_value: 50 },
        { id: 2, material_name: 'B', material_code: 'M-2', unit_of_measure: 'KG',
          total_qty: 5, min_stock: 0, unit_price: 20, total_value: 100 },
      ]));

      const r = await svc.getStockBalance();

      expect(r.summary.totalMaterials).toBe(2);
      expect(r.summary.totalValue).toBe(150);
    });

    it('returns a safe empty fallback when the query throws', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.getStockBalance();

      expect(r).toEqual({
        data: [],
        summary: { totalMaterials: 0, totalValue: 0, lowStockCount: 0, criticalCount: 0 },
      });
    });
  });

  describe('getTurnover()', () => {
    it('derives openingStock = closingStock - totalIn + totalOut', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Paper', unit_of_measure: 'KG',
          unit_price: 10, closing_stock: 80, total_in: 100, total_out: 60 },
      ]));

      const r = await svc.getTurnover();

      // opening = 80 - 100 + 60 = 40
      expect(r.data[0].openingStock).toBe(40);
      // avgStock = (40 + 80) / 2 = 60; turnoverRate = 60 / 60 = 1
      expect(r.data[0].turnoverRate).toBe(1);
    });

    it('clamps a negative derived openingStock to 0', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'X', unit_of_measure: 'KG',
          unit_price: 1, closing_stock: 10, total_in: 100, total_out: 0 },
      ]));

      const r = await svc.getTurnover();

      // raw opening = 10 - 100 + 0 = -90 -> clamped to 0
      expect(r.data[0].openingStock).toBe(0);
    });

    it('returns turnoverRate = 0 when avgStock is 0 (no division by zero)', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, material_name: 'Empty', unit_of_measure: 'KG',
          unit_price: 1, closing_stock: 0, total_in: 0, total_out: 0 },
      ]));

      const r = await svc.getTurnover();

      expect(r.data[0].turnoverRate).toBe(0);
    });

    it('classifies materials into fastMovers (>=1) and slowMovers (0<rate<1)', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        // fast: opening = max(0, 50-100+50)=0, avg=(0+50)/2=25, rate=50/25=2
        { id: 1, material_name: 'Fast', unit_of_measure: 'KG',
          unit_price: 1, closing_stock: 50, total_in: 100, total_out: 50 },
        // slow: opening=90, closing=100, in=10, out=0 does not fit; construct rate<1 directly
        // opening = 100 - 10 + 0 = 90; avg = 95; rate = 0/95 = 0 -> not slow. Use out>0 case:
        { id: 2, material_name: 'Slow', unit_of_measure: 'KG',
          unit_price: 1, closing_stock: 100, total_in: 20, total_out: 10 },
        // idle: no movement at all -> rate 0
        { id: 3, material_name: 'Idle', unit_of_measure: 'KG',
          unit_price: 1, closing_stock: 50, total_in: 0, total_out: 0 },
      ]));

      const r = await svc.getTurnover();

      const fast = r.data.find(d => d.name === 'Fast');
      const slow = r.data.find(d => d.name === 'Slow');
      const idle = r.data.find(d => d.name === 'Idle');

      expect(fast?.turnoverRate).toBe(2);
      expect(slow && slow.turnoverRate > 0 && slow.turnoverRate < 1).toBe(true);
      expect(idle?.turnoverRate).toBe(0);

      expect(r.summary.fastMovers).toBe(1);
      expect(r.summary.slowMovers).toBe(1);
    });

    it('returns a safe empty fallback when the query throws', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.getTurnover('2026-01-01', '2026-01-31');

      expect(r).toEqual({
        data: [],
        summary: { averageTurnover: 0, fastMovers: 0, slowMovers: 0 },
      });
    });
  });

  describe('getTopMaterials()', () => {
    it('maps DB rows into the expected shape', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { material_id: 1, name: 'Paper', kod: 'M-1', value: 1000, movement: 20 },
      ]));

      const rows = await svc.getTopMaterials(10);

      expect(rows).toEqual([
        { materialId: 1, name: 'Paper', kod: 'M-1', value: 1000, movement: 20 },
      ]);
    });

    it('falls back to "—" when name is missing', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { material_id: 2, name: null, kod: 'M-2', value: 0, movement: 0 },
      ]));

      const rows = await svc.getTopMaterials(5);

      expect(rows[0].name).toBe('—');
    });

    it('returns an empty array when there are no rows', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([]));

      const rows = await svc.getTopMaterials(10);

      expect(rows).toEqual([]);
    });
  });
});
