/**
 * qc-spc-fmea.spec.ts — Task #431 Sprint 3A
 *
 * TZ-D10: OEE clamp [0, 100] — hech qachon >100 yoki <0 chiqmaydi
 * TZ-D11: p-chart UCL/LCL + Western Electric 4 qoidasi
 * TZ-30:  X-bar/R + Cp/Cpk
 * TZ-31:  DPMO + Six Sigma darajasi
 * TZ-32:  FMEA RPN = S × O × D
 * TZ-33:  Pareto 80/20
 * TZ-34:  %TAC + Ink Consumption
 * TZ-35:  FFDH Imposition
 * TZ-36:  Make-Ready Setup Time
 * TZ-37:  Spoilage / Waste Rate
 * TZ-38:  Delta-E CIEDE2000
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
  rawSql: jest.fn(),
}));

import { OeeCalculatorService } from '../src/modules/iot/oee/oee-calculator.service';
import { DefectDetectorService } from '../src/modules/qc/domain/services/defect-detector.service';
import { SpcService } from '../src/modules/qc/domain/services/spc.service';
import { FmeaService } from '../src/modules/qc/domain/services/fmea.service';
import { InkConsumptionService } from '../src/modules/qc/domain/services/ink-consumption.service';
import { ImpositionService } from '../src/modules/qc/domain/services/imposition.service';
import { SpoilageService } from '../src/modules/qc/domain/services/spoilage.service';
import { DeltaEService } from '../src/modules/qc/domain/services/delta-e.service';

// ============================================================================
// TZ-D10: OEE clamp
// ============================================================================
describe('OeeCalculatorService — TZ-D10', () => {
  let svc: OeeCalculatorService;
  beforeEach(() => { svc = new OeeCalculatorService(); });

  it('normal ish: A=0.9, P~0.95, Q=0.99 → OEE < 100', async () => {
    const r = await svc.calculate({ plannedProductionTime:100, runTime:90, idealCycleTime:1, actualQuantity:85, defectQuantity:1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.oee).toBeGreaterThan(0);
      expect(r.data.oee).toBeLessThanOrEqual(100);
    }
  });

  it('OEE hech qachon > 100 — 100 ta random kirish', async () => {
    for (let i = 0; i < 100; i++) {
      const PT = Math.floor(Math.random() * 480) + 1;
      const RT = Math.floor(Math.random() * PT);
      const IT = Math.random() * 2;
      const AQ = Math.floor(Math.random() * 1000) + 1;
      const DQ = Math.floor(Math.random() * AQ);
      const r = await svc.calculate({ plannedProductionTime:PT, runTime:RT, idealCycleTime:IT, actualQuantity:AQ, defectQuantity:DQ });
      if (r.ok) {
        expect(r.data.oee).toBeLessThanOrEqual(100);
        expect(r.data.oee).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('runTime > plannedProductionTime → Err', async () => {
    const r = await svc.calculate({ plannedProductionTime:60, runTime:90, idealCycleTime:1, actualQuantity:100, defectQuantity:0 });
    expect(r.ok).toBe(false);
  });

  it('defectQuantity > actualQuantity → Err', async () => {
    const r = await svc.calculate({ plannedProductionTime:60, runTime:50, idealCycleTime:1, actualQuantity:50, defectQuantity:60 });
    expect(r.ok).toBe(false);
  });

  it('PT=0 → availability=0, OEE=0', async () => {
    const r = await svc.calculate({ plannedProductionTime:0, runTime:0, idealCycleTime:1, actualQuantity:0, defectQuantity:0 });
    if (r.ok) {
      expect(r.data.availability).toBe(0);
      expect(r.data.oee).toBe(0);
    }
  });

  it('eski calculateOee interfeys clamp bilan ishlaydi', () => {
    // performance = 200/100 = 2 → clamp(2,0,1)×100 = 100
    const r = svc.calculateOee({ plannedProductionTime:100, actualRunningTime:100, targetQuantity:100, actualQuantity:200, defectQuantity:0 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.performance).toBeLessThanOrEqual(100);
      expect(r.data.oee).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================================================
// TZ-D11: p-chart + Western Electric
// ============================================================================
describe('DefectDetectorService — TZ-D11', () => {
  let svc: DefectDetectorService;
  beforeEach(() => { svc = new DefectDetectorService(); });

  it('UCL/LCL to\'g\'ri hisoblanadi (p̄=0.05, n=100)', async () => {
    const history = Array.from({ length: 10 }, () => ({ sampleSize: 100, defects: 5 }));
    const r = await svc.computePChart(history, 100, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.pBar).toBeCloseTo(0.05, 4);
      expect(r.data.ucl).toBeGreaterThan(r.data.pBar);
      expect(r.data.lcl).toBeGreaterThanOrEqual(0);
    }
  });

  it('UCL dan oshgan nuqta → isOutOfControl=true (Qoida 1)', async () => {
    const history = Array.from({ length: 20 }, () => ({ sampleSize: 100, defects: 5 }));
    // p̄≈0.05, sigma≈0.022, UCL≈0.116 → 25 defect (25%) aniq tashqarida
    const r = await svc.computePChart(history, 100, 25);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isOutOfControl).toBe(true);
      expect(r.data.violations).toContain('RULE_1_3SIGMA');
    }
  });

  it('defects > sampleSize → Err', async () => {
    const r = await svc.computePChart([], 50, 60);
    expect(r.ok).toBe(false);
  });

  it('Western Electric Qoida 4 — 8 ta bir tomonda', () => {
    const center = 0.1;
    const sigma  = 0.01;
    const allAbove = Array.from({ length: 8 }, () => center + 0.005);
    const v = svc._westernElectricRules(allAbove, center, sigma);
    expect(v).toContain('RULE_4_8_RUN');
  });

  it('Western Electric Qoida 2 — 3 dan 2 tasi 2σ BIR TOMONDA (yuqori)', () => {
    const center = 0.1;
    const sigma  = 0.01;
    // ikkitasi yuqori 2σ dan, bittasi normal — same-side trigger
    const pts = [center, center + 0.025, center + 0.025, center - 0.005];
    const v = svc._westernElectricRules(pts, center, sigma);
    expect(v).toContain('RULE_2_2OF3_2SIGMA');
  });

  it('Western Electric Qoida 2 — qarama-qarshi tomonda 2σ → TRIGGER YO\'Q', () => {
    const center = 0.1;
    const sigma  = 0.01;
    // bittasi yuqori, bittasi pastda 2σ — aralash, trigger bo'lmasligi kerak
    const pts = [center, center + 0.025, center - 0.025, center];
    const v = svc._westernElectricRules(pts, center, sigma);
    expect(v).not.toContain('RULE_2_2OF3_2SIGMA');
  });

  it('hech qanday qoida buzilmasa — violations bo\'sh', () => {
    const pts = Array.from({ length: 10 }, () => 0.05);
    const v = svc._westernElectricRules(pts, 0.05, 0.01);
    expect(v).toHaveLength(0);
  });
});

// ============================================================================
// TZ-30: X-bar/R + Cp/Cpk
// ============================================================================
describe('SpcService — TZ-30', () => {
  let svc: SpcService;
  beforeEach(() => { svc = new SpcService(); });

  it('X-bar/R hisoblanadi (n=5)', async () => {
    const subgroups = [
      { values: [10.1, 10.2, 9.9, 10.0, 10.1] },
      { values: [10.0, 10.3, 9.8, 10.1, 10.2] },
      { values: [10.2, 10.1, 10.0, 9.9, 10.1] },
    ];
    const r = await svc.computeXbarR(subgroups, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.uclX).toBeGreaterThan(r.data.grandMean);
      expect(r.data.lclX).toBeLessThan(r.data.grandMean);
      expect(r.data.uclR).toBeGreaterThan(0);
      expect(r.data.sigma).toBeGreaterThan(0);
    }
  });

  it('Cp/Cpk hisoblanadi', async () => {
    const r = await svc.computeCapability(10.0, 0.05, 10.15, 9.85);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.cp).toBeCloseTo(1.0, 1);
      expect(r.data.cpk).toBeLessThanOrEqual(r.data.cp);
    }
  });

  it('Cp ≥ 1.33 → isCapable=true', async () => {
    const r = await svc.computeCapability(10.0, 0.03, 10.2, 9.8);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.data.isCapable).toBe(true); }
  });

  it('kamida 2 subgroup kerak', async () => {
    const r = await svc.computeXbarR([{ values: [1,2,3,4,5] }], 5);
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-31 + TZ-32 + TZ-33: DPMO, FMEA, Pareto
// ============================================================================
describe('FmeaService — TZ-31/32/33', () => {
  let svc: FmeaService;
  beforeEach(() => { svc = new FmeaService(); });

  it('RPN = S × O × D (7×8×6 = 336)', async () => {
    const r = await svc.calculateRpn(7, 8, 6);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.rpn).toBe(336);
      expect(r.data.priority).toBe('CRITICAL');
      expect(r.data.requiresStopProduction).toBe(true);
    }
  });

  it('RPN > 100 → requiresMitigation=true', async () => {
    const r = await svc.calculateRpn(5, 5, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.rpn).toBe(125);
      expect(r.data.requiresMitigation).toBe(true);
    }
  });

  it('S=0 (noto\'g\'ri qiymat) → Err', async () => {
    const r = await svc.calculateRpn(0, 5, 5);
    expect(r.ok).toBe(false);
  });

  it('S=11 (chegara tashqarisida) → Err', async () => {
    const r = await svc.calculateRpn(11, 5, 5);
    expect(r.ok).toBe(false);
  });

  it('DPMO: 3.4 → 6σ (world-class)', async () => {
    const r = await svc.calculateDpmo(3.4, 1_000_000, 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isWorldClass).toBe(true);
      expect(r.data.sigmaLevel).toBeGreaterThanOrEqual(5.9);
    }
  });

  it('DPMO: 66807 → ~3σ', async () => {
    const r = await svc.calculateDpmo(66807, 1_000_000, 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.sigmaLevel).toBeGreaterThanOrEqual(2.8);
      expect(r.data.sigmaLevel).toBeLessThan(3.5);
    }
  });

  it('Pareto: vital few 80/20 aniqlanadi', async () => {
    const r = await svc.paretoAnalysis({ A: 50, B: 30, C: 10, D: 5, E: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const vital = r.data.filter(x => x.isVital);
      expect(vital.length).toBeGreaterThan(0);
      expect(r.data[0].cumulative).toBeLessThanOrEqual(80.5);
    }
  });
});

// ============================================================================
// TZ-34: %TAC + Ink Consumption
// ============================================================================
describe('InkConsumptionService — TZ-34', () => {
  let svc: InkConsumptionService;
  beforeEach(() => { svc = new InkConsumptionService(); });

  it('normal holat: TAC < 280% (kitob)', async () => {
    const r = await svc.estimateInkConsumption({ c: 0.3, m: 0.3, y: 0.3, k: 0.3 }, 1000, 0.25, 'book');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tac).toBeCloseTo(120, 0);
      expect(r.data.tacWithinLimit).toBe(true);
      expect(r.data.totalInkGrams).toBeGreaterThan(0);
    }
  });

  it('TAC > 240% gazeta uchun → Err', async () => {
    const r = await svc.estimateInkConsumption({ c: 0.7, m: 0.7, y: 0.7, k: 0.7 }, 100, 0.25, 'newspaper');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('BAD_REQUEST');
    }
  });

  it('TAC = C+M+Y+K to\'g\'ri hisoblanadi', async () => {
    const r = await svc.estimateInkConsumption({ c: 0.5, m: 0.2, y: 0.2, k: 0.1 }, 100, 1.0, 'book');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tac).toBeCloseTo(100, 1);
    }
  });

  it('coverage > 1 → Err', async () => {
    const r = await svc.estimateInkConsumption({ c: 1.5, m: 0.1, y: 0.1, k: 0.1 }, 100, 1.0, 'book');
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-35: FFDH Imposition
// ============================================================================
describe('ImpositionService — TZ-35 (FFDH)', () => {
  let svc: ImpositionService;
  beforeEach(() => { svc = new ImpositionService(); });

  it('A4 varag\'iga 4 ta mahsulot joylanadi', async () => {
    const items = [
      { id: 'p1', width: 100, height: 140 },
      { id: 'p2', width: 100, height: 140 },
      { id: 'p3', width: 100, height: 140 },
      { id: 'p4', width: 100, height: 140 },
    ];
    const r = await svc.pack(items, 420, 297);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.placed.length).toBeGreaterThan(0);
      expect(r.data.utilization).toBeGreaterThan(0);
      expect(r.data.utilization).toBeLessThanOrEqual(100);
    }
  });

  it('varag\'dan katta mahsulot → unplaced', async () => {
    const r = await svc.pack([{ id: 'big', width: 500, height: 500 }], 100, 100);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.unplaced).toContain('big');
    }
  });

  it('utilization 0-100 oralig\'ida', async () => {
    const items = [{ id: 'a', width: 50, height: 50 }, { id: 'b', width: 50, height: 50 }];
    const r = await svc.pack(items, 200, 200);
    if (r.ok) {
      expect(r.data.utilization).toBeGreaterThanOrEqual(0);
      expect(r.data.utilization).toBeLessThanOrEqual(100);
    }
  });

  it('quantity=3 → 3 nusxa joylashtiriladi', async () => {
    const items = [{ id: 'x', width: 50, height: 50, quantity: 3 }];
    const r = await svc.pack(items, 200, 100);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const placedX = r.data.placed.filter(p => p.id === 'x');
      expect(placedX.length).toBe(3);
    }
  });

  it('kichik varag\'da ko\'p mahsulot → multi-sheet', async () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, width: 60, height: 60, quantity: 1 }));
    const r = await svc.pack(items, 100, 100);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 100×100 varag'ga max 1 ta 60×60 item sig'adi (60<100), 6 ta joylashtirilsa sheets>1
      expect(r.data.sheets).toBeGreaterThan(1);
    }
  });
});

// ============================================================================
// TZ-36 + TZ-37: Make-Ready + Spoilage
// ============================================================================
describe('SpoilageService — TZ-36/37', () => {
  let svc: SpoilageService;
  beforeEach(() => { svc = new SpoilageService(); });

  it('t_total = setup + run×Q + cleanup (TZ-36)', async () => {
    const r = await svc.calculateMakeReady(30, 0.5, 1000, 15);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.totalMinutes).toBeCloseTo(545, 0);
      expect(r.data.runTime).toBeCloseTo(500, 0);
    }
  });

  it('4rangli bosma: 3% standart, > 6% → alarm (TZ-37)', async () => {
    const r = await svc.calculate(70, 1000, '4color', 1, 0.5, 0.2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.actualRate).toBeCloseTo(7, 1);
      expect(r.data.isAlarm).toBe(true);
    }
  });

  it('normal isrof < 2× standart → alarm yo\'q', async () => {
    const r = await svc.calculate(20, 1000, '4color', 1, 0.5, 0.2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isAlarm).toBe(false);
    }
  });

  it('defectiveSheets > totalSheets → Err', async () => {
    const r = await svc.calculate(200, 100, '4color', 1, 0.5, 0.2);
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-38: Delta-E CIEDE2000
// ============================================================================
describe('DeltaEService — TZ-38 (CIEDE2000)', () => {
  let svc: DeltaEService;
  beforeEach(() => { svc = new DeltaEService(); });

  it('bir xil rang → ΔE ≈ 0', async () => {
    const r = await svc.compute({ L: 50, a: 20, b: 10 }, { L: 50, a: 20, b: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.deltaE).toBeLessThan(0.001);
      expect(r.data.grade).toBe('PASS');
    }
  });

  it('ΔE < 1 → PASS', async () => {
    const r = await svc.compute({ L: 50, a: 10, b: 10 }, { L: 50.5, a: 10.1, b: 10.1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isPass).toBe(true);
      expect(r.data.grade).toBe('PASS');
    }
  });

  it('katta rang farqi → SCRAP (ΔE > 5)', async () => {
    const r = await svc.compute({ L: 50, a: 0, b: 0 }, { L: 80, a: 30, b: -20 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.isScrap).toBe(true);
      expect(r.data.grade).toBe('SCRAP');
    }
  });

  it('ΔE 1-3 → REVIEW', async () => {
    const r = await svc.compute({ L: 50, a: 0, b: 0 }, { L: 52, a: 0, b: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.grade).toBe('REVIEW');
    }
  });
});
