/**
 * test/wms/wms-eoq.service.spec.ts
 *
 * Unit tests for WmsEoqService. Mocks @shared/db.runQuery + BullMQ Queue +
 * the inner EoqCalculatorService.
 */

jest.mock('@shared/db', () => {
  const arr: Record<string, unknown>[] = [];
  return {
    __esModule: true,
    runQuery: jest.fn().mockResolvedValue(Object.assign(arr, { rows: arr })),
  };
});

import { WmsEoqService } from '../../src/modules/wms/application/wms-eoq.service';
import { EoqCalculatorService } from '../../src/modules/wms/domain/services/eoq-calculator.service';
import { Ok, Err, AppErr } from '../../src/common/result';
import { runQuery } from '@shared/db';
import type { Queue } from 'bullmq';

function rowsResult<T>(rows: T[]): T[] & { rows: T[] } {
  const arr = [...rows];
  return Object.assign(arr, { rows: [...rows] });
}

function makeQueue(addImpl?: (...args: unknown[]) => Promise<{ id: string }>): Queue {
  return {
    add: jest.fn(addImpl ?? (async () => ({ id: 'job-1' }))),
  } as unknown as Queue;
}

function makeEoqCalcStub(overrides: Partial<{
  calculate: jest.Mock;
  calculateWithDiscounts: jest.Mock;
}> = {}): EoqCalculatorService {
  const stub = {
    calculate: jest.fn().mockReturnValue(Ok({
      eoq: 100, eoqRounded: 100, totalCost: 1_000_000,
      orderFrequency: 12, cycleTimeDays: 30,
    })),
    calculateWithDiscounts: jest.fn().mockReturnValue(Ok({
      eoq: 100, eoqRounded: 100, totalCost: 800_000,
      orderFrequency: 10, cycleTimeDays: 36.5,
      selectedTierPrice: 9, selectedTierMinQty: 100,
    })),
    ...overrides,
  };
  return stub as unknown as EoqCalculatorService;
}

describe('WmsEoqService', () => {
  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
  });

  describe('enqueueRecalculation()', () => {
    it('returns queued=true with jobId when add succeeds', async () => {
      const queue = makeQueue(async () => ({ id: 'abc-123' }));
      const svc = new WmsEoqService(makeEoqCalcStub(), queue);

      const r = await svc.enqueueRecalculation();

      expect(r.queued).toBe(true);
      expect(r.jobId).toBe('abc-123');
    });

    it('falls back to local async when queue.add throws', async () => {
      const queue = makeQueue(async () => { throw new Error('redis down'); });
      const svc = new WmsEoqService(makeEoqCalcStub(), queue);
      (runQuery as jest.Mock).mockResolvedValue(rowsResult([]));

      const r = await svc.enqueueRecalculation();

      expect(r.queued).toBe(true);
      expect(r.jobId).toMatch(/^local-/);
    });

    it('passes correct add() args (queue name, jobType, options)', async () => {
      const queue = makeQueue();
      const svc = new WmsEoqService(makeEoqCalcStub(), queue);

      await svc.enqueueRecalculation();

      expect(queue.add).toHaveBeenCalled();
      const call = (queue.add as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('eoq-recalc-all');
      expect((call[1] as { jobType: string }).jobType).toBe('EOQ_RECALC_ALL');
    });
  });

  describe('calculateWithTiers()', () => {
    it('delegates to inner EoqCalculatorService.calculateWithDiscounts', () => {
      const inner = makeEoqCalcStub();
      const svc = new WmsEoqService(inner, makeQueue());

      const r = svc.calculateWithTiers({
        annualDemand: 1000,
        priceTiers: [{ minQty: 0, unitPrice: 10 }],
      });

      expect(r.ok).toBe(true);
      expect(inner.calculateWithDiscounts).toHaveBeenCalled();
    });

    it('passes input verbatim', () => {
      const inner = makeEoqCalcStub();
      const svc = new WmsEoqService(inner, makeQueue());

      svc.calculateWithTiers({
        annualDemand: 500,
        orderingCostUzs: 100,
        priceTiers: [{ minQty: 0, unitPrice: 8 }],
      });

      const arg = (inner.calculateWithDiscounts as jest.Mock).mock.calls[0]?.[0];
      expect(arg.annualDemand).toBe(500);
    });
  });

  describe('recalculateAll()', () => {
    it('returns processed=0 when no materials', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([])) // materials
        .mockResolvedValueOnce(rowsResult([])) // demand
        .mockResolvedValueOnce(rowsResult([])); // tiers

      const svc = new WmsEoqService(makeEoqCalcStub(), makeQueue());

      const r = await svc.recalculateAll();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.processed).toBe(0);
        expect(r.data.saved).toBe(0);
      }
    });

    it('processes a material and saves the recommendation', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([
          { id: 1, unit_price: 10, abc_segment: 'B', current_stock: 100 },
        ])) // materials
        .mockResolvedValueOnce(rowsResult([
          { material_id: 1, annual_demand: 1200 },
        ])) // demand
        .mockResolvedValueOnce(rowsResult([])) // tiers (none)
        .mockResolvedValueOnce(rowsResult([])); // upsert (no-op)

      const inner = makeEoqCalcStub();
      const svc = new WmsEoqService(inner, makeQueue());

      const r = await svc.recalculateAll();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.processed).toBe(1);
        expect(r.data.saved).toBe(1);
      }
    });

    it('flags HITL when totalCost > 50M UZS', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([
          { id: 1, unit_price: 10, abc_segment: 'A', current_stock: 100 },
        ]))
        .mockResolvedValueOnce(rowsResult([{ material_id: 1, annual_demand: 1200 }]))
        .mockResolvedValueOnce(rowsResult([]))
        .mockResolvedValueOnce(rowsResult([]));

      const inner = makeEoqCalcStub({
        calculate: jest.fn().mockReturnValue(Ok({
          eoq: 1000, eoqRounded: 1000,
          totalCost: 100_000_000, // > HITL threshold
          orderFrequency: 5, cycleTimeDays: 73,
        })),
      });
      const svc = new WmsEoqService(inner, makeQueue());

      const r = await svc.recalculateAll();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.hitlFlagged).toBe(1);
      }
    });

    it('returns failure when initial DB query throws', async () => {
      (runQuery as jest.Mock).mockRejectedValueOnce(new Error('connection lost'));
      const svc = new WmsEoqService(makeEoqCalcStub(), makeQueue());

      const r = await svc.recalculateAll();

      expect(r.ok).toBe(false);
    });

    it('skips materials when calculate returns Err', async () => {
      (runQuery as jest.Mock)
        .mockResolvedValueOnce(rowsResult([
          { id: 1, unit_price: 10, abc_segment: 'B', current_stock: 100 },
        ]))
        .mockResolvedValueOnce(rowsResult([]))
        .mockResolvedValueOnce(rowsResult([]));

      const inner = makeEoqCalcStub({
        calculate: jest.fn().mockReturnValue(Err(AppErr('VALIDATION', 'bad'))),
      });
      const svc = new WmsEoqService(inner, makeQueue());

      const r = await svc.recalculateAll();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.processed).toBe(1);
        expect(r.data.saved).toBe(0);
      }
    });
  });
});
