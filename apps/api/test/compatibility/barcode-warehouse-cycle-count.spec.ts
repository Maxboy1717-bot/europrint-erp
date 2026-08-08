/**
 * test/compatibility/barcode-warehouse-cycle-count.spec.ts
 *
 * M4 (Magic-Numbers Fix Loop, 2026-07-05): submitCycleCount()'s auto-adjust/
 * supervisor-approval variance thresholds now read settings.'cycle_count_
 * auto_adjust_pct'/'cycle_count_supervisor_pct' first, falling back to 2%/5%.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { BarcodeWarehouseCompatService } from '../../src/modules/compatibility/barcode-warehouse.service';
import { rawSql } from '@shared/db';

describe('BarcodeWarehouseCompatService.submitCycleCount()', () => {
  let svc: BarcodeWarehouseCompatService;

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
    svc = new BarcodeWarehouseCompatService();
  });

  it('falls back to 2%/5% defaults when settings has no override rows', async () => {
    (rawSql as jest.Mock).mockResolvedValue({ rows: [] });

    const r1 = await svc.submitCycleCount({ countedQuantity: 100, systemQuantity: 100 }); // 0%
    expect(r1.adjustmentAction).toBe('AUTO_ADJUST');

    const r2 = await svc.submitCycleCount({ countedQuantity: 103, systemQuantity: 100 }); // 3%
    expect(r2.adjustmentAction).toBe('SUPERVISOR_APPROVAL');

    const r3 = await svc.submitCycleCount({ countedQuantity: 110, systemQuantity: 100 }); // 10%
    expect(r3.adjustmentAction).toBe('RECOUNT');
  });

  it('uses a configured auto-adjust threshold from settings when present', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [{ value: '10' }] }); // auto_adjust_pct
    (rawSql as jest.Mock).mockResolvedValueOnce({ rows: [] });                // supervisor_pct fallback

    // 8% variance would normally be SUPERVISOR_APPROVAL (>2%), but with a
    // configured 10% auto-adjust threshold it should now auto-adjust.
    const r = await svc.submitCycleCount({ countedQuantity: 108, systemQuantity: 100 });
    expect(r.adjustmentAction).toBe('AUTO_ADJUST');
  });
});
