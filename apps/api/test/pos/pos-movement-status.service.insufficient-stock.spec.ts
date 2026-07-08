/**
 * test/pos/pos-movement-status.service.insufficient-stock.spec.ts
 *
 * VISION-3340 #57: PosMovementStatusService._processCompletedMovement() used to call
 * `this.repo.decrementStock(...)` and throw the Result away (`await this.repo.decrementStock(...)`
 * with no check at all) — so even after the repository/DB layer started reporting
 * Err(INSUFFICIENT_STOCK) on an overdraw, the service silently continued as if the stock write
 * had succeeded: it still recorded a stock-ledger entry for stock that was never actually moved,
 * still ran GL auto-posting, still recorded the FINANCE confirmation, and still returned success.
 *
 * Fixed: the Result from decrementStock() is now checked on both the 'out' and 'transfer'
 * branches; a failure throws (BadRequestException), which propagates through the
 * safeCall(...) wrapper in updateStatus() and ABORTS the rest of the completion — no ledger
 * entry, no GL posting, no FINANCE confirmation, no audit log, no completed-event emission —
 * and the caller gets back a failed Result instead of a fake success.
 *
 * All of PosMovementStatusService's other constructor dependencies transitively import
 * @workspace/db (real Postgres Pool) — stub each sibling service/repo module out (matching the
 * technique already used in test/pos/pos-movement.service.exchange-rate.spec.ts) so this stays
 * a pure unit test with hand-built jest.fn() mocks, no live DB required.
 */
jest.mock('../../src/modules/pos/application/services/lifecycle-block.service', () => ({ LifecycleBlockService: class {} }));
jest.mock('../../src/modules/pos/application/services/employee-ledger.service', () => ({ EmployeeLedgerService: class {} }));
jest.mock('../../src/modules/pos/application/services/pos-audit.service', () => ({ PosAuditService: class {} }));
jest.mock('../../src/modules/pos/application/services/stock-ledger.service', () => ({ StockLedgerService: class {} }));
jest.mock('../../src/modules/pos/application/services/pos-notifications.service', () => ({ PosNotificationsService: class {} }));
jest.mock('../../src/modules/pos/infrastructure/repositories/pos-movement-status.repository', () => ({ PosMovementStatusRepository: class {} }));
jest.mock('../../src/modules/pos/infrastructure/repositories/gl-posting-log.repository', () => ({ GlPostingLogRepository: class {} }));

import { PosMovementStatusService } from '../../src/modules/pos/application/services/pos-movement-status.service';
import { UpdateMovementStatusDto } from '../../src/modules/pos/dto/movement.dto';
import { Ok, Err } from '../../src/common/result';

function makeMocks() {
  return {
    repo: {
      findMovement: jest.fn(),
      updateMovementStatus: jest.fn(),
      getMovementLines: jest.fn(),
      upsertStockIn: jest.fn(),
      decrementStock: jest.fn(),
      getMaterialMinInterval: jest.fn(),
    },
    stockLedger: { recordEntry: jest.fn(), recordConfirmation: jest.fn() },
    audit: { log: jest.fn() },
    notifications: { sendNotification: jest.fn(), broadcastNotification: jest.fn() },
    lifecycle: { recordIssuance: jest.fn() },
    employeeLedger: { addEntry: jest.fn() },
    eventEmitter: { emit: jest.fn() },
    glRepo: { insertLog: jest.fn().mockResolvedValue(Ok({})) },
    i18n: { t: jest.fn(async (key: string) => key) },
  };
}

function makeService(m: ReturnType<typeof makeMocks>) {
  return new PosMovementStatusService(
    m.lifecycle as never,
    m.employeeLedger as never,
    m.audit as never,
    m.stockLedger as never,
    m.notifications as never,
    m.eventEmitter as never,
    m.repo as never,
    m.glRepo as never,
    m.i18n as never,
  );
}

const BASE_MOVEMENT = {
  id: 1,
  status: 'approved',
  quarantineRequired: false,
  qcStatus: null,
  movementNumber: 'MOV-1',
  createdBy: 2,
  toWarehouseId: null,
  receivedByEmployeeId: null,
};

describe('PosMovementStatusService.updateStatus — VISION-3340 #57 abort on insufficient stock', () => {
  it('OUT movement: aborts completion (no ledger entry / GL post / confirmation / audit / event) when decrementStock is Err', async () => {
    const m = makeMocks();
    const movement = { ...BASE_MOVEMENT, movementType: 'EXTERNAL_OUT', fromWarehouseId: 5 };
    m.repo.findMovement.mockResolvedValue(Ok(movement));
    m.repo.updateMovementStatus.mockResolvedValue(Ok({ ...movement, status: 'completed' }));
    m.repo.getMovementLines.mockResolvedValue(Ok([{ id: 10, materialCardId: 7, quantity: 50, unitPrice: 100 }]));
    m.repo.decrementStock.mockResolvedValue(Err({ code: 'INSUFFICIENT_STOCK', message: "Yetarli qoldiq yo'q" }));

    const svc = makeService(m);
    const result = await svc.updateStatus(1, { status: 'completed' } as UpdateMovementStatusDto, 99);

    expect(result.ok).toBe(false);
    expect(m.repo.decrementStock).toHaveBeenCalledWith(7, '5', 50);
    // The old bug: these all ran anyway even though the stock write never actually happened.
    expect(m.stockLedger.recordEntry).not.toHaveBeenCalled();
    expect(m.stockLedger.recordConfirmation).not.toHaveBeenCalled();
    expect(m.glRepo.insertLog).not.toHaveBeenCalled();
    expect(m.audit.log).not.toHaveBeenCalled();
    expect(m.eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('TRANSFER movement: aborts before crediting the destination warehouse when the source decrementStock is Err', async () => {
    const m = makeMocks();
    const movement = { ...BASE_MOVEMENT, movementType: 'INTERNAL_TRANSFER', fromWarehouseId: 5, toWarehouseId: 6 };
    m.repo.findMovement.mockResolvedValue(Ok(movement));
    m.repo.updateMovementStatus.mockResolvedValue(Ok({ ...movement, status: 'completed' }));
    m.repo.getMovementLines.mockResolvedValue(Ok([{ id: 11, materialCardId: 8, quantity: 20, unitPrice: 50 }]));
    m.repo.decrementStock.mockResolvedValue(Err({ code: 'INSUFFICIENT_STOCK', message: "Yetarli qoldiq yo'q" }));

    const svc = makeService(m);
    const result = await svc.updateStatus(1, { status: 'completed' } as UpdateMovementStatusDto, 99);

    expect(result.ok).toBe(false);
    // Must not credit the destination warehouse for stock that was never actually debited.
    expect(m.repo.upsertStockIn).not.toHaveBeenCalled();
    expect(m.stockLedger.recordEntry).not.toHaveBeenCalled();
  });

  it('OUT movement: completes normally (ledger entry + FINANCE confirmation recorded) when decrementStock succeeds', async () => {
    const m = makeMocks();
    const movement = { ...BASE_MOVEMENT, movementType: 'EXTERNAL_OUT', fromWarehouseId: 5 };
    m.repo.findMovement.mockResolvedValue(Ok(movement));
    m.repo.updateMovementStatus.mockResolvedValue(Ok({ ...movement, status: 'completed' }));
    m.repo.getMovementLines.mockResolvedValue(Ok([{ id: 10, materialCardId: 7, quantity: 50, unitPrice: 100 }]));
    m.repo.decrementStock.mockResolvedValue(Ok());
    m.repo.getMaterialMinInterval.mockResolvedValue(Ok(null));

    const svc = makeService(m);
    const result = await svc.updateStatus(1, { status: 'completed' } as UpdateMovementStatusDto, 99);

    expect(result.ok).toBe(true);
    expect(m.stockLedger.recordEntry).toHaveBeenCalledWith(7, '5', -50, 1, 'out:EXTERNAL_OUT');
    expect(m.stockLedger.recordConfirmation).toHaveBeenCalled();
  });
});
