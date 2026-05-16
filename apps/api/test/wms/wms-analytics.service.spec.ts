/**
 * test/wms/wms-analytics.service.spec.ts
 *
 * Unit tests for WmsAnalyticsService. The service issues raw SQL via the
 * `@shared/db` `runQuery` helper, which is mocked here to return shaped rows.
 */

jest.mock('@shared/db', () => {
  const arr: Record<string, unknown>[] = [];
  return {
    __esModule: true,
    runQuery: jest.fn().mockResolvedValue(Object.assign(arr, { rows: arr })),
  };
});

import { WmsAnalyticsService } from '../../src/modules/wms/application/wms-analytics.service';
import { runQuery } from '@shared/db';

function rowsResult(rows: Record<string, unknown>[]) {
  return Object.assign([...rows], { rows: [...rows] });
}

describe('WmsAnalyticsService', () => {
  const svc = new WmsAnalyticsService();

  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
  });

  describe('getInventoryTurnover()', () => {
    it('returns mapped items from DB rows', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 1, material_name: 'Paper',
          unit_of_measure: 'KG',
          annual_cogs: 1_000_000, avg_inventory_value: 200_000,
          category: 'Raw', abc_segment: 'A',
        },
      ]));

      const r = await svc.getInventoryTurnover();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toHaveLength(1);
        expect(r.data[0].materialId).toBe(1);
        expect(r.data[0].inventoryTurnover).toBe(5);
      }
    });

    it('computes DIO = 365 / turnover', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 1, material_name: 'X',
          annual_cogs: 1_000_000, avg_inventory_value: 100_000,
          category: 'Cat', abc_segment: 'B',
        },
      ]));

      const r = await svc.getInventoryTurnover();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0].inventoryTurnover).toBe(10);
        expect(r.data[0].daysInventoryOutstanding).toBe(36.5);
      }
    });

    it('returns empty array when DB returns no rows', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([]));

      const r = await svc.getInventoryTurnover();

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(0);
    });

    it('returns failure when runQuery throws', async () => {
      (runQuery as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const r = await svc.getInventoryTurnover();

      expect(r.ok).toBe(false);
    });

    it('defaults inventory turnover to 0 when avg inventory is 0', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 1, material_name: 'X',
          annual_cogs: 100, avg_inventory_value: 0,
          category: '', abc_segment: 'C',
        },
      ]));

      const r = await svc.getInventoryTurnover();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0].inventoryTurnover).toBe(0);
        expect(r.data[0].daysInventoryOutstanding).toBe(365);
      }
    });
  });

  describe('getDeadStock()', () => {
    it('maps fields and parses dates', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 9, material_name: 'OldStock',
          unit_of_measure: 'EA',
          qty_on_hand: 50, unit_cost: 1000,
          total_value: 50_000,
          last_movement_date: '2024-01-01',
          days_since: 365,
        },
      ]));

      const r = await svc.getDeadStock();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0].lastMovementDate).toBe('2024-01-01');
        expect(r.data[0].daysSinceMovement).toBe(365);
      }
    });

    it('returns failure on DB error', async () => {
      (runQuery as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      const r = await svc.getDeadStock();

      expect(r.ok).toBe(false);
    });

    it('handles null lastMovementDate as null', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 9, material_name: 'X', unit_of_measure: 'KG',
          qty_on_hand: 10, unit_cost: 50, total_value: 500,
          last_movement_date: null, days_since: 200,
        },
      ]));

      const r = await svc.getDeadStock();

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data[0].lastMovementDate).toBeNull();
    });
  });

  describe('getRopAlerts()', () => {
    it('returns mapped alerts with deficit field', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 1, material_code: 'M-1', material_name: 'Paper',
          unit_of_measure: 'KG', on_hand: 10, rop: 50, shortage: 40,
          has_open_requisition: false, requisition_id: null, requisition_status: null,
        },
      ]));

      const r = await svc.getRopAlerts();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0].deficit).toBe(40);
        expect(r.data[0].hasOpenRequisition).toBe(false);
      }
    });

    it('returns failure on DB error', async () => {
      (runQuery as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const r = await svc.getRopAlerts();

      expect(r.ok).toBe(false);
    });

    it('extracts requisition id when present', async () => {
      (runQuery as jest.Mock).mockResolvedValueOnce(rowsResult([
        {
          material_id: 2, material_code: 'M-2', material_name: 'Ink',
          unit_of_measure: 'L', on_hand: 5, rop: 20, shortage: 15,
          has_open_requisition: true, requisition_id: 77, requisition_status: 'pending',
        },
      ]));

      const r = await svc.getRopAlerts();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data[0].requisitionId).toBe(77);
        expect(r.data[0].requisitionStatus).toBe('pending');
      }
    });
  });
});
