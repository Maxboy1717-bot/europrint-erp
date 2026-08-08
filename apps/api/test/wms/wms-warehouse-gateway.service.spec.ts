/**
 * test/wms/wms-warehouse-gateway.service.spec.ts
 *
 * Unit tests for WmsWarehouseGatewayService — a pure delegating facade over
 * WmsWarehouseGatewayRepo (plain CRUD/read methods) and WmsQuarantineGateService
 * (the quarantine state-machine gate). Each public method must forward to the
 * correct collaborator method, with the correct arguments, and return whatever
 * the collaborator resolves with unchanged.
 *
 * The most important behaviour pinned here is the quarantine-gate wiring:
 * completeGoodsReceipt() MUST call quarantineGate.releaseToMain() and must
 * NEVER call repo.completeGoodsReceipt() directly — the legacy repo method
 * bypasses the QC_PASS gate and would clobber MAIN status (see the service's
 * own doc comment). A regression that re-wires this back to the repo method
 * would silently reopen that bug, so it is asserted explicitly below.
 */
import { WmsWarehouseGatewayService } from '../../src/modules/wms/application/wms-warehouse-gateway.service';
import type { WmsWarehouseGatewayRepo } from '../../src/modules/wms/infrastructure/wms-warehouse-gateway.repo';
import type { WmsQuarantineGateService } from '../../src/modules/wms/application/wms-quarantine-gate.service';
import { Ok } from '../../src/common/result';

function makeRepoStub(): WmsWarehouseGatewayRepo {
  return {
    getDashboardKpis: jest.fn().mockResolvedValue({}),
    getWarehouseOccupancy: jest.fn().mockResolvedValue([]),
    getWarehouses: jest.fn().mockResolvedValue([]),
    getStock: jest.fn().mockResolvedValue({ stock: [], total: 0 }),
    getLots: jest.fn().mockResolvedValue([]),
    getTransfers: jest.fn().mockResolvedValue([]),
    createTransfer: jest.fn().mockResolvedValue({}),
    getInternalRequests: jest.fn().mockResolvedValue([]),
    createInternalRequest: jest.fn().mockResolvedValue({}),
    getGoodsReceipts: jest.fn().mockResolvedValue([]),
    createGoodsReceipt: jest.fn().mockResolvedValue({}),
    getGoodsReceiptStats: jest.fn().mockResolvedValue({}),
    getGoodsReceiptLines: jest.fn().mockResolvedValue([]),
    addGoodsReceiptLine: jest.fn().mockResolvedValue({}),
    qcLine: jest.fn().mockResolvedValue({}),
    // Legacy method — must never be invoked by completeGoodsReceipt().
    completeGoodsReceipt: jest.fn().mockResolvedValue({}),
    getLowStock: jest.fn().mockResolvedValue([]),
    barcodeScan: jest.fn().mockResolvedValue({}),
    logPosSyncEvent: jest.fn().mockResolvedValue(undefined),
  } as unknown as WmsWarehouseGatewayRepo;
}

function makeQuarantineGateStub(): WmsQuarantineGateService {
  return {
    releaseToMain: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'MAIN' })),
    sendToQuarantine: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'KARANTIN' })),
    applyQcDecision: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'QC_PASS' })),
  } as unknown as WmsQuarantineGateService;
}

describe('WmsWarehouseGatewayService', () => {
  it('is defined', () => {
    expect(WmsWarehouseGatewayService).toBeDefined();
  });

  describe('plain repo delegation', () => {
    it('getDashboardKpis() delegates to repo.getDashboardKpis() and returns its value unchanged', async () => {
      const repo = makeRepoStub();
      const kpis = { activeWarehouses: 3 };
      (repo.getDashboardKpis as jest.Mock).mockResolvedValueOnce(kpis);
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      const result = await svc.getDashboardKpis();

      expect(repo.getDashboardKpis).toHaveBeenCalledTimes(1);
      expect(result).toBe(kpis);
    });

    it('getStock() forwards warehouseId and materialId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.getStock(5, 9);

      expect(repo.getStock).toHaveBeenCalledWith(5, 9);
    });

    it('getLots() forwards materialId and warehouseId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.getLots(2, 7);

      expect(repo.getLots).toHaveBeenCalledWith(2, 7);
    });

    it('getTransfers() forwards the status filter unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.getTransfers('PENDING');

      expect(repo.getTransfers).toHaveBeenCalledWith('PENDING');
    });

    it('createTransfer() forwards body and userId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());
      const body = { fromWarehouseId: 1, toWarehouseId: 2 };

      await svc.createTransfer(body, 42);

      expect(repo.createTransfer).toHaveBeenCalledWith(body, 42);
    });

    it('createInternalRequest() forwards body and userId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());
      const body = { materialId: 1 };

      await svc.createInternalRequest(body, 7);

      expect(repo.createInternalRequest).toHaveBeenCalledWith(body, 7);
    });

    it('createGoodsReceipt() forwards body and userId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());
      const body = { supplierId: 3 };

      await svc.createGoodsReceipt(body, 11);

      expect(repo.createGoodsReceipt).toHaveBeenCalledWith(body, 11);
    });

    it('getGoodsReceiptLines() forwards receiptId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.getGoodsReceiptLines(101);

      expect(repo.getGoodsReceiptLines).toHaveBeenCalledWith(101);
    });

    it('addGoodsReceiptLine() forwards receiptId and body unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());
      const line = { materialId: 4, quantity: 10 };

      await svc.addGoodsReceiptLine(101, line);

      expect(repo.addGoodsReceiptLine).toHaveBeenCalledWith(101, line);
    });

    it('qcLine() forwards lineId, passed, notes and userId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.qcLine(55, false, 'damaged', 3);

      expect(repo.qcLine).toHaveBeenCalledWith(55, false, 'damaged', 3);
    });

    it('lowStock() delegates to repo.getLowStock()', async () => {
      const repo = makeRepoStub();
      const alerts = [{ materialId: 1 }];
      (repo.getLowStock as jest.Mock).mockResolvedValueOnce(alerts);
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      const result = await svc.lowStock();

      expect(repo.getLowStock).toHaveBeenCalledTimes(1);
      expect(result).toBe(alerts);
    });

    it('barcodeScan() forwards the barcode unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.barcodeScan('EAN-123456');

      expect(repo.barcodeScan).toHaveBeenCalledWith('EAN-123456');
    });

    it('logPosSyncEvent() forwards warehouseId and userId unchanged', async () => {
      const repo = makeRepoStub();
      const svc = new WmsWarehouseGatewayService(repo, makeQuarantineGateStub());

      await svc.logPosSyncEvent(9, 3);

      expect(repo.logPosSyncEvent).toHaveBeenCalledWith(9, 3);
    });
  });

  describe('quarantine-gate delegation (Q-40 real enforcement wiring)', () => {
    it('completeGoodsReceipt() delegates to quarantineGate.releaseToMain(), NOT repo.completeGoodsReceipt()', async () => {
      const repo = makeRepoStub();
      const gate = makeQuarantineGateStub();
      const svc = new WmsWarehouseGatewayService(repo, gate);

      const result = await svc.completeGoodsReceipt(1, 42);

      expect(gate.releaseToMain).toHaveBeenCalledWith(1, 42);
      // The legacy repo method bypasses the QC_PASS gate — it must never be
      // reached through this path, or a rejected/quarantined receipt could
      // silently be posted to MAIN.
      expect(repo.completeGoodsReceipt).not.toHaveBeenCalled();
      expect(result).toEqual(Ok({ id: 1, status: 'MAIN' }));
    });

    it('sendToQuarantine() delegates to quarantineGate.sendToQuarantine()', async () => {
      const gate = makeQuarantineGateStub();
      const svc = new WmsWarehouseGatewayService(makeRepoStub(), gate);

      const result = await svc.sendToQuarantine(1, 7);

      expect(gate.sendToQuarantine).toHaveBeenCalledWith(1, 7);
      expect(result).toEqual(Ok({ id: 1, status: 'KARANTIN' }));
    });

    it('qcReceiptDecision() delegates to quarantineGate.applyQcDecision() with decision, inspector and note', async () => {
      const gate = makeQuarantineGateStub();
      const svc = new WmsWarehouseGatewayService(makeRepoStub(), gate);

      const result = await svc.qcReceiptDecision(1, 'QABUL', 9, 'ok');

      expect(gate.applyQcDecision).toHaveBeenCalledWith(1, 'QABUL', 9, 'ok');
      expect(result).toEqual(Ok({ id: 1, status: 'QC_PASS' }));
    });

    it('propagates a failed Result from the quarantine gate unchanged (no swallowing)', async () => {
      const repo = makeRepoStub();
      const gate = makeQuarantineGateStub();
      const failure = { ok: false as const, error: { code: 'BUSINESS_RULE_VIOLATION', message: 'blocked' } };
      (gate.releaseToMain as jest.Mock).mockResolvedValueOnce(failure);
      const svc = new WmsWarehouseGatewayService(repo, gate);

      const result = await svc.completeGoodsReceipt(1, 42);

      expect(result).toBe(failure);
      expect(repo.completeGoodsReceipt).not.toHaveBeenCalled();
    });
  });
});
