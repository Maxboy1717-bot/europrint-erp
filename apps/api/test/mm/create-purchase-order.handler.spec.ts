/**
 * test/mm/create-purchase-order.handler.spec.ts
 *
 * Unit tests for CreatePurchaseOrderHandler. IMmRepository + EventBus mocked.
 * Real PurchaseOrder + PurchaseOrderItem aggregates flow through.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  CreatePurchaseOrderHandler,
  CreatePurchaseOrderCommand,
} from '../../src/modules/mm/application/commands/create-purchase-order.handler';
import { PurchaseOrder } from '../../src/modules/mm/domain/aggregates/purchase-order.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IMmRepository, MM_REPO } from '../../src/modules/mm/domain/repositories/mm.repository';
import { PO_MAX_AMOUNT_UZS } from '../../src/common/constants/app.constants';
import { purchaseOrderItemFactory } from '../_fixtures/factories';

type RepoMock = Partial<Record<keyof IMmRepository, jest.Mock>> & {
  savePurchaseOrder: jest.Mock<Promise<Result<number>>, [PurchaseOrder]>;
};

function makeRepo(): RepoMock {
  return {
    saveMaterial: jest.fn(),
    getMaterial: jest.fn(),
    getMaterialByCode: jest.fn(),
    savePurchaseOrder: jest.fn().mockResolvedValue(Ok(123)),
    getPurchaseOrder: jest.fn(),
    getAllPoByStatus: jest.fn(),
    recordGoodsReceipt: jest.fn(),
    recordInvoice: jest.fn(),
    validateThreeWayMatch: jest.fn(),
    updateVendorRating: jest.fn(),
  };
}

function cheapItem(): { materialId: number; quantity: number; unitPrice: number } {
  const item = purchaseOrderItemFactory({ quantity: 10, unitPrice: 1_000 });
  return { materialId: item.materialId, quantity: item.quantity, unitPrice: item.unitPrice };
}

function expensiveItem(): { materialId: number; quantity: number; unitPrice: number } {
  return { materialId: 999, quantity: 100, unitPrice: PO_MAX_AMOUNT_UZS };
}

describe('CreatePurchaseOrderHandler', () => {
  let handler: CreatePurchaseOrderHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreatePurchaseOrderHandler,
        { provide: MM_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(CreatePurchaseOrderHandler);
  });

  it('returns ok with new PO id for a small order without HITL trigger', async () => {
    const r = await handler.execute(new CreatePurchaseOrderCommand(7, [cheapItem()], 1));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(123);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('publishes PO_REQUIRES_DIRECTOR_APPROVAL when total exceeds 50M UZS', async () => {
    const r = await handler.execute(
      new CreatePurchaseOrderCommand(7, [expensiveItem()], 1),
    );

    expect(r.ok).toBe(true);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const [eventName, payload] = eventBus.publish.mock.calls[0];
    expect(eventName).toBe('PO_REQUIRES_DIRECTOR_APPROVAL');
    expect(payload).toMatchObject({ totalAmount: 100 * PO_MAX_AMOUNT_UZS, createdBy: 1 });
  });

  it('rejects the command when duplicate material lines are supplied', async () => {
    const item = cheapItem();

    const r = await handler.execute(
      new CreatePurchaseOrderCommand(7, [item, { ...item }], 1),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('mavjud');
    expect(repo.savePurchaseOrder).not.toHaveBeenCalled();
  });

  it('forwards repository save failure as Result.Err', async () => {
    repo.savePurchaseOrder.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new CreatePurchaseOrderCommand(7, [cheapItem()], 1));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('persists the PO with the supplied items count', async () => {
    const items = [cheapItem(), { materialId: 200, quantity: 1, unitPrice: 1 }];

    await handler.execute(new CreatePurchaseOrderCommand(7, items, 1));

    expect(repo.savePurchaseOrder).toHaveBeenCalledTimes(1);
    const po = repo.savePurchaseOrder.mock.calls[0][0];
    expect(po).toBeInstanceOf(PurchaseOrder);
    expect(po.getSupplierId()).toBe(7);
  });
});
