/**
 * test/pp/run-mrp.handler.spec.ts
 *
 * Unit tests for RunMrpHandler. The BomExplosionService is mocked so the
 * lot-sizing branches (L4L, EOQ, POQ, WAGNER_WHITIN) are exercised in
 * isolation. The Calculation decorator is a metadata-only no-op at runtime.
 */

import { RunMrpHandler } from '../../src/modules/pp/application/commands/run-mrp.handler';
import type { MaterialPolicy, MpsRow } from '../../src/modules/pp/application/commands/run-mrp.handler';
import {
  BomExplosionService,
  BomEdge,
} from '../../src/modules/pp/domain/services/bom-explosion.service';
import { Ok, Err } from '../../src/common/result';

type Bom = jest.Mocked<BomExplosionService>;

function makeBomService(reqs: Map<string, number>): Bom {
  return {
    explodeInMemory: jest.fn().mockResolvedValue(Ok({ requirements: reqs, totalNodes: reqs.size })),
  } as unknown as Bom;
}

const ZERO_EDGES: BomEdge[] = [];

describe('RunMrpHandler', () => {
  const baseMps: MpsRow[] = [{ productId: 'P1', periodIndex: 1, quantity: 10 }];

  it('returns VALIDATION when mpsRows is empty', async () => {
    const handler = new RunMrpHandler(makeBomService(new Map()));

    const r = await handler.runMrp({
      mpsRows: [],
      bomEdges: ZERO_EDGES,
      onHandByMaterial: {},
      policies: [],
      horizonPeriods: 4,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when horizonPeriods is not positive', async () => {
    const handler = new RunMrpHandler(makeBomService(new Map()));

    const r = await handler.runMrp({
      mpsRows: baseMps,
      bomEdges: ZERO_EDGES,
      onHandByMaterial: {},
      policies: [],
      horizonPeriods: 0,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('produces L4L planned orders equal to net requirement when no policy supplied', async () => {
    const reqs = new Map<string, number>([['M-A', 10]]);
    const handler = new RunMrpHandler(makeBomService(reqs));

    const r = await handler.runMrp({
      mpsRows: baseMps,
      bomEdges: ZERO_EDGES,
      onHandByMaterial: { 'M-A': 3 }, // OH=3 → NR=7 in period 1
      policies: [],
      horizonPeriods: 4,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = r.data.plannedOrders.filter((p) => p.materialId === 'M-A');
      expect(m).toHaveLength(1);
      expect(m[0].qty).toBe(7);
      expect(m[0].periodIndex).toBe(1);
    }
  });

  it('enforces EOQ minimum lot size when EOQ exceeds net requirement', async () => {
    const reqs = new Map<string, number>([['M-A', 5]]);
    const policy: MaterialPolicy = {
      materialId: 'M-A',
      lotSizingMethod: 'EOQ',
      eoq: 20,
      leadTimeDays: 7,
    };
    const handler = new RunMrpHandler(makeBomService(reqs));

    const r = await handler.runMrp({
      mpsRows: baseMps,
      bomEdges: ZERO_EDGES,
      onHandByMaterial: {},
      policies: [policy],
      horizonPeriods: 4,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = r.data.plannedOrders.find((p) => p.materialId === 'M-A');
      expect(m?.qty).toBe(20); // EOQ wins over NR=5
      expect(m?.releaseByPeriod).toBe(0); // 1 - leadTimeOffset(7d ≈ 1 period)
    }
  });

  it('skips NOT_FOUND products from explode but still returns Ok result', async () => {
    const bom = {
      explodeInMemory: jest.fn().mockResolvedValue(Err({ code: 'NOT_FOUND', message: 'no edges' })),
    } as unknown as Bom;
    const handler = new RunMrpHandler(bom);

    const r = await handler.runMrp({
      mpsRows: baseMps,
      bomEdges: ZERO_EDGES,
      onHandByMaterial: {},
      policies: [],
      horizonPeriods: 4,
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.plannedOrders).toEqual([]);
  });

  it('propagates non-NOT_FOUND explode errors as Err', async () => {
    const bom = {
      explodeInMemory: jest.fn().mockResolvedValue(Err({ code: 'CONFLICT', message: 'cycle' })),
    } as unknown as Bom;
    const handler = new RunMrpHandler(bom);

    const r = await handler.runMrp({
      mpsRows: baseMps,
      bomEdges: ZERO_EDGES,
      onHandByMaterial: {},
      policies: [],
      horizonPeriods: 4,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
  });
});
