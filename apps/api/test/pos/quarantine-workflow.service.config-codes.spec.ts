/**
 * test/pos/quarantine-workflow.service.config-codes.spec.ts
 *
 * MN-1 (Magic-Numbers Independent Verification 2026-07-07, M6 2/4 gap): the
 * 'RM-MAIN'/'QC-HOLD' quarantine routing codes are now settings-table-tunable
 * via getConfigString('quarantine_hold_warehouse_code'|'quarantine_source_warehouse_code', ...),
 * falling back to the prior hardcoded codes when unset. This proves the config
 * value is actually read and used to select which warehouse row to route to,
 * not just that the fallback path still works.
 */

const mockGetConfigString = jest.fn();
jest.mock('@common/config/business-config.helper', () => ({
  getConfigString: (...args: unknown[]) => mockGetConfigString(...args),
}));

import { QuarantineWorkflowService } from '../../src/modules/pos/application/services/quarantine-workflow.service';

const LINES = [{ material_card_id: 5, quantity: '10', unit: 'dona' }];

describe('QuarantineWorkflowService — MN-1 config-driven warehouse codes', () => {
  let repo: {
    findMovementBasic: jest.Mock; updateInventoryPassport: jest.Mock; updateMovementStatus: jest.Mock;
    findWarehousesByCode: jest.Mock; findQcHoldWarehouse: jest.Mock; findMovementLines: jest.Mock;
    reduceWarehouseStock: jest.Mock; upsertWarehouseStock: jest.Mock; escalateExpiredQuarantine: jest.Mock;
  };
  let service: QuarantineWorkflowService;

  beforeEach(() => {
    mockGetConfigString.mockReset();
    repo = {
      findMovementBasic: jest.fn().mockResolvedValue({ id: 1, movement_number: 'M-1', movement_type: 'EXTERNAL_IN', status: 'qc_pending', created_by: 9 }),
      updateInventoryPassport: jest.fn().mockResolvedValue(undefined),
      updateMovementStatus: jest.fn().mockResolvedValue(undefined),
      findWarehousesByCode: jest.fn().mockResolvedValue([{ id: 99, code: 'RM-ALT' }, { id: 20, code: 'QC-HOLD' }]),
      findQcHoldWarehouse: jest.fn().mockResolvedValue({ id: 20 }),
      findMovementLines: jest.fn().mockResolvedValue(LINES),
      reduceWarehouseStock: jest.fn().mockResolvedValue(true),
      upsertWarehouseStock: jest.fn().mockResolvedValue(undefined),
      escalateExpiredQuarantine: jest.fn().mockResolvedValue([]),
    };
    service = new QuarantineWorkflowService(repo as never, { recordConfirmation: jest.fn().mockResolvedValue(undefined) } as never, { emit: jest.fn() } as never);
  });

  it('moveToQuarantine passes the configured hold-warehouse code (not a hardcoded literal) to the repo', async () => {
    mockGetConfigString.mockResolvedValue('QC-HOLD-ALT');

    await service.moveToQuarantine(1);

    expect(mockGetConfigString).toHaveBeenCalledWith('quarantine_hold_warehouse_code', 'QC-HOLD');
    expect(repo.findQcHoldWarehouse).toHaveBeenCalledWith('QC-HOLD-ALT');
  });

  it('moveToQuarantine falls back to QC-HOLD when settings has no override', async () => {
    mockGetConfigString.mockResolvedValue('QC-HOLD');

    await service.moveToQuarantine(1);

    expect(repo.findQcHoldWarehouse).toHaveBeenCalledWith('QC-HOLD');
  });

  it("qcDecision(QABUL) resolves BOTH codes from settings and routes to the configured source warehouse (not the 'RM-MAIN' literal)", async () => {
    mockGetConfigString.mockImplementation((key: string) =>
      Promise.resolve(key === 'quarantine_source_warehouse_code' ? 'RM-ALT' : 'QC-HOLD'),
    );

    const result = await service.qcDecision(1, 'QABUL', undefined, 9);

    expect(result.ok).toBe(true);
    expect(repo.findWarehousesByCode).toHaveBeenCalledWith(['RM-ALT', 'QC-HOLD']);
    // 99 is RM-ALT's id in the mocked findWarehousesByCode response above.
    expect(repo.upsertWarehouseStock).toHaveBeenCalledWith(99, 5, 10, 'dona');
  });

  it('qcDecision(CHIQARISH) resolves the hold-warehouse code from settings before reducing stock', async () => {
    mockGetConfigString.mockResolvedValue('QC-HOLD-ALT');

    const result = await service.qcDecision(1, 'CHIQARISH', undefined, 9);

    expect(result.ok).toBe(true);
    expect(repo.findQcHoldWarehouse).toHaveBeenCalledWith('QC-HOLD-ALT');
  });
});
