/**
 * test/pos/quarantine-workflow.service.reduce-guard.spec.ts
 *
 * C1.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): reduceWarehouseStock() used to
 * GREATEST(quantity-qty,0)-clamp an oversell to zero instead of rejecting it — a QC decision
 * claiming to move/discard more stock than QC-HOLD actually has would silently succeed with a
 * WRONG (clamped) result, and (in the QABUL/accept path) still credit RM-MAIN with the full
 * claimed quantity even though QC-HOLD was never actually debited that much. The repository now
 * returns a boolean; the service must not credit the destination warehouse when the guard
 * fails, and must log rather than silently succeed.
 */

import { QuarantineWorkflowService } from '../../src/modules/pos/application/services/quarantine-workflow.service';

const MOVEMENT = { id: 1, movement_number: 'M-1', movement_type: 'EXTERNAL_IN', status: 'qc_pending', created_by: 9 };
const WAREHOUSES = [{ id: 10, code: 'RM-MAIN' }, { id: 20, code: 'QC-HOLD' }];
const LINES = [{ material_card_id: 5, quantity: '10', unit: 'dona' }];

describe('QuarantineWorkflowService.qcDecision — C1.6 oversell guard', () => {
  let repo: {
    findMovementBasic: jest.Mock; updateInventoryPassport: jest.Mock; updateMovementStatus: jest.Mock;
    findWarehousesByCode: jest.Mock; findQcHoldWarehouse: jest.Mock; findMovementLines: jest.Mock;
    reduceWarehouseStock: jest.Mock; upsertWarehouseStock: jest.Mock;
  };
  let stockLedger: { recordConfirmation: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let service: QuarantineWorkflowService;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    repo = {
      findMovementBasic: jest.fn().mockResolvedValue(MOVEMENT),
      updateInventoryPassport: jest.fn().mockResolvedValue(undefined),
      updateMovementStatus: jest.fn().mockResolvedValue(undefined),
      findWarehousesByCode: jest.fn().mockResolvedValue(WAREHOUSES),
      findQcHoldWarehouse: jest.fn().mockResolvedValue({ id: 20 }),
      findMovementLines: jest.fn().mockResolvedValue(LINES),
      reduceWarehouseStock: jest.fn(),
      upsertWarehouseStock: jest.fn().mockResolvedValue(undefined),
    };
    stockLedger = { recordConfirmation: jest.fn().mockResolvedValue(undefined) };
    eventEmitter = { emit: jest.fn() };
    service = new QuarantineWorkflowService(repo as never, stockLedger as never, eventEmitter as never);
    warnSpy = jest.spyOn((service as unknown as { logger: { warn: (m: string) => void } }).logger, 'warn').mockImplementation(() => undefined);
  });

  it('QABUL: does not credit RM-MAIN when the guarded reduce fails (insufficient QC-HOLD stock)', async () => {
    repo.reduceWarehouseStock.mockResolvedValue(false);

    const result = await service.qcDecision(1, 'QABUL', undefined, 9);

    expect(result.ok).toBe(true); // per-line skip, not a whole-operation failure
    expect(repo.upsertWarehouseStock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('yetarli qoldiq yo\'q'));
  });

  it('QABUL: credits RM-MAIN normally when the guarded reduce succeeds', async () => {
    repo.reduceWarehouseStock.mockResolvedValue(true);

    const result = await service.qcDecision(1, 'QABUL', undefined, 9);

    expect(result.ok).toBe(true);
    expect(repo.upsertWarehouseStock).toHaveBeenCalledWith(10, 5, 10, 'dona');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('CHIQARISH: logs a warning (not a crash) when the guarded reduce fails', async () => {
    repo.reduceWarehouseStock.mockResolvedValue(false);

    const result = await service.qcDecision(1, 'CHIQARISH', undefined, 9);

    expect(result.ok).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('yetarli qoldiq yo\'q'));
  });

  it('CHIQARISH: succeeds silently when the guarded reduce succeeds', async () => {
    repo.reduceWarehouseStock.mockResolvedValue(true);

    const result = await service.qcDecision(1, 'CHIQARISH', undefined, 9);

    expect(result.ok).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
