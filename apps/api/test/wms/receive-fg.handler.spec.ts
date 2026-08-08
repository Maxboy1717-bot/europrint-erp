/**
 * test/wms/receive-fg.handler.spec.ts
 *
 * Unit tests for ReceiveFgHandler — finished-goods receipt path.
 * IWmsRepository and EventBus are mocked.
 *
 * NOTE (2026-06-19): the handler was migrated from saveStock(new Stock(...)) on the
 * legacy `stocks` table to wmsRepo.receiveFg(materialId, warehouseId, amount), an
 * idempotent UPSERT into the CANONICAL warehouse_stock (golden-thread fix, commit
 * 433e1e96). These tests assert the new receiveFg path, not the removed Stock aggregate.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ReceiveFgHandler, ReceiveFgCommand } from '../../src/modules/wms/application/commands/receive-fg.handler';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';

type RepoMock = {
  saveStock: jest.Mock;
  getStock: jest.Mock;
  getStockByMaterialAndWarehouse: jest.Mock;
  getFefoStock: jest.Mock;
  reserveMaterial: jest.Mock;
  issueGoods: jest.Mock;
  receiveFg: jest.Mock<Promise<Result<void>>, [number, number, number]>;
  getAllStockByStatus: jest.Mock;
  softDeleteStock: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    saveStock: jest.fn(),
    getStock: jest.fn(),
    getStockByMaterialAndWarehouse: jest.fn(),
    getFefoStock: jest.fn(),
    reserveMaterial: jest.fn(),
    issueGoods: jest.fn(),
    receiveFg: jest.fn().mockResolvedValue(Ok(undefined)),
    getAllStockByStatus: jest.fn(),
    softDeleteStock: jest.fn(),
  };
}

describe('ReceiveFgHandler', () => {
  let handler: ReceiveFgHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReceiveFgHandler,
        { provide: WMS_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(ReceiveFgHandler);
  });

  it('returns ok and UPSERTs FG into warehouse_stock via receiveFg', async () => {
    const r = await handler.execute(new ReceiveFgCommand(7, 1, 100, 'BATCH-A'));

    expect(r.ok).toBe(true);
    expect(repo.receiveFg).toHaveBeenCalledTimes(1);
    expect(repo.receiveFg).toHaveBeenCalledWith(7, 1, 100);
    // legacy saveStock path must NOT be used anymore
    expect(repo.saveStock).not.toHaveBeenCalled();
  });

  it('publishes WMS_FG_RECEIVED event with the receipt payload on success', async () => {
    await handler.execute(new ReceiveFgCommand(7, 2, 50, 'BATCH-B'));

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const [event] = eventBus.publish.mock.calls[0];
    expect(event).toMatchObject({ materialId: 7, amount: 50, warehouseId: 2 });
  });

  it('forwards receiveFg failure and does NOT publish event', async () => {
    repo.receiveFg.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'disk full')));

    const r = await handler.execute(new ReceiveFgCommand(7, 1, 10, 'B'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('passes orderId through to WmsFgReceivedEvent (Trigger 12 rental-timer attribution)', async () => {
    await handler.execute(new ReceiveFgCommand(7, 1, 25, 'B-ORD', null, 9001, 12.5));

    const [event] = eventBus.publish.mock.calls[0];
    expect(event).toMatchObject({ materialId: 7, amount: 25, warehouseId: 1, orderId: 9001 });
  });
});
