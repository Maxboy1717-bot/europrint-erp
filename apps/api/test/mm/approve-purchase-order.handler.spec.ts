/**
 * test/mm/approve-purchase-order.handler.spec.ts
 *
 * Unit tests for ApprovePurchaseOrderHandler. IMmRepository mocked.
 * Real PurchaseOrder aggregate is constructed and approved by the handler.
 */

import { Test } from '@nestjs/testing';
import {
  ApprovePurchaseOrderHandler,
  ApprovePurchaseOrderCommand,
} from '../../src/modules/mm/application/commands/approve-purchase-order.handler';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PoStatus,
} from '../../src/modules/mm/domain/aggregates/purchase-order.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmRepository, MM_REPO } from '../../src/modules/mm/domain/repositories/mm.repository';

type RepoMock = Partial<Record<keyof IMmRepository, jest.Mock>> & {
  getPurchaseOrder: jest.Mock<Promise<Result<PurchaseOrder>>, [number]>;
  savePurchaseOrder: jest.Mock<Promise<Result<number>>, [PurchaseOrder]>;
};

function makeRepo(): RepoMock {
  return {
    saveMaterial: jest.fn(),
    getMaterial: jest.fn(),
    getMaterialByCode: jest.fn(),
    savePurchaseOrder: jest.fn().mockResolvedValue(Ok(1)),
    getPurchaseOrder: jest.fn(),
    getAllPoByStatus: jest.fn(),
    recordGoodsReceipt: jest.fn(),
    recordInvoice: jest.fn(),
    validateThreeWayMatch: jest.fn(),
    updateVendorRating: jest.fn(),
  };
}

function makeDraftPo(createdBy: number): PurchaseOrder {
  const po = new PurchaseOrder(1, 'PO-1', 100, createdBy);
  const addRes = po.addItem(new PurchaseOrderItem(5, 10, 1000));
  if (!addRes.ok) throw new Error('factory: addItem failed');
  return po;
}

describe('ApprovePurchaseOrderHandler', () => {
  let handler: ApprovePurchaseOrderHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ApprovePurchaseOrderHandler,
        { provide: MM_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ApprovePurchaseOrderHandler);
  });

  it('returns err with NOT_FOUND when the PO cannot be loaded', async () => {
    repo.getPurchaseOrder.mockResolvedValueOnce(Err(AppErr('NOT_FOUND', 'no po')));

    const r = await handler.execute(new ApprovePurchaseOrderCommand(1, 5));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.savePurchaseOrder).not.toHaveBeenCalled();
  });

  it('rejects approval when creator and approver are the same user (SoD)', async () => {
    const po = makeDraftPo(7);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));

    const r = await handler.execute(new ApprovePurchaseOrderCommand(1, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('SoD');
    expect(repo.savePurchaseOrder).not.toHaveBeenCalled();
  });

  it('approves the PO and persists it when SoD and rules pass', async () => {
    const po = makeDraftPo(7);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));

    const r = await handler.execute(new ApprovePurchaseOrderCommand(1, 99));

    expect(r.ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.APPROVED);
    expect(repo.savePurchaseOrder).toHaveBeenCalledWith(po);
  });

  it('returns the aggregate-level err when business rule blocks approval', async () => {
    const po = makeDraftPo(7);
    // Manually transition out of DRAFT to trigger the aggregate's guard
    const approveSelfRejected = po.approve(99);
    expect(approveSelfRejected.ok).toBe(true);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));

    const r = await handler.execute(new ApprovePurchaseOrderCommand(1, 50));

    expect(r.ok).toBe(false);
  });

  it('forwards repository save failure as a Result.Err', async () => {
    const po = makeDraftPo(7);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));
    repo.savePurchaseOrder.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'write fail')));

    const r = await handler.execute(new ApprovePurchaseOrderCommand(1, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
