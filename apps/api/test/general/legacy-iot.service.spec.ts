/**
 * Behavioral spec for LegacyIotService (Rule 22: every service needs a unit test).
 *
 * The service has no constructor dependencies — it calls the module-level
 * `db` singleton from `@shared/db` directly. We mock `@shared/db` so the
 * real transform/parse/fallback logic in each method can be exercised
 * without a live Postgres connection.
 */
jest.mock('../../src/shared/db', () => ({
  db: {
    execute: jest.fn(),
    select: jest.fn(),
  },
  downtime_events: {},
}));

import { LegacyIotService } from '../../src/modules/general/services/legacy-iot.service';
import { db } from '../../src/shared/db';

const mockExecute = db.execute as jest.Mock;
const mockSelect = db.select as jest.Mock;

describe('LegacyIotService', () => {
  let service: LegacyIotService;

  beforeEach(() => {
    mockExecute.mockReset();
    mockSelect.mockReset();
    service = new LegacyIotService();
  });

  it('class is defined', () => {
    expect(LegacyIotService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LegacyIotService.name).toBe('LegacyIotService');
  });

  it('is constructible without arguments', () => {
    expect(service).toBeInstanceOf(LegacyIotService);
  });

  describe('getIotDashboardStats', () => {
    it('parses equipment + OEE rows into a typed numeric summary', async () => {
      mockExecute
        .mockResolvedValueOnce({ rows: [{ total: '10', running: '6', maintenance: '2', stopped: '2' }] })
        .mockResolvedValueOnce({ rows: [{ average_oee: '87.5', average_efficiency: '92.3' }] });

      const res = await service.getIotDashboardStats();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual({
          totalEquipment: 10,
          runningCount: 6,
          maintenanceCount: 2,
          stoppedCount: 2,
          averageOee: 87.5,
          efficiency: 92.3,
        });
      }
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it('falls back to a zeroed summary (still Result.ok) when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('connection refused'));

      const res = await service.getIotDashboardStats();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual({
          totalEquipment: 0,
          runningCount: 0,
          maintenanceCount: 0,
          stoppedCount: 0,
          averageOee: 0,
          efficiency: 0,
        });
      }
    });

    it('defaults missing fields to 0 rather than NaN', async () => {
      mockExecute
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({ rows: [{}] });

      const res = await service.getIotDashboardStats();

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual({
          totalEquipment: 0,
          runningCount: 0,
          maintenanceCount: 0,
          stoppedCount: 0,
          averageOee: 0,
          efficiency: 0,
        });
      }
    });
  });

  describe('getIotProductionSessions', () => {
    it('returns the raw joined rows on success', async () => {
      const rows = [{ id: 1, equipment_name: 'Press-1' }, { id: 2, equipment_name: 'Press-2' }];
      mockExecute.mockResolvedValueOnce({ rows });

      const result = await service.getIotProductionSessions();
      expect(result).toEqual(rows);
    });

    it('returns [] when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('boom'));
      const result = await service.getIotProductionSessions();
      expect(result).toEqual([]);
    });
  });

  describe('getIotDowntimeEvents', () => {
    it('returns [] when db.select throws (Drizzle query path unavailable)', async () => {
      mockSelect.mockImplementation(() => {
        throw new Error('no connection');
      });

      const result = await service.getIotDowntimeEvents();
      expect(result).toEqual([]);
    });
  });

  describe('getIotTabletDefectReasons', () => {
    it('returns the raw joined rows on success', async () => {
      const rows = [{ code: 'D1', labelUz: 'Nuqson', labelRu: 'Дефект', stage: 'print' }];
      mockExecute.mockResolvedValueOnce({ rows });

      const result = await service.getIotTabletDefectReasons();
      expect(result).toEqual(rows);
    });

    it('does NOT swallow errors (no try/catch, unlike the sibling IoT methods)', async () => {
      mockExecute.mockRejectedValueOnce(new Error('table missing'));
      await expect(service.getIotTabletDefectReasons()).rejects.toThrow('table missing');
    });
  });

  describe('getProductionOrdersReport', () => {
    it('derives total from rows.length', async () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockExecute.mockResolvedValueOnce({ rows });

      const result = await service.getProductionOrdersReport();
      expect(result).toEqual({ orders: rows, total: 3 });
    });

    it('returns an empty report when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('boom'));
      const result = await service.getProductionOrdersReport();
      expect(result).toEqual({ orders: [], total: 0 });
    });
  });

  describe('getPpProductionOrders', () => {
    it('returns the raw rows on success', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockExecute.mockResolvedValueOnce({ rows });

      const result = await service.getPpProductionOrders();
      expect(result).toEqual(rows);
    });

    it('returns [] when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('boom'));
      const result = await service.getPpProductionOrders();
      expect(result).toEqual([]);
    });
  });

  describe('getProducts', () => {
    it('returns [] when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('boom'));
      const result = await service.getProducts();
      expect(result).toEqual([]);
    });
  });

  describe('getTechnologyCards', () => {
    it('returns [] when the query throws', async () => {
      mockExecute.mockRejectedValueOnce(new Error('boom'));
      const result = await service.getTechnologyCards();
      expect(result).toEqual([]);
    });
  });
});
