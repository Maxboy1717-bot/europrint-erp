/**
 * test/wms/inventory-advanced.service.spec.ts
 *
 * Unit tests for InventoryAdvancedService. The service wraps
 * InventoryAdvancedRepository (mocked here) and applies real mapping logic:
 *   - getAnalytics(): converts raw (possibly string / missing) DB fields into
 *     camelCase numbers, defaulting anything non-numeric to 0, and falls back
 *     to an all-zero shape when the repository call fails (never throws).
 *   - getCounts() / getBarcodeAssignments(): fall back to an empty page on
 *     repository failure and derive `total` from the returned page length
 *     (not from any repo-reported total).
 */

import { InventoryAdvancedService } from '../../src/modules/wms/application/inventory-advanced.service';
import type { InventoryAdvancedRepository } from '../../src/modules/wms/infrastructure/inventory-advanced.repo';

function makeRepo(overrides: Partial<InventoryAdvancedRepository> = {}): InventoryAdvancedRepository {
  return {
    getAnalytics: jest.fn(),
    findCounts: jest.fn(),
    getBarcodeAssignments: jest.fn(),
    ...overrides,
  } as unknown as InventoryAdvancedRepository;
}

describe('InventoryAdvancedService', () => {
  describe('getAnalytics()', () => {
    it('maps raw string DB fields into camelCase numbers', async () => {
      const repo = makeRepo({
        getAnalytics: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            total_counts: '12',
            in_progress: '3',
            completed: '9',
            total_items_counted: '450',
            total_variance_items: '7',
            total_variance_value: '1234.5',
          },
        }),
      });
      const svc = new InventoryAdvancedService(repo);

      const r = await svc.getAnalytics();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toEqual({
          totalCounts: 12,
          inProgress: 3,
          completed: 9,
          totalItemsCounted: 450,
          totalVarianceItems: 7,
          totalVarianceValue: 1234.5,
        });
      }
    });

    it('defaults missing / non-numeric fields to 0', async () => {
      const repo = makeRepo({
        getAnalytics: jest.fn().mockResolvedValue({ ok: true, data: {} }),
      });
      const svc = new InventoryAdvancedService(repo);

      const r = await svc.getAnalytics();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toEqual({
          totalCounts: 0,
          inProgress: 0,
          completed: 0,
          totalItemsCounted: 0,
          totalVarianceItems: 0,
          totalVarianceValue: 0,
        });
      }
    });

    it('falls back to all-zero shape (not a thrown error) when the repo call fails', async () => {
      const repo = makeRepo({
        getAnalytics: jest.fn().mockResolvedValue({
          ok: false,
          error: { code: 'DB_ERROR', message: 'connection lost' },
        }),
      });
      const svc = new InventoryAdvancedService(repo);

      const r = await svc.getAnalytics();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toEqual({
          totalCounts: 0,
          inProgress: 0,
          completed: 0,
          totalItemsCounted: 0,
          totalVarianceItems: 0,
          totalVarianceValue: 0,
        });
      }
    });
  });

  describe('getCounts()', () => {
    it('derives total from the returned page length, not a repo-reported total', async () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const repo = makeRepo({
        findCounts: jest.fn().mockResolvedValue({ ok: true, data: rows }),
      });
      const svc = new InventoryAdvancedService(repo);

      const result = await svc.getCounts('in_progress', 'wh-1', 50, 0);

      expect(result.items).toBe(rows);
      expect(result.total).toBe(3);
      expect(repo.findCounts).toHaveBeenCalledWith('in_progress', 'wh-1', 50, 0);
    });

    it('returns an empty page (not a throw) when the repo call fails', async () => {
      const repo = makeRepo({
        findCounts: jest.fn().mockResolvedValue({
          ok: false,
          error: { code: 'GET_COUNTS_ERROR', message: 'boom' },
        }),
      });
      const svc = new InventoryAdvancedService(repo);

      const result = await svc.getCounts(undefined, undefined, 50, 0);

      expect(result).toEqual({ items: [], total: 0 });
    });
  });

  describe('getBarcodeAssignments()', () => {
    it('passes through repo rows and counts them', async () => {
      const rows = [{ barcode: 'A1' }, { barcode: 'A2' }];
      const repo = makeRepo({
        getBarcodeAssignments: jest.fn().mockResolvedValue({ ok: true, data: rows }),
      });
      const svc = new InventoryAdvancedService(repo);

      const result = await svc.getBarcodeAssignments(50, 0);

      expect(result.items).toBe(rows);
      expect(result.total).toBe(2);
    });

    it('returns an empty page (not a throw) when the repo call fails', async () => {
      const repo = makeRepo({
        getBarcodeAssignments: jest.fn().mockResolvedValue({
          ok: false,
          error: { code: 'INTERNAL', message: 'boom' },
        }),
      });
      const svc = new InventoryAdvancedService(repo);

      const result = await svc.getBarcodeAssignments(50, 0);

      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
