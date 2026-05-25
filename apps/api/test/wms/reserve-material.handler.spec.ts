/**
 * test/wms/reserve-material.handler.spec.ts
 *
 * Unit tests for ReserveMaterialHandler — multi-batch reservation.
 * IWmsRepository is mocked; real Stock aggregates are used.
 */

import { Test } from '@nestjs/testing';
import { ReserveMaterialHandler, ReserveMaterialCommand } from '../../src/modules/wms/application/commands/reserve-material.handler';
import { Stock } from '../../src/modules/wms/domain/aggregates/stock.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { stockFactory } from '../_fixtures/factories';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';

type RepoMock = {
  saveStock: jest.Mock<Promise<Result<number>>, [Stock]>;
  getStock: jest.Mock;
  getStockByMaterialAndWarehouse: jest.Mock<Promise<Result<Stock[]>>, [number, number]>;
  getFefoStock: jest.Mock;
  reserveMaterial: jest.Mock;
  issueGoods: jest.Mock;
  receiveFg: jest.Mock;
  getAllStockByStatus: jest.Mock;
  softDeleteStock: jest.Mock;
};

function makeRepo(): RepoMock {
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

function makeStock(qty: number): Stock {
  const seed = stockFactory({ quantity: qty });
  return new Stock(seed.id, seed.warehouseId, seed.materialId, qty, null, seed.batchNumber);
}

describe('ReserveMaterialHandler', () => {
  let handler: ReserveMaterialHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReserveMaterialHandler,
        { provide: WMS_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ReserveMaterialHandler);
  });

  it('returns NOT_FOUND when repo returns empty stock list', async () => {
    repo.getStockByMaterialAndWarehouse.mockResolvedValueOnce(Ok([] as Stock[]));

    const r = await handler.execute(new ReserveMaterialCommand(1, 1, 10, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.saveStock).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when repo lookup itself fails', async () => {
    repo.getStockByMaterialAndWarehouse.mockResolvedValueOnce(
      Err(AppErr('DB_ERROR', 'offline')),
    );

    const r = await handler.execute(new ReserveMaterialCommand(1, 1, 10, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('reserves across two batches and persists each one', async () => {
    const s1 = makeStock(40);
    const s2 = makeStock(40);
    repo.getStockByMaterialAndWarehouse.mockResolvedValueOnce(Ok([s1, s2]));

    const r = await handler.execute(new ReserveMaterialCommand(1, 1, 60, 5));

    expect(r.ok).toBe(true);
    expect(s1.getReservedQuantity()).toBe(40);
    expect(s2.getReservedQuantity()).toBe(20);
    expect(repo.saveStock).toHaveBeenCalledTimes(2);
  });

  it('reports shortage when total available cannot satisfy the request', async () => {
    const s1 = makeStock(5);
    const s2 = makeStock(5);
    repo.getStockByMaterialAndWarehouse.mockResolvedValueOnce(Ok([s1, s2]));

    const r = await handler.execute(new ReserveMaterialCommand(1, 1, 50, 5));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('Etishmayotgan');
  });

  it('stops calling saveStock when the first save fails', async () => {
    repo.getStockByMaterialAndWarehouse.mockResolvedValueOnce(
      Ok([makeStock(10), makeStock(10)]),
    );
    repo.saveStock.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'no write')));

    const r = await handler.execute(new ReserveMaterialCommand(1, 1, 15, 5));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(repo.saveStock).toHaveBeenCalledTimes(1);
  });
});
