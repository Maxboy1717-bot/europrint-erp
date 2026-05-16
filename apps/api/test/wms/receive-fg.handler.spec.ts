/**
 * test/wms/receive-fg.handler.spec.ts
 *
 * Unit tests for ReceiveFgHandler — finished-goods receipt path.
 * IWmsRepository and EventBus are mocked; real Stock aggregate is constructed.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ReceiveFgHandler, ReceiveFgCommand } from '../../src/modules/wms/application/commands/receive-fg.handler';
import { Stock } from '../../src/modules/wms/domain/aggregates/stock.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';

type RepoMock = {
  saveStock: jest.Mock<Promise<Result<number>>, [Stock]>;
  getStock: jest.Mock;
  getStockByMaterialAndWarehouse: jest.Mock;
  getFefoStock: jest.Mock;
  reserveMaterial: jest.Mock;
  issueGoods: jest.Mock;
  receiveFg: jest.Mock;
  getAllStockByStatus: jest.Mock;
  softDeleteStock: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    saveStock: jest.fn().mockResolvedValue(Ok(42)),
    getStock: jest.fn(),
    getStockByMaterialAndWarehouse: jest.fn(),
    getFefoStock: jest.fn(),
    reserveMaterial: jest.fn(),
    issueGoods: jest.fn(),
    receiveFg: jest.fn(),
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

  it('returns ok and persists a Stock instance when receipt succeeds', async () => {
    const r = await handler.execute(new ReceiveFgCommand(7, 1, 100, 'BATCH-A'));

    expect(r.ok).toBe(true);
    expect(repo.saveStock).toHaveBeenCalledTimes(1);
    const saved = repo.saveStock.mock.calls[0][0];
    expect(saved).toBeInstanceOf(Stock);
    expect(saved.getMaterialId()).toBe(7);
    expect(saved.getWarehouseId()).toBe(1);
    expect(saved.getQuantity()).toBe(100);
  });

  it('publishes WMS_FG_RECEIVED event with the receipt payload on success', async () => {
    await handler.execute(new ReceiveFgCommand(7, 2, 50, 'BATCH-B'));

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const [eventName, payload] = eventBus.publish.mock.calls[0];
    expect(eventName).toBe('WMS_FG_RECEIVED');
    expect(payload).toMatchObject({ materialId: 7, amount: 50, warehouseId: 2 });
  });

  it('forwards saveStock failure and does NOT publish event', async () => {
    repo.saveStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'disk full')));

    const r = await handler.execute(new ReceiveFgCommand(7, 1, 10, 'B'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('passes expiryDate through to the constructed Stock aggregate', async () => {
    const expiry = new Date('2026-12-31T00:00:00Z');

    await handler.execute(new ReceiveFgCommand(7, 1, 1, 'B-EXP', expiry));

    const saved = repo.saveStock.mock.calls[0][0];
    expect(saved.getExpiryDate()).toEqual(expiry);
  });

  it('defaults expiryDate to null when caller omits it', async () => {
    await handler.execute(new ReceiveFgCommand(7, 1, 1, 'B-NULL'));

    const saved = repo.saveStock.mock.calls[0][0];
    expect(saved.getExpiryDate()).toBeNull();
  });
});
