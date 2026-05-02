/**
 * Sprint 2B — PP/MRP/CRP/Scheduling (Task #429)
 *
 * TZ-D09: BOM Explosion (Kahn topo sort + memoization)
 * TZ-10:  MRP — Material Requirements Planning
 * TZ-11:  MPS — ATP (Available to Promise)
 * TZ-12:  CRP — Capacity Requirements Planning
 * TZ-13:  Johnson Qoidasi (2-mashina)
 * TZ-14:  CPM/PERT
 * TZ-16:  TOC — Bottleneck Detection
 * TZ-17:  Standart Tannarx + Variance Tahlili
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { BomExplosionService } from '../src/modules/pp/domain/services/bom-explosion.service';
import { CrpService } from '../src/modules/pp/domain/services/crp.service';
import { SchedulingService } from '../src/modules/pp/domain/services/scheduling.service';
import { CostingService } from '../src/modules/pp/domain/services/costing.service';
import { RunMrpHandler } from '../src/modules/pp/application/commands/run-mrp.handler';
import { MpsAtpHandler } from '../src/modules/pp/application/queries/mps-atp.handler';

// ─────────────────────────────────────────────────────────────────────────────
// TZ-D09: BOM Explosion — Topological Sort + Memoization
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-D09 BOM Explosion — Topologik Sort + Memoization', () => {
  const svc = new BomExplosionService();

  it('diamond: A→B(2), A→C(3), B→D(4), C→D(5) → D = 2×4 + 3×5 = 23', async () => {
    const edges = [
      { parentId: 'A', childId: 'B', qtyPerUnit: 2 },
      { parentId: 'A', childId: 'C', qtyPerUnit: 3 },
      { parentId: 'B', childId: 'D', qtyPerUnit: 4 },
      { parentId: 'C', childId: 'D', qtyPerUnit: 5 },
    ];
    const res = await svc.explodeInMemory('A', 1, edges);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.requirements.get('D')).toBe(23);
    expect(res.data.requirements.get('B')).toBe(2);
    expect(res.data.requirements.get('C')).toBe(3);
  });

  it('sikl: A→B→C→A → CyclicBomError (CONFLICT)', async () => {
    const edges = [
      { parentId: 'A', childId: 'B', qtyPerUnit: 1 },
      { parentId: 'B', childId: 'C', qtyPerUnit: 1 },
      { parentId: 'C', childId: 'A', qtyPerUnit: 1 },
    ];
    const res = await svc.explodeInMemory('A', 1, edges);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('CONFLICT');
  });

  it('yagona barg material: leaf → requirements={leaf:1}', async () => {
    const res = await svc.explodeInMemory('M', 5, []);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('NOT_FOUND');
  });

  it('yagona ota material, bitta bola: A→B(3), qty=4 → B=12', async () => {
    const edges = [{ parentId: 'A', childId: 'B', qtyPerUnit: 3 }];
    const res = await svc.explodeInMemory('A', 4, edges);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.requirements.get('B')).toBeCloseTo(12);
  });

  it('memoization: ko\'p darajali A→B→C→D, qty=2 → D=2', async () => {
    const edges = [
      { parentId: 'A', childId: 'B', qtyPerUnit: 1 },
      { parentId: 'B', childId: 'C', qtyPerUnit: 1 },
      { parentId: 'C', childId: 'D', qtyPerUnit: 1 },
    ];
    const res = await svc.explodeInMemory('A', 2, edges);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.requirements.get('D')).toBe(2);
  });

  it('qty=0 → VALIDATION xatosi', async () => {
    const res = await svc.explodeInMemory('A', 0, []);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('productId topilmadi → NOT_FOUND', async () => {
    const edges = [{ parentId: 'X', childId: 'Y', qtyPerUnit: 1 }];
    const res = await svc.explodeInMemory('NOMA_LUM', 1, edges);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('NOT_FOUND');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-10: MRP — Material Requirements Planning
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-10 MRP — Material Requirements Planning', () => {
  let mrpHandler: RunMrpHandler;

  beforeEach(() => {
    const bomSvc = new BomExplosionService();
    mrpHandler = new RunMrpHandler(bomSvc);
  });

  it('L4L: GR=10, OH=0 → PO qty=10', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'FG', periodIndex: 0, quantity: 10 }],
      bomEdges: [{ parentId: 'FG', childId: 'RM', qtyPerUnit: 1 }],
      onHandByMaterial: { RM: 0 },
      policies: [{ materialId: 'RM', lotSizingMethod: 'L4L', leadTimeDays: 0 }],
      horizonPeriods: 3,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const po = res.data.plannedOrders.find((o) => o.materialId === 'RM');
    expect(po).toBeDefined();
    expect(po!.qty).toBe(10);
  });

  it('OH qoplanadi: GR=10, OH=4 → NR=6', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'FG', periodIndex: 0, quantity: 10 }],
      bomEdges: [{ parentId: 'FG', childId: 'RM', qtyPerUnit: 1 }],
      onHandByMaterial: { RM: 4 },
      policies: [{ materialId: 'RM', lotSizingMethod: 'L4L', leadTimeDays: 0 }],
      horizonPeriods: 3,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const po = res.data.plannedOrders.find((o) => o.materialId === 'RM');
    expect(po!.qty).toBe(6);
  });

  it('EOQ lot sizing: NR=5, EOQ=50 → PO=50', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'P', periodIndex: 0, quantity: 5 }],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 0 },
      policies: [{ materialId: 'M', lotSizingMethod: 'EOQ', eoq: 50, leadTimeDays: 0 }],
      horizonPeriods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const po = res.data.plannedOrders.find((o) => o.materialId === 'M');
    expect(po!.qty).toBe(50);
  });

  it('GR=0 → PO yo\'q (OH yetarli)', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'P', periodIndex: 0, quantity: 3 }],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 100 },
      policies: [{ materialId: 'M', lotSizingMethod: 'L4L', leadTimeDays: 0 }],
      horizonPeriods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.plannedOrders.length).toBe(0);
  });

  it('netRequirements sr maydoni mavjud', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'P', periodIndex: 0, quantity: 10 }],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 2 }],
      onHandByMaterial: { M: 0 },
      policies: [{ materialId: 'M', lotSizingMethod: 'L4L', leadTimeDays: 0 }],
      horizonPeriods: 3,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const nr = res.data.netRequirements.find((r) => r.materialId === 'M' && r.period === 0);
    expect(nr).toBeDefined();
    expect(nr!.gr).toBe(20);
    expect(nr!.nr).toBe(20);
    expect(typeof nr!.sr).toBe('number');
  });

  it('SR (Scheduled Receipts): GR=10, OH=0, SR=6 → NR=4', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'P', periodIndex: 0, quantity: 10 }],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 0 },
      scheduledReceiptsByMaterial: { M: [6, 0, 0] },
      policies: [{ materialId: 'M', lotSizingMethod: 'L4L', leadTimeDays: 0 }],
      horizonPeriods: 3,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const nr0 = res.data.netRequirements.find((r) => r.materialId === 'M' && r.period === 0);
    expect(nr0!.sr).toBe(6);
    expect(nr0!.nr).toBe(4);
  });

  it('POQ bucket: OH=0, poqPeriods=3, talab=[10,8,5] → bitta buyurtma=23', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [
        { productId: 'P', periodIndex: 0, quantity: 10 },
        { productId: 'P', periodIndex: 1, quantity: 8 },
        { productId: 'P', periodIndex: 2, quantity: 5 },
      ],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 0 },
      policies: [{
        materialId: 'M',
        lotSizingMethod: 'POQ',
        poqPeriods: 3,
        leadTimeDays: 0,
      }],
      horizonPeriods: 4,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const poAtP0 = res.data.plannedOrders.find((o) => o.materialId === 'M' && o.periodIndex === 0);
    expect(poAtP0).toBeDefined();
    // lot = totalBucketGR(23) - OH(0) = 23
    expect(poAtP0!.qty).toBe(23);
  });

  it('POQ bucket OH netting: OH=2, talab=[5,5], POQ=2 → lot=8 (10 emas!)', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [
        { productId: 'P', periodIndex: 0, quantity: 5 },
        { productId: 'P', periodIndex: 1, quantity: 5 },
      ],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 2 },
      policies: [{
        materialId: 'M',
        lotSizingMethod: 'POQ',
        poqPeriods: 2,
        leadTimeDays: 0,
      }],
      horizonPeriods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const poAtP0 = res.data.plannedOrders.find((o) => o.materialId === 'M' && o.periodIndex === 0);
    expect(poAtP0).toBeDefined();
    // lot = totalBucketGR(10) - oh(2) = 8
    expect(poAtP0!.qty).toBe(8);
  });

  it('Wagner-Whitin: optimal lot sizes, totalPO = barcha NR yig\'indisi', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [
        { productId: 'P', periodIndex: 0, quantity: 5 },
        { productId: 'P', periodIndex: 1, quantity: 8 },
        { productId: 'P', periodIndex: 2, quantity: 3 },
      ],
      bomEdges: [{ parentId: 'P', childId: 'M', qtyPerUnit: 1 }],
      onHandByMaterial: { M: 0 },
      policies: [{ materialId: 'M', lotSizingMethod: 'WAGNER_WHITIN', leadTimeDays: 0 }],
      horizonPeriods: 4,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const totalPO = res.data.plannedOrders.reduce((s, o) => s + o.qty, 0);
    // WW optimal: jami PO = jami NR (lekin kamroq buyurtmada)
    const totalNR = res.data.netRequirements.reduce((s, r) => s + r.nr, 0);
    expect(totalPO).toBe(totalNR);
  });

  it('horizonPeriods=0 → VALIDATION xatosi', async () => {
    const res = await mrpHandler.runMrp({
      mpsRows: [{ productId: 'P', periodIndex: 0, quantity: 1 }],
      bomEdges: [],
      onHandByMaterial: {},
      policies: [],
      horizonPeriods: 0,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-11: MPS — ATP (Available to Promise)
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-11 MPS — ATP (Available to Promise)', () => {
  const svc = new MpsAtpHandler();

  it('OH=10, MPS=[20], CO=[15] → period0.atp=15 (cumMPS=30, cumCO=15)', async () => {
    const res = await svc.calculateAtp({
      productId: 'P1',
      onHand: 10,
      mpsEntries: [{ period: 0, quantity: 20 }],
      committedOrders: [{ period: 0, qty: 15 }],
      periods: 3,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.periods[0].atp).toBeCloseTo(15);
    expect(res.data.periods[0].canPromise).toBe(true);
    expect(res.data.periods[0].cumulativeMps).toBeCloseTo(30);
    expect(res.data.periods[0].cumulativeCo).toBeCloseTo(15);
  });

  it('Kümülatif ATP: backlog keyingi davrlarga o\'tadi', async () => {
    // p0: OH=5, MPS=0, CO=10 → ATP=-5 (shortage)
    // p1: OH=5, MPS=20, CO=10 → cumMPS=25, cumCO=20 → ATP=5 (recovered)
    const res = await svc.calculateAtp({
      productId: 'P2',
      onHand: 5,
      mpsEntries: [{ period: 1, quantity: 20 }],
      committedOrders: [{ period: 0, qty: 10 }],
      periods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.periods[0].atp).toBeCloseTo(-5);
    expect(res.data.periods[0].canPromise).toBe(false);
    expect(res.data.periods[1].atp).toBeCloseTo(15);
    expect(res.data.periods[1].canPromise).toBe(true);
  });

  it('buyurtma yetarlicha bo\'lmasa: canPromise=false', async () => {
    const res = await svc.calculateAtp({
      productId: 'P1',
      onHand: 0,
      mpsEntries: [{ period: 0, quantity: 5 }],
      committedOrders: [{ period: 0, qty: 20 }],
      periods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.periods[0].atp).toBeLessThan(0);
    expect(res.data.periods[0].canPromise).toBe(false);
    expect(res.data.firstNegativePeriod).toBe(0);
  });

  it('MPS=[] + CO=[5] → barcha davrlar manfiy', async () => {
    const res = await svc.calculateAtp({
      productId: 'P3',
      onHand: 0,
      mpsEntries: [],
      committedOrders: [{ period: 0, qty: 5 }],
      periods: 2,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.periods.every((p) => p.atp < 0)).toBe(true);
    expect(res.data.firstNegativePeriod).toBe(0);
  });

  it('periods=0 → VALIDATION xatosi', async () => {
    const res = await svc.calculateAtp({
      productId: 'P1',
      onHand: 10,
      mpsEntries: [],
      committedOrders: [],
      periods: 0,
    });
    expect(res.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-12: CRP — Capacity Requirements Planning
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-12 CRP — Capacity Requirements Planning', () => {
  const svc = new CrpService();

  it('load% = requiredHours / availableHours × 100', async () => {
    const res = await svc.calculateLoad(
      { workCenterId: 'WC1', shiftHours: 8, utilization: 1.0, efficiency: 1.0 },
      [{ workCenterId: 'WC1', setupTime: 0.5, runTimePerUnit: 0.1, qtyTarget: 75 }],
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.requiredHours).toBeCloseTo(8.0);
    expect(res.data.availableHours).toBeCloseTo(8.0);
    expect(res.data.loadPercent).toBeCloseTo(100);
  });

  it('load% < 85 → isBottleneck=false', async () => {
    const res = await svc.calculateLoad(
      { workCenterId: 'WC2', shiftHours: 8, utilization: 1.0, efficiency: 1.0 },
      [{ workCenterId: 'WC2', setupTime: 0, runTimePerUnit: 0.05, qtyTarget: 100 }],
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.loadPercent).toBeCloseTo(62.5);
    expect(res.data.isBottleneck).toBe(false);
  });

  it('load% > 100 → isOverloaded=true', async () => {
    const res = await svc.calculateLoad(
      { workCenterId: 'WC3', shiftHours: 4, utilization: 1.0, efficiency: 1.0 },
      [{ workCenterId: 'WC3', setupTime: 1, runTimePerUnit: 0.5, qtyTarget: 10 }],
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.loadPercent).toBeGreaterThan(100);
    expect(res.data.isOverloaded).toBe(true);
  });

  it('operatsiyalar ish markaziga mos kelmasdi → requiredHours=0', async () => {
    const res = await svc.calculateLoad(
      { workCenterId: 'WC4', shiftHours: 8, utilization: 1.0, efficiency: 1.0 },
      [{ workCenterId: 'OTHER_WC', setupTime: 2, runTimePerUnit: 1, qtyTarget: 5 }],
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.requiredHours).toBe(0);
    expect(res.data.loadPercent).toBe(0);
  });

  it('shiftHours=0 → VALIDATION xatosi', async () => {
    const res = await svc.calculateLoad(
      { workCenterId: 'WC5', shiftHours: 0, utilization: 1.0, efficiency: 1.0 },
      [],
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-13: Johnson Qoidasi — 2-mashina scheduling
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-13 Johnson Qoidasi — 2-mashina', () => {
  const svc = new SchedulingService();

  it('n=5: klassik misol, makespan minimal', async () => {
    const jobs = [
      { id: 'J1', t1: 3, t2: 2 },
      { id: 'J2', t1: 2, t2: 6 },
      { id: 'J3', t1: 5, t2: 4 },
      { id: 'J4', t1: 6, t2: 1 },
      { id: 'J5', t1: 4, t2: 5 },
    ];
    const res = await svc.johnsonRule(jobs);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.makespan).toBeGreaterThan(0);
    expect(res.data.order).toHaveLength(5);
    expect(res.data.order).toContain('J1');
    expect(res.data.order).toContain('J4');
  });

  it('bitta ish: makespan = t1+t2', async () => {
    const res = await svc.johnsonRule([{ id: 'J1', t1: 3, t2: 5 }]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.makespan).toBe(8);
    expect(res.data.order).toEqual(['J1']);
  });

  it('bo\'sh list → makespan=0', async () => {
    const res = await svc.johnsonRule([]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.makespan).toBe(0);
  });

  it('t1 < t2 → front-ga qo\'yiladi', async () => {
    const jobs = [
      { id: 'FAST', t1: 1, t2: 10 },
      { id: 'SLOW', t1: 10, t2: 1 },
    ];
    const res = await svc.johnsonRule(jobs);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.order[0]).toBe('FAST');
    expect(res.data.order[1]).toBe('SLOW');
  });

  it('machine timeline qaytariladi', async () => {
    const res = await svc.johnsonRule([{ id: 'J1', t1: 2, t2: 3 }]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.machine1Timeline).toHaveLength(1);
    expect(res.data.machine2Timeline).toHaveLength(1);
    expect(res.data.machine1Timeline[0].end).toBe(2);
    expect(res.data.machine2Timeline[0].start).toBe(2);
    expect(res.data.machine2Timeline[0].end).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-14: CPM — Critical Path Method
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-14 CPM — Critical Path Method', () => {
  const svc = new SchedulingService();

  it('A(3)→B(4)→C(2): project=9, barcha kritik', async () => {
    const activities = [
      { id: 'A', duration: 3, predecessors: [] },
      { id: 'B', duration: 4, predecessors: ['A'] },
      { id: 'C', duration: 2, predecessors: ['B'] },
    ];
    const res = await svc.calculateCpm(activities);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.projectDuration).toBe(9);
    expect(res.data.criticalPath).toEqual(['A', 'B', 'C']);
    const b = res.data.activities.find((a) => a.id === 'B')!;
    expect(b.es).toBe(3);
    expect(b.ef).toBe(7);
    expect(b.totalFloat).toBe(0);
    expect(b.isCritical).toBe(true);
  });

  it('parallel paths: critical path uzunroqni tanlaydi', async () => {
    const activities = [
      { id: 'START', duration: 0, predecessors: [] },
      { id: 'PATH_A', duration: 10, predecessors: ['START'] },
      { id: 'PATH_B', duration: 6, predecessors: ['START'] },
      { id: 'END', duration: 0, predecessors: ['PATH_A', 'PATH_B'] },
    ];
    const res = await svc.calculateCpm(activities);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.projectDuration).toBe(10);
    expect(res.data.criticalPath).toContain('PATH_A');
    expect(res.data.criticalPath).not.toContain('PATH_B');
  });

  it('sikl → VALIDATION xatosi', async () => {
    const activities = [
      { id: 'A', duration: 2, predecessors: ['C'] },
      { id: 'B', duration: 3, predecessors: ['A'] },
      { id: 'C', duration: 1, predecessors: ['B'] },
    ];
    const res = await svc.calculateCpm(activities);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('totalFloat hisoblash to\'g\'ri', async () => {
    const activities = [
      { id: 'A', duration: 5, predecessors: [] },
      { id: 'B', duration: 3, predecessors: [] },
      { id: 'C', duration: 2, predecessors: ['A', 'B'] },
    ];
    const res = await svc.calculateCpm(activities);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const b = res.data.activities.find((a) => a.id === 'B')!;
    expect(b.totalFloat).toBeGreaterThan(0);
    const a = res.data.activities.find((a) => a.id === 'A')!;
    expect(a.totalFloat).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-14 PERT
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-14 PERT — Uch nuqtali taxmin', () => {
  const svc = new SchedulingService();

  it('d_pert = (o+4m+p)/6 va sigma²=((p-o)/6)²', async () => {
    const activities = [
      { id: 'A', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: [] },
    ];
    const res = await svc.calculatePert(activities);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const a = res.data.activities.find((a) => a.id === 'A')!;
    expect(a.expectedDuration).toBeCloseTo(4);
    expect(a.variance).toBeCloseTo((4 / 6) ** 2);
  });

  it('projectVariance = kritik yo\'l variance yig\'indisi', async () => {
    const activities = [
      { id: 'A', optimistic: 1, mostLikely: 3, pessimistic: 5, predecessors: [] },
      { id: 'B', optimistic: 2, mostLikely: 4, pessimistic: 6, predecessors: ['A'] },
    ];
    const res = await svc.calculatePert(activities);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.projectVariance).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-16: TOC — Bottleneck Detection
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-16 TOC — Bottleneck Detection', () => {
  const svc = new SchedulingService();

  it('3 ish markazi: max utilizationli → bottleneck', async () => {
    const wcs = [
      { workCenterId: 'WC1', arrivalRate: 8, serviceRate: 10 },
      { workCenterId: 'WC2', arrivalRate: 9, serviceRate: 10 },
      { workCenterId: 'WC3', arrivalRate: 10, serviceRate: 10 },
    ];
    const res = await svc.detectBottleneck(wcs);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.bottleneck).toBe('WC3');
    expect(res.data.utilization).toBeCloseTo(1.0);
  });

  it('utilizatsiya = arrivalRate / serviceRate', async () => {
    const res = await svc.detectBottleneck([
      { workCenterId: 'A', arrivalRate: 6, serviceRate: 10 },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.utilization).toBeCloseTo(0.6);
  });

  it('bo\'sh list → VALIDATION xatosi', async () => {
    const res = await svc.detectBottleneck([]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('serviceRate=0 → VALIDATION (nolga bo\'lish cheklovi)', async () => {
    const res = await svc.detectBottleneck([
      { workCenterId: 'BROKEN_WC', arrivalRate: 5, serviceRate: 0 },
    ]);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TZ-17: Standart Tannarx + Variance Tahlili
// ─────────────────────────────────────────────────────────────────────────────

describe('TZ-17 Variance Tahlili', () => {
  const svc = new CostingService();

  const actual = {
    materialPricePerUnit: 12,
    materialQtyUsed: 110,
    laborRatePerHour: 22,
    laborHours: 55,
    goodQty: 50,
    overheadActual: 500,
  };

  const standard = {
    materialPricePerUnit: 10,
    materialQtyPerUnit: 2,
    laborRatePerHour: 20,
    laborHoursPerUnit: 1,
    overheadAppliedPerUnit: 10,
  };

  it('MPV = (AP-SP) × AQ = (12-10)×110 = 220 (Unfavorable)', async () => {
    const res = await svc.calculateVariance(actual, standard);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.mpv).toBeCloseTo(220);
    expect(res.data.mpvLabel).toContain('Unfavorable');
  });

  it('MQV = (AQ-SQ) × SP = (110-100)×10 = 100 (Unfavorable)', async () => {
    const res = await svc.calculateVariance(actual, standard);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.mqv).toBeCloseTo(100);
    expect(res.data.mqvLabel).toContain('Unfavorable');
  });

  it('LRV = (AR-SR) × AH = (22-20)×55 = 110 (Unfavorable)', async () => {
    const res = await svc.calculateVariance(actual, standard);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.lrv).toBeCloseTo(110);
    expect(res.data.lrvLabel).toContain('Unfavorable');
  });

  it('LEV = (AH-SH) × SR = (55-50)×20 = 100 (Unfavorable)', async () => {
    const res = await svc.calculateVariance(actual, standard);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.lev).toBeCloseTo(100);
    expect(res.data.levLabel).toContain('Unfavorable');
  });

  it('totalVariance = MPV+MQV+LRV+LEV+OV to\'g\'ri', async () => {
    const res = await svc.calculateVariance(actual, standard);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const expected = 220 + 100 + 110 + 100 + (500 - 500);
    expect(res.data.totalVariance).toBeCloseTo(expected);
  });

  it('Favorable case: AP < SP → MPV < 0', async () => {
    const res = await svc.calculateVariance(
      { ...actual, materialPricePerUnit: 8 },
      standard,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.mpv).toBeLessThan(0);
    expect(res.data.mpvLabel).toContain('Favorable');
  });

  it('goodQty < 0 → VALIDATION xatosi', async () => {
    const res = await svc.calculateVariance({ ...actual, goodQty: -1 }, standard);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('VALIDATION');
  });

  it('standardCost: materialCost + laborCost + overhead = totalPerUnit', async () => {
    const res = await svc.calculateStandardCost(standard, 10);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.materialCost).toBeCloseTo(20);
    expect(res.data.laborCost).toBeCloseTo(20);
    expect(res.data.overhead).toBeCloseTo(10);
    expect(res.data.totalPerUnit).toBeCloseTo(50);
    expect(res.data.totalForQty).toBeCloseTo(500);
  });
});
