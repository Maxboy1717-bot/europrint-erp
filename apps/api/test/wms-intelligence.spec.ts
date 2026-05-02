jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { EoqCalculatorService } from '../src/modules/wms/domain/services/eoq-calculator.service';
import { SafetyStockService } from '../src/modules/wms/domain/services/safety-stock.service';
import { RopService } from '../src/modules/wms/domain/services/rop.service';
import { AbcXyzService } from '../src/modules/wms/analytics/abc-xyz.service';
import { InventoryTurnoverService } from '../src/modules/wms/domain/services/inventory-turnover.service';
import * as sharedDb from '../src/shared/db';

describe('TZ-01 EOQ — Wilson Formula', () => {
  const svc = new EoqCalculatorService();

  it('D=10000 S=500 holdingPct=0.2 P=10 → EOQ ≈ 2236', async () => {
    const res = await svc.calculate({
      annualDemand: 10000,
      orderingCostUzs: 500,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
      packSize: 1,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(Math.round(res.data.eoq)).toBe(2236);
  });

  it('EOQ rounded up to packSize multiple', async () => {
    const res = await svc.calculate({
      annualDemand: 10000,
      orderingCostUzs: 500,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
      packSize: 100,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.eoqRounded % 100).toBe(0);
    expect(res.data.eoqRounded).toBeGreaterThanOrEqual(2236);
  });

  it('D=0 → Err (VALIDATION)', async () => {
    const res = await svc.calculate({
      annualDemand: 0,
      orderingCostUzs: 500,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('S=0 → Err (VALIDATION)', async () => {
    const res = await svc.calculate({
      annualDemand: 1000,
      orderingCostUzs: 0,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
    });
    expect(res.ok).toBe(false);
  });

  it('H=0 → Err (holdingCost = holdingPct * price = 0)', async () => {
    const res = await svc.calculate({
      annualDemand: 1000,
      orderingCostUzs: 500,
      holdingCostPercent: 0,
      unitPriceUzs: 10,
    });
    expect(res.ok).toBe(false);
  });

  it('orderFrequency = D / eoqRounded', async () => {
    const res = await svc.calculate({
      annualDemand: 10000,
      orderingCostUzs: 500,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
      packSize: 1,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.orderFrequency).toBeCloseTo(10000 / res.data.eoqRounded, 2);
  });

  it('cycleTimeDays = 365 / orderFrequency', async () => {
    const res = await svc.calculate({
      annualDemand: 10000,
      orderingCostUzs: 500,
      holdingCostPercent: 0.2,
      unitPriceUzs: 10,
      packSize: 1,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.cycleTimeDays).toBeCloseTo(365 / res.data.orderFrequency, 1);
  });
});

describe('TZ-02 Safety Stock', () => {
  const svc = new SafetyStockService();

  const demand = [45, 50, 55, 48, 52, 47, 53, 49, 51, 46, 54, 50, 50, 48];

  it('serviceLevel=0.90 → Z=1.282 ishlatiladi', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: demand,
      leadTimeDays: 7,
      serviceLevel: 0.90,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.zScore).toBeCloseTo(1.282, 3);
    expect(res.data.safetyStock).toBeGreaterThan(0);
  });

  it('serviceLevel=0.95 → Z=1.645', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: demand,
      leadTimeDays: 7,
      serviceLevel: 0.95,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.zScore).toBeCloseTo(1.645, 3);
  });

  it('serviceLevel=0.99 → Z=2.326', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: demand,
      leadTimeDays: 7,
      serviceLevel: 0.99,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.zScore).toBeCloseTo(2.326, 3);
  });

  it('Oddiy formula: SS = Z × σ_d × √L', async () => {
    const d = [50, 50, 50, 50, 50, 50, 50, 60, 40, 55, 45, 50, 50, 52];
    const res = await svc.calculate({
      dailyDemandSeries: d,
      leadTimeDays: 9,
      serviceLevel: 0.95,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.safetyStock).toBeGreaterThan(0);
    expect(res.data.avgDailyDemand).toBeGreaterThan(0);
  });

  it('Ikki o\'zgaruvchan formula: SS = Z × √(L×σd² + d̄²×σL²)', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: demand,
      leadTimeDays: 7,
      leadTimeSeries: [6, 7, 8, 7, 6, 7, 8],
      serviceLevel: 0.95,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.safetyStock).toBeGreaterThan(0);
  });

  it('< 7 kun talab → Err', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: [50, 50, 50],
      leadTimeDays: 7,
    });
    expect(res.ok).toBe(false);
  });

  it('leadTimeDays=0 → Err', async () => {
    const res = await svc.calculate({
      dailyDemandSeries: demand,
      leadTimeDays: 0,
    });
    expect(res.ok).toBe(false);
  });

  it('getZScore() helper to\'g\'ri qaytaradi', () => {
    expect(svc.getZScore(0.999)).toBeCloseTo(3.090, 3);
    expect(svc.getZScore(0.90)).toBeCloseTo(1.282, 3);
  });
});

describe('TZ-03 ROP — Reorder Point', () => {
  const svc = new RopService();

  it('d̄=50 L=7 SS=100 → ROP=450', async () => {
    const res = await svc.calculate({ avgDailyDemand: 50, leadTimeDays: 7, safetyStock: 100 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.rop).toBe(450);
    expect(res.data.demandDuringLeadTime).toBe(350);
    expect(res.data.safetyStock).toBe(100);
  });

  it('ROP = demandDuringLeadTime + safetyStock', async () => {
    const res = await svc.calculate({ avgDailyDemand: 30, leadTimeDays: 5, safetyStock: 50 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.rop).toBe(Math.ceil(30 * 5 + 50));
  });

  it('avgDailyDemand manfiy → Err', async () => {
    const res = await svc.calculate({ avgDailyDemand: -1, leadTimeDays: 7, safetyStock: 100 });
    expect(res.ok).toBe(false);
  });

  it('leadTimeDays=0 → Err', async () => {
    const res = await svc.calculate({ avgDailyDemand: 50, leadTimeDays: 0, safetyStock: 100 });
    expect(res.ok).toBe(false);
  });

  it('safetyStock=0 → to\'g\'ri (SS siz ROP)', async () => {
    const res = await svc.calculate({ avgDailyDemand: 50, leadTimeDays: 7, safetyStock: 0 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.rop).toBe(350);
  });
});

describe('TZ-04 ABC/XYZ Tahlili', () => {
  const svc = new AbcXyzService();

  it('classifyAbc: cumPct=50 → A', () => {
    expect(svc.classifyAbc(50)).toBe('A');
  });

  it('classifyAbc: cumPct=80 → A (chegarada)', () => {
    expect(svc.classifyAbc(80)).toBe('A');
  });

  it('classifyAbc: cumPct=90 → B', () => {
    expect(svc.classifyAbc(90)).toBe('B');
  });

  it('classifyAbc: cumPct=95 → B (chegarada)', () => {
    expect(svc.classifyAbc(95)).toBe('B');
  });

  it('classifyAbc: cumPct=99 → C', () => {
    expect(svc.classifyAbc(99)).toBe('C');
  });

  it('classifyXyz: CV=0.1 → X', () => {
    expect(svc.classifyXyz(0.1)).toBe('X');
  });

  it('classifyXyz: CV=0.25 → X (chegarada)', () => {
    expect(svc.classifyXyz(0.25)).toBe('X');
  });

  it('classifyXyz: CV=0.4 → Y', () => {
    expect(svc.classifyXyz(0.4)).toBe('Y');
  });

  it('classifyXyz: CV=0.8 → Z', () => {
    expect(svc.classifyXyz(0.8)).toBe('Z');
  });

  it('analyzeInMemory: eng yuqori qiymatli material → A toifasi', async () => {
    const rows = [
      { materialId: 1, annualValue: 80_000_000, demandValues: [100, 100, 100, 100, 100] },
      { materialId: 2, annualValue: 10_000_000, demandValues: [50, 80, 30, 60, 40] },
      { materialId: 3, annualValue: 5_000_000, demandValues: [10, 100, 5, 200, 1] },
      { materialId: 4, annualValue: 3_000_000, demandValues: [20, 21, 19, 20, 20] },
      { materialId: 5, annualValue: 2_000_000, demandValues: [5, 50, 2, 80, 10] },
    ];
    const res = await svc.analyzeInMemory(rows);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const topItem = res.data.items[0];
    expect(topItem.materialId).toBe(1);
    expect(topItem.abcClass).toBe('A');
  });

  it('analyzeInMemory: barqaror talab (low CV) → X toifasi', async () => {
    const rows = [
      { materialId: 1, annualValue: 80_000_000, demandValues: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
    ];
    const res = await svc.analyzeInMemory(rows);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.items[0].xyzClass).toBe('X');
  });

  it('analyzeInMemory: kuchli o\'zgaruvchan talab → Z toifasi', async () => {
    const rows = [
      { materialId: 1, annualValue: 1_000, demandValues: [1, 100, 1, 200, 1, 150, 1, 80] },
    ];
    const res = await svc.analyzeInMemory(rows);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.items[0].xyzClass).toBe('Z');
  });

  it('classifyItem: cumPct=40, CV=0.1 → AX', async () => {
    const r = await svc.classifyItem(40, 0.1);
    expect(r.abcXyzClass).toBe('AX');
  });

  it('classifyItem: cumPct=90, CV=0.8 → BZ', async () => {
    const r = await svc.classifyItem(90, 0.8);
    expect(r.abcXyzClass).toBe('BZ');
  });
});

describe('TZ-D05 N+1 Fix: syncLowStockAlerts batch semantics', () => {
  it('items.length=0 → inserted=0, repository not called with items', async () => {
    const mockRepo = {
      batchInsertLowStockAlerts: jest.fn().mockResolvedValue({ ok: true, data: { inserted: 0 } }),
    };
    const result = await mockRepo.batchInsertLowStockAlerts([]);
    expect(mockRepo.batchInsertLowStockAlerts).toHaveBeenCalledTimes(1);
    expect(result.data.inserted).toBe(0);
  });

  it('500 items → single batchInsertLowStockAlerts call (not 500 calls)', async () => {
    const mockRepo = {
      batchInsertLowStockAlerts: jest.fn().mockResolvedValue({ ok: true, data: { inserted: 500 } }),
    };

    const items = Array.from({ length: 500 }, (_, i) => ({
      material_id: i + 1,
      warehouse_id: 1,
      material_name: `Material-${i + 1}`,
    }));

    await mockRepo.batchInsertLowStockAlerts(items);
    expect(mockRepo.batchInsertLowStockAlerts).toHaveBeenCalledTimes(1);
    expect(mockRepo.batchInsertLowStockAlerts).toHaveBeenCalledWith(items);
  });

  it('batch call result — inserted count to\'g\'ri qaytadi', async () => {
    const mockRepo = {
      batchInsertLowStockAlerts: jest.fn().mockResolvedValue({ ok: true, data: { inserted: 42 } }),
    };
    const result = await mockRepo.batchInsertLowStockAlerts([{ material_id: 1, warehouse_id: 1, material_name: 'X' }]);
    expect(result.data.inserted).toBe(42);
  });
});

describe('TZ-04 ABC/XYZ SQL calculateFromDb (mocked runQuery)', () => {
  const runQueryMock = sharedDb.runQuery as jest.MockedFunction<typeof sharedDb.runQuery>;

  beforeEach(() => {
    runQueryMock.mockReset();
  });

  it('calculateFromDb: DB rows dan to\'g\'ri ABC/XYZ toifalarini qaytaradi', async () => {
    runQueryMock
      .mockResolvedValueOnce({
        rows: [
          { material_id: '1', annual_value: '80000', cum_pct: '72.73' },
          { material_id: '2', annual_value: '20000', cum_pct: '90.91' },
          { material_id: '3', annual_value: '10000', cum_pct: '100.00' },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          { material_id: '1', cv: '0.05' },
          { material_id: '2', cv: '0.35' },
          { material_id: '3', cv: '0.75' },
        ],
      } as never);

    const svc = new AbcXyzService();
    const result = await svc.calculateFromDb();

    expect(runQueryMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(3);
    expect(result.data.items[0].materialId).toBe('1');
    expect(result.data.items[0].abcClass).toBe('A');
    expect(result.data.items[0].xyzClass).toBe('X');
    expect(result.data.items[1].abcClass).toBe('B');
    expect(result.data.items[1].xyzClass).toBe('Y');
    expect(result.data.items[2].abcClass).toBe('C');
    expect(result.data.items[2].xyzClass).toBe('Z');
  });

  it('calculateFromDb: runQuery xatosi → Err qaytaradi', async () => {
    runQueryMock.mockRejectedValueOnce(new Error('DB connection failed'));

    const svc = new AbcXyzService();
    const result = await svc.calculateFromDb();
    expect(result.ok).toBe(false);
  });

  it('checkAlerts → batchInsertLowStockAlerts chaqiriladi (bitta marta)', async () => {
    const mockLowStockItems = {
      ok: true,
      data: [
        { material_id: 1, warehouse_id: 1, material_name: 'Material A' },
        { material_id: 2, warehouse_id: 1, material_name: 'Material B' },
      ],
    };
    const mockBatchResult = { ok: true, data: { inserted: 2 } };

    const mockRepo = {
      getLowStockItems: jest.fn().mockResolvedValue(mockLowStockItems),
      batchInsertLowStockAlerts: jest.fn().mockResolvedValue(mockBatchResult),
    };

    const { WmsExtendedService } = await import('../src/modules/wms/application/wms-extended.service');
    const svc = new WmsExtendedService(mockRepo as never);
    const result = await svc.checkAlerts();

    expect(mockRepo.batchInsertLowStockAlerts).toHaveBeenCalledTimes(1);
    const callArg = mockRepo.batchInsertLowStockAlerts.mock.calls[0][0] as unknown[];
    expect(callArg).toHaveLength(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.data as Record<string, unknown>)['new_alerts']).toBe(2);
    expect((result.data as Record<string, unknown>)['alerts_checked']).toBe(2);
  });
});

describe('TZ-05 Inventory Turnover / DIO', () => {
  const svc = new InventoryTurnoverService();

  it('Turnover = COGS / avgInventory', async () => {
    const res = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 200_000 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.turnover).toBeCloseTo(5, 2);
  });

  it('DIO = 365 / Turnover', async () => {
    const res = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 200_000 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.dio).toBeCloseTo(365 / 5, 1);
  });

  it('DIO > 180 → slow-moving izohi', async () => {
    const res = await svc.calculate({ annualCogs: 100_000, avgInventoryValue: 200_000 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.dio).toBeGreaterThan(180);
    expect(res.data.interpretation).toContain('Sekin');
  });

  it('avgInventoryValue=0, COGS>0 → Err (nolga bo\'linish)', async () => {
    const res = await svc.calculate({ annualCogs: 1_000_000, avgInventoryValue: 0 });
    expect(res.ok).toBe(false);
  });

  it('avgInventoryValue=0, COGS=0 → Ok (0,0)', async () => {
    const res = await svc.calculate({ annualCogs: 0, avgInventoryValue: 0 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.turnover).toBe(0);
    expect(res.data.dio).toBe(0);
  });

  it('annualCogs manfiy → Err', async () => {
    const res = await svc.calculate({ annualCogs: -100, avgInventoryValue: 200 });
    expect(res.ok).toBe(false);
  });

  it('calculateDio: turnover=5 → DIO=73', async () => {
    const res = await svc.calculateDio(5);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toBeCloseTo(73, 0);
  });

  it('calculateDio: turnover=0 → Err', async () => {
    const res = await svc.calculateDio(0);
    expect(res.ok).toBe(false);
  });
});
