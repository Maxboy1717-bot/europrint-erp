/**
 * test/wms/abc-aging-expiry.service.spec.ts
 *
 * Unit tests for WmsCatalogAbcAgingExpiryService. The service issues raw SQL
 * via the `@shared/db` `rawSql` helper, which is mocked here to return
 * shaped rows so the real classification math (ABC Pareto cut-offs, aging
 * buckets, expiry status) can be exercised with plain inputs/outputs.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { WmsCatalogAbcAgingExpiryService } from '../../src/modules/wms/application/wms-catalog/abc-aging-expiry.service';
import { rawSql } from '@shared/db';

function rowsResult(rows: Record<string, unknown>[]) {
  return { rows };
}

describe('WmsCatalogAbcAgingExpiryService', () => {
  let svc: WmsCatalogAbcAgingExpiryService;

  beforeEach(() => {
    svc = new WmsCatalogAbcAgingExpiryService();
    (rawSql as jest.Mock).mockReset();
  });

  describe('getAbcAnalysis()', () => {
    it('classifies rows into A/B/C by cumulative Pareto percentage', async () => {
      // Ordered by total_value DESC (as the real query would return):
      // 80 -> cumulative 80% => A
      // 15 -> cumulative 95% => B
      // 5  -> cumulative 100% => C
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, name: 'Paper', kod: 'M-1', total_value: 80 },
        { id: 2, name: 'Ink', kod: 'M-2', total_value: 15 },
        { id: 3, name: 'Glue', kod: 'M-3', total_value: 5 },
      ]));

      const r = await svc.getAbcAnalysis();

      expect(r.data).toHaveLength(3);
      expect(r.data[0].class).toBe('A');
      expect(r.data[0].cumulativePercentage).toBe(80);
      expect(r.data[1].class).toBe('B');
      expect(r.data[1].cumulativePercentage).toBe(95);
      expect(r.data[2].class).toBe('C');
      expect(r.data[2].cumulativePercentage).toBe(100);
      expect(r.summary).toEqual({ classA: 1, classB: 1, classC: 1 });
    });

    it('classifies as B (not A) once cumulative percentage crosses 80% by even a fraction', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, name: 'Just over 80', kod: 'M-1', total_value: 81 },
        { id: 2, name: 'Rest', kod: 'M-2', total_value: 19 },
      ]));

      const r = await svc.getAbcAnalysis();

      expect(r.data[0].cumulativePercentage).toBe(81);
      expect(r.data[0].class).toBe('B');
    });

    it('returns an empty result set (no crash on zero grand total) when there are no rows', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([]));

      const r = await svc.getAbcAnalysis();

      expect(r.data).toHaveLength(0);
      expect(r.summary).toEqual({ classA: 0, classB: 0, classC: 0 });
    });

    it('falls back to a zeroed result when the query throws (no unhandled rejection)', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.getAbcAnalysis();

      expect(r.data).toEqual([]);
      expect(r.summary).toEqual({ classA: 0, classB: 0, classC: 0 });
    });
  });

  describe('getAging()', () => {
    it('buckets rows into active/slow/obsolete against the given threshold', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, lot_number: 'L-1', material_name: 'Active mat', quantity: 10, unit_price: 100, age_days: 10 },
        { id: 2, lot_number: 'L-2', material_name: 'Slow mat', quantity: 5, unit_price: 200, age_days: 45 },
        { id: 3, lot_number: 'L-3', material_name: 'Obsolete mat', quantity: 2, unit_price: 50, age_days: 90 },
      ]));

      const r = await svc.getAging(60);

      expect(r.data[0].category).toBe('active');
      expect(r.data[1].category).toBe('slow');
      expect(r.data[2].category).toBe('obsolete');
      expect(r.data[1].value).toBe(5 * 200);
      expect(r.summary).toEqual({
        activeCount: 1, activePercent: 33,
        slowCount: 1, slowPercent: 33,
        obsoleteCount: 1, obsoletePercent: 33,
      });
    });

    it('treats exactly 30 days as active (inclusive boundary)', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, lot_number: 'L-1', material_name: 'X', quantity: 1, unit_price: 1, age_days: 30 },
      ]));

      const r = await svc.getAging(60);

      expect(r.data[0].category).toBe('active');
    });

    it('respects a custom daysThreshold for the slow/obsolete boundary', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, lot_number: 'L-1', material_name: 'X', quantity: 1, unit_price: 1, age_days: 35 },
      ]));

      // With a low threshold of 31, 35 days is already obsolete.
      const r = await svc.getAging(31);

      expect(r.data[0].category).toBe('obsolete');
    });

    it('falls back to a zeroed result when the query throws', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      const r = await svc.getAging(60);

      expect(r.data).toEqual([]);
      expect(r.summary).toEqual({
        activeCount: 0, activePercent: 0,
        slowCount: 0, slowPercent: 0,
        obsoleteCount: 0, obsoletePercent: 0,
      });
    });
  });

  describe('getExpiry()', () => {
    it('classifies rows into expired/critical/warning/ok by days remaining', async () => {
      (rawSql as jest.Mock).mockResolvedValueOnce(rowsResult([
        { id: 1, lot_number: 'B-1', material_name: 'Expired', quantity: 1, unit_price: 100, days_until_expiry: -5 },
        { id: 2, lot_number: 'B-2', material_name: 'Critical', quantity: 2, unit_price: 100, days_until_expiry: 7 },
        { id: 3, lot_number: 'B-3', material_name: 'Warning', quantity: 3, unit_price: 100, days_until_expiry: 30 },
        { id: 4, lot_number: 'B-4', material_name: 'Ok', quantity: 4, unit_price: 100, days_until_expiry: 90 },
      ]));

      const r = await svc.getExpiry(120);

      expect(r.data.map(d => d.status)).toEqual(['expired', 'critical', 'warning', 'ok']);
      expect(r.summary.totalItems).toBe(4);
      expect(r.summary.expiredCount).toBe(1);
      expect(r.summary.criticalCount).toBe(1);
      // totalAtRiskValue = everything except the 'ok' row: (1*100)+(2*100)+(3*100)
      expect(r.summary.totalAtRiskValue).toBe(600);
    });

    it('falls back to a zeroed result when the query throws', async () => {
      (rawSql as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const r = await svc.getExpiry(30);

      expect(r.data).toEqual([]);
      expect(r.summary).toEqual({ totalItems: 0, expiredCount: 0, criticalCount: 0, totalAtRiskValue: 0 });
    });
  });
});
