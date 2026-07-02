/**
 * test/wms/wms-catalog.service.spec.ts
 *
 * Unit tests for WmsCatalogService — a pure delegating facade over the three
 * wms-catalog/* sub-services (Rule 16 split). Each public method must forward
 * to the correct sub-service method, with the correct arguments, and return
 * whatever the sub-service resolves with unchanged.
 */
import { WmsCatalogService } from '../../src/modules/wms/application/wms-catalog.service';
import type { WmsCatalogAbcAgingExpiryService } from '../../src/modules/wms/application/wms-catalog/abc-aging-expiry.service';
import type { WmsCatalogStockTurnoverService } from '../../src/modules/wms/application/wms-catalog/stock-turnover.service';
import type { WmsCatalogDashboardService } from '../../src/modules/wms/application/wms-catalog/dashboard.service';

function makeAbcStub(): WmsCatalogAbcAgingExpiryService {
  return {
    getAbcAnalysis: jest.fn().mockResolvedValue({ data: [], summary: { classA: 0, classB: 0, classC: 0 } }),
    getAging: jest.fn().mockResolvedValue({ data: [], summary: {} }),
    getExpiry: jest.fn().mockResolvedValue({ data: [], summary: {} }),
  } as unknown as WmsCatalogAbcAgingExpiryService;
}

function makeStockStub(): WmsCatalogStockTurnoverService {
  return {
    getStockBalance: jest.fn().mockResolvedValue({ data: [], summary: {} }),
    getTurnover: jest.fn().mockResolvedValue({ data: [], summary: {} }),
    getTopMaterials: jest.fn().mockResolvedValue([]),
  } as unknown as WmsCatalogStockTurnoverService;
}

function makeDashStub(): WmsCatalogDashboardService {
  return {
    getStatsTotal: jest.fn().mockResolvedValue({ totalWarehouses: 0 }),
    getDashboardKpis: jest.fn().mockResolvedValue({ totalMaterials: 0 }),
    getMovementSummary: jest.fn().mockResolvedValue({ totalIn: 0, totalOut: 0 }),
    getDashboardAlerts: jest.fn().mockResolvedValue({ lowStock: [] }),
  } as unknown as WmsCatalogDashboardService;
}

describe('WmsCatalogService', () => {
  it('is defined', () => {
    expect(WmsCatalogService).toBeDefined();
  });

  describe('ABC / aging / expiry delegation', () => {
    it('getAbcAnalysis() delegates to abc.getAbcAnalysis() with no args', async () => {
      const abc = makeAbcStub();
      const svc = new WmsCatalogService(abc, makeStockStub(), makeDashStub());

      const result = { data: [{ materialId: '1' }], summary: { classA: 1, classB: 0, classC: 0 } };
      (abc.getAbcAnalysis as jest.Mock).mockResolvedValueOnce(result);

      const r = await svc.getAbcAnalysis();

      expect(abc.getAbcAnalysis).toHaveBeenCalledTimes(1);
      expect(abc.getAbcAnalysis).toHaveBeenCalledWith();
      expect(r).toBe(result);
    });

    it('getAging() forwards the days argument unchanged', async () => {
      const abc = makeAbcStub();
      const svc = new WmsCatalogService(abc, makeStockStub(), makeDashStub());

      await svc.getAging(45);

      expect(abc.getAging).toHaveBeenCalledWith(45);
    });

    it('getExpiry() forwards the days argument unchanged', async () => {
      const abc = makeAbcStub();
      const svc = new WmsCatalogService(abc, makeStockStub(), makeDashStub());

      await svc.getExpiry(30);

      expect(abc.getExpiry).toHaveBeenCalledWith(30);
    });
  });

  describe('stock / turnover delegation', () => {
    it('getStockBalance() defaults lowStockOnly to false when omitted', async () => {
      const stock = makeStockStub();
      const svc = new WmsCatalogService(makeAbcStub(), stock, makeDashStub());

      await svc.getStockBalance();

      expect(stock.getStockBalance).toHaveBeenCalledWith(undefined, undefined, false);
    });

    it('getStockBalance() forwards warehouse, category and low flag', async () => {
      const stock = makeStockStub();
      const svc = new WmsCatalogService(makeAbcStub(), stock, makeDashStub());

      await svc.getStockBalance('WH-1', 'raw', true);

      expect(stock.getStockBalance).toHaveBeenCalledWith('WH-1', 'raw', true);
    });

    it('getTurnover() forwards date range to stock.getTurnover()', async () => {
      const stock = makeStockStub();
      const svc = new WmsCatalogService(makeAbcStub(), stock, makeDashStub());

      await svc.getTurnover('2026-01-01', '2026-01-31');

      expect(stock.getTurnover).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
    });

    it('getTopMaterials() forwards the limit and returns the resolved value', async () => {
      const stock = makeStockStub();
      const topRows = [{ materialId: 1, name: 'Paper', kod: 'M-1', value: 100, movement: 5 }];
      (stock.getTopMaterials as jest.Mock).mockResolvedValueOnce(topRows);
      const svc = new WmsCatalogService(makeAbcStub(), stock, makeDashStub());

      const r = await svc.getTopMaterials(10);

      expect(stock.getTopMaterials).toHaveBeenCalledWith(10);
      expect(r).toBe(topRows);
    });
  });

  describe('dashboard delegation', () => {
    it('getStatsTotal() delegates to dash.getStatsTotal()', async () => {
      const dash = makeDashStub();
      const svc = new WmsCatalogService(makeAbcStub(), makeStockStub(), dash);

      await svc.getStatsTotal();

      expect(dash.getStatsTotal).toHaveBeenCalledTimes(1);
    });

    it('getDashboardKpis() delegates to dash.getDashboardKpis()', async () => {
      const dash = makeDashStub();
      const svc = new WmsCatalogService(makeAbcStub(), makeStockStub(), dash);

      await svc.getDashboardKpis();

      expect(dash.getDashboardKpis).toHaveBeenCalledTimes(1);
    });

    it('getMovementSummary() forwards the period argument', async () => {
      const dash = makeDashStub();
      const svc = new WmsCatalogService(makeAbcStub(), makeStockStub(), dash);

      await svc.getMovementSummary('week');

      expect(dash.getMovementSummary).toHaveBeenCalledWith('week');
    });

    it('getDashboardAlerts() delegates to dash.getDashboardAlerts()', async () => {
      const dash = makeDashStub();
      const svc = new WmsCatalogService(makeAbcStub(), makeStockStub(), dash);

      await svc.getDashboardAlerts();

      expect(dash.getDashboardAlerts).toHaveBeenCalledTimes(1);
    });
  });
});
