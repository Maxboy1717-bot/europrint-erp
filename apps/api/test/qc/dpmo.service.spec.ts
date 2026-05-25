/**
 * test/qc/dpmo.service.spec.ts
 *
 * DpmoService — DPMO and Six-Sigma level. Pure compute except for the
 * getProcessDpmoData helper, which we cover separately.
 *   DPMO    = (defects / (opportunities × units)) × 1_000_000
 *   sigma   = Φ⁻¹(1 − dpmo/10⁶) + 1.5 (Motorola shift), clamped at 0
 *   cp/cpk  = computed only when usl/lsl/processMean/processSigma all supplied
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { DpmoService } from '../../src/modules/qc/domain/services/dpmo.service';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.Mock;

describe('DpmoService.calculate', () => {
  const svc = new DpmoService();

  it('rejects negative defects with VALIDATION', async () => {
    const r = await svc.calculate({ defects: -1, opportunities: 1, units: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('VALIDATION');
  });

  it('rejects non-positive opportunities or units', async () => {
    const r1 = await svc.calculate({ defects: 0, opportunities: 0, units: 1 });
    const r2 = await svc.calculate({ defects: 0, opportunities: 1, units: 0 });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
  });

  it('returns world-class label and a sigma above 6 for zero defects', async () => {
    const r = await svc.calculate({ defects: 0, opportunities: 5, units: 100 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dpmo).toBe(0);
    expect(r.data.sigmaLevel).toBeGreaterThanOrEqual(6);
    expect(r.data.qualityLevel).toContain('World Class');
  });

  it('produces DPMO = 10000 from 1 defect per 100 opportunities and 1 unit', async () => {
    const r = await svc.calculate({ defects: 1, opportunities: 100, units: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.dpmo).toBeCloseTo(10_000, 2);
  });

  it('omits Cp / Cpk when process inputs are not supplied', async () => {
    const r = await svc.calculate({ defects: 5, opportunities: 10, units: 100 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.cp).toBeUndefined();
    expect(r.data.cpk).toBeUndefined();
  });

  it('computes Cp and Cpk when usl / lsl / processMean / processSigma provided', async () => {
    const r = await svc.calculate({
      defects: 5, opportunities: 10, units: 100,
      usl: 110, lsl: 90, processMean: 100, processSigma: 2,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.cp).toBeCloseTo((110 - 90) / (6 * 2), 4);
    expect(r.data.cpk).toBeCloseTo(Math.min((110 - 100) / 6, (100 - 90) / 6), 4);
  });
});

describe('DpmoService.getProcessDpmoData', () => {
  beforeEach(() => mockRun.mockReset());

  it('returns sums from qc_inspections aggregation', async () => {
    mockRun.mockResolvedValueOnce([{ defects: 4, items_checked: 200 }]);
    const svc = new DpmoService();

    const data = await svc.getProcessDpmoData('PO-1');

    expect(data).toEqual({ defects: 4, itemsChecked: 200 });
  });

  it('floors itemsChecked at 1 to avoid div-by-zero downstream', async () => {
    mockRun.mockResolvedValueOnce([{ defects: 0, items_checked: 0 }]);
    const svc = new DpmoService();

    const data = await svc.getProcessDpmoData('PO-2');

    expect(data.itemsChecked).toBe(1);
  });
});
