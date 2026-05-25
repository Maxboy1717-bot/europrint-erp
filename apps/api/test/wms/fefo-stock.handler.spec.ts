/**
 * test/wms/fefo-stock.handler.spec.ts
 *
 * Unit tests for FefoStockHandler — read-only FEFO stock lookup.
 * IWmsRepository is mocked; real Stock aggregates flow through.
 */

import { Test } from '@nestjs/testing';
import { FefoStockHandler, FefoStockQuery } from '../../src/modules/wms/application/queries/fefo-stock.handler';
import { Stock } from '../../src/modules/wms/domain/aggregates/stock.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { stockFactory } from '../_fixtures/factories';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';

type RepoMock = {
  saveStock: jest.Mock;
  getStock: jest.Mock;
  getStockByMaterialAndWarehouse: jest.Mock;
  getFefoStock: jest.Mock<Promise<Result<Stock[]>>, [number, number]>;
  reserveMaterial: jest.Mock;
  issueGoods: jest.Mock;
  receiveFg: jest.Mock;
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
    receiveFg: jest.fn(),
    getAllStockByStatus: jest.fn(),
    softDeleteStock: jest.fn(),
  };
}

function makeStock(quantity: number, expiry: Date | null): Stock {
  const seed = stockFactory({ quantity });
  return new Stock(seed.id, seed.warehouseId, seed.materialId, quantity, expiry, seed.batchNumber);
}

describe('FefoStockHandler', () => {
  let handler: FefoStockHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FefoStockHandler,
        { provide: WMS_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(FefoStockHandler);
  });

  it('returns ok with empty array when no stock found for material+warehouse', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Ok([] as Stock[]));

    const r = await handler.execute(new FefoStockQuery(7, 1));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('passes through repository data unchanged when stocks exist', async () => {
    const s1 = makeStock(50, new Date('2026-06-01'));
    const s2 = makeStock(50, new Date('2026-07-01'));
    repo.getFefoStock.mockResolvedValueOnce(Ok([s1, s2]));

    const r = await handler.execute(new FefoStockQuery(7, 1));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(2);
      expect(r.data[0]).toBe(s1);
      expect(r.data[1]).toBe(s2);
    }
  });

  it('propagates the underlying error code when repository fails', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'gone')));

    const r = await handler.execute(new FefoStockQuery(7, 1));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('forwards both materialId and warehouseId to the repository call', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Ok([] as Stock[]));

    await handler.execute(new FefoStockQuery(42, 99));

    expect(repo.getFefoStock).toHaveBeenCalledWith(42, 99);
  });

  it('invokes the repository exactly once per execute', async () => {
    repo.getFefoStock.mockResolvedValueOnce(Ok([] as Stock[]));

    await handler.execute(new FefoStockQuery(1, 1));

    expect(repo.getFefoStock).toHaveBeenCalledTimes(1);
  });
});
