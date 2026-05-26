/**
 * test/mm/goods-receipt.handler.spec.ts
 *
 * Unit tests for GoodsReceiptHandler. IMmRepository + EventBus mocked.
 * Real PurchaseOrder is approved then receipted by the handler under test.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  GoodsReceiptHandler,
  GoodsReceiptCommand,
} from '../../src/modules/mm/application/commands/goods-receipt.handler';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PoStatus,
} from '../../src/modules/mm/domain/aggregates/purchase-order.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmRepository, MM_REPO } from '../../src/modules/mm/domain/repositories/mm.repository';

type RepoMock = Partial<Record<keyof IMmRepository, jest.Mock>> & {
  getPurchaseOrder: jest.Mock<Promise<Result<PurchaseOrder>>, [number]>;
  validateThreeWayMatch: jest.Mock<Promise<Result<{ matched: boolean; difference: number }>>, [number]>;
  savePurchaseOrder: jest.Mock<Promise<Result<number>>, [PurchaseOrder]>;
};

function makeRepo(): RepoMock {
  const repo: RepoMock = {
    saveMaterial: jest.fn(),
    getMaterial: jest.fn(),
    getMaterialByCode: jest.fn(),
    savePurchaseOrder: jest.fn().mockResolvedValue(Ok(1)),
    getPurchaseOrder: jest.fn(),
    getAllPoByStatus: jest.fn(),
    recordGoodsReceipt: jest.fn(),
    recordInvoice: jest.fn(),
    validateThreeWayMatch: jest.fn().mockResolvedValue(Ok({ matched: true, difference: 0 })),
    updateVendorRating: jest.fn(),
    withTransaction: jest.fn(),
  };
  (repo.withTransaction as jest.Mock).mockImplementation(
    async (cb: (tx: unknown) => unknown) => cb(null),
  );
  return repo;
}

function makeApprovedPo(qty: number): PurchaseOrder {
  const po = new PurchaseOrder(1, 'PO-1', 100, 7);
  const add = po.addItem(new PurchaseOrderItem(5, qty, 1000));
  if (!add.ok) throw new Error('factory: addItem failed');
  const ap = po.approve(99);
  if (!ap.ok) throw new Error('factory: approve failed');
  return po;
}

describe('GoodsReceiptHandler', () => {
  let handler: GoodsReceiptHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GoodsReceiptHandler,
        { provide: MM_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(GoodsReceiptHandler);
  });

  it('returns err when getPurchaseOrder fails', async () => {
    repo.getPurchaseOrder.mockResolvedValueOnce(Err(AppErr('NOT_FOUND', 'no po')));

    const r = await handler.execute(new GoodsReceiptCommand(1, 10, 10));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('emits THREE_WAY_MATCH_FAILED event and errors when match fails', async () => {
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(makeApprovedPo(100)));
    repo.validateThreeWayMatch.mockResolvedValueOnce(Ok({ matched: false, difference: 12 }));

    const r = await handler.execute(new GoodsReceiptCommand(1, 100, 88));

    expect(r.ok).toBe(false);
    expect(eventBus.publish).toHaveBeenCalledWith(
      'THREE_WAY_MATCH_FAILED',
      expect.objectContaining({ difference: 12 }),
    );
  });

  it('records receipt on the PO aggregate and persists when match succeeds', async () => {
    const po = makeApprovedPo(50);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));

    const r = await handler.execute(new GoodsReceiptCommand(1, 50, 50));

    expect(r.ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.RECEIVED);
    expect(repo.savePurchaseOrder).toHaveBeenCalledWith(po, null);
  });

  it('returns err from aggregate when recording receipt is invalid', async () => {
    const po = new PurchaseOrder(1, 'PO-X', 100, 7);
    const add = po.addItem(new PurchaseOrderItem(5, 10, 1000));
    if (!add.ok) throw new Error('addItem failed');
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));

    const r = await handler.execute(new GoodsReceiptCommand(1, 5, 5));

    expect(r.ok).toBe(false);
  });

  it('forwards saveStock err from the repo on the success path', async () => {
    const po = makeApprovedPo(100);
    repo.getPurchaseOrder.mockResolvedValueOnce(Ok(po));
    repo.savePurchaseOrder.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'write fail')));

    const r = await handler.execute(new GoodsReceiptCommand(1, 100, 100));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
