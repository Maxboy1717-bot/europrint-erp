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
  withTransaction: jest.Mock;
};

function makeRepoMock(): WmsRepoMock {
  const mock: Partial<WmsRepoMock> = {
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
  // withTransaction executes the callback directly (no real DB tx in unit tests)
  mock.withTransaction = jest.fn().mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(undefined));
  return mock as WmsRepoMock;
}

function makeReservedStock(qty: number, reserved: number, expiryDays: number | null): Stock {
  const seed = stockFactory({ quantity: qty });
  const expiry = expiryDays === null ? null : new Date(Date.now() + expiryDays * 86_400_000);
  const stock = new Stock(seed.id, seed.warehouseId, seed.materialId, qty, expiry, seed.batchNumber);
  if (reserved > 0) {
    const reserveResult = stock.reserve(reserved);
    if (!reserveResult.ok) throw new Error('factory: pre-reserve failed');
  }
  return stock;
}

/**
 * Stock where `issue(qty)` will succeed: the stock holds `qty * 2` units total,
 * with exactly `qty` reserved. So getAvailableQuantity() = qty (non-zero) and
 * issue(qty) passes because qty <= reservedQuantity(qty).
 */
function makeIssuableStock(qty: number, expiryDays: number | null): Stock {
  return makeReservedStock(qty * 2, qty, expiryDays);
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
    // error could be from stock.issue() or from the remaining amount check
    if (!r.ok) expect(r.error.message).toBeTruthy();
  });

  it('issues across multiple batches in FEFO order and publishes event', async () => {
    // Pre-reserve the full qty so issue() can consume from reserved pool
    const earlier = makeIssuableStock(30, 5);
    const later = makeIssuableStock(50, 30);
    repo.getFefoStock.mockResolvedValueOnce(Ok([earlier, later]));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 60, 7));

    expect(r.ok).toBe(true);
    expect(repo.saveStock).toHaveBeenCalledTimes(2);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('aborts and bubbles error when saveStock fails mid-iteration', async () => {
    // Pre-reserve so issue() can execute before saveStock is called
    const s1 = makeIssuableStock(10, null);
    const s2 = makeIssuableStock(10, null);
    repo.getFefoStock.mockResolvedValueOnce(Ok([s1, s2]));
    repo.saveStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'write failed')));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 15, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
