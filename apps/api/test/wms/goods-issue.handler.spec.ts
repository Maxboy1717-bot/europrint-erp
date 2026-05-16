/**
 * test/wms/goods-issue.handler.spec.ts
 *
 * Unit tests for GoodsIssueHandler — FEFO stock issue use case.
 * IWmsRepository and EventBus are mocked; real Stock aggregates are used.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { GoodsIssueHandler, GoodsIssueCommand } from '../../src/modules/wms/application/commands/goods-issue.handler';
import { Stock } from '../../src/modules/wms/domain/aggregates/stock.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IWmsRepository, WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';
import { stockFactory } from '../_fixtures/factories';

type WmsRepoMock = {
  saveStock: jest.Mock<Promise<Result<number>>, [Stock]>;
  getStock: jest.Mock;
  getStockByMaterialAndWarehouse: jest.Mock;
  getFefoStock: jest.Mock<Promise<Result<Stock[]>>, [number, number]>;
  reserveMaterial: jest.Mock;
  issueGoods: jest.Mock;
  receiveFg: jest.Mock;
  getAllStockByStatus: jest.Mock;
  softDeleteStock: jest.Mock;
};

function makeRepoMock(): WmsRepoMock {
  return {
    saveStock: jest.fn().mockResolvedValue(Ok(1)),
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

function makeReservedStock(qty: number, reserved: number, expiryDays: number | null): Stock {
  const seed = stockFactory({ quantity: qty });
  const expiry = expiryDays === null ? null : new Date(Date.now() + expiryDays * 86_400_000);
  const stock = new Stock(seed.id, seed.warehouseId, seed.materialId, qty, expiry, seed.batchNumber);
  const reserveResult = stock.reserve(reserved);
  if (!reserveResult.ok) throw new Error('factory: pre-reserve failed');
  return stock;
}

describe('GoodsIssueHandler', () => {
  let handler: GoodsIssueHandler;
  let repo: WmsRepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepoMock();
    eventBus = { publish: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoodsIssueHandler,
        { provide: WMS_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(GoodsIssueHandler);
  });

  it('returns err NOT_FOUND when no stock rows exist for material', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Ok([] as Stock[]));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 5, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('forwards repository error when getFefoStock fails', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'connection lost')));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 5, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(repo.saveStock).not.toHaveBeenCalled();
  });

  it('returns err when requested amount exceeds available reserved stock', async () => {
    const stock = makeReservedStock(100, 10, null);
    repo.getFefoStock.mockResolvedValueOnce(Ok([stock]));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 50, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('Etishmayotgan');
  });

  it('issues across multiple batches in FEFO order and publishes event', async () => {
    const earlier = makeReservedStock(30, 30, 5);
    const later = makeReservedStock(50, 50, 30);
    repo.getFefoStock.mockResolvedValueOnce(Ok([earlier, later]));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 60, 7));

    expect(r.ok).toBe(true);
    expect(repo.saveStock).toHaveBeenCalledTimes(2);
    expect(earlier.getQuantity()).toBe(0);
    expect(later.getQuantity()).toBe(20);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('aborts and bubbles error when saveStock fails mid-iteration', async () => {
    const s1 = makeReservedStock(10, 10, null);
    const s2 = makeReservedStock(10, 10, null);
    repo.getFefoStock.mockResolvedValueOnce(Ok([s1, s2]));
    repo.saveStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'write failed')));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 15, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
