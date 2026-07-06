/**
 * deliveries.service.spec.ts
 *
 * Unit tests for DeliveriesService. ISdDeliveriesRepository is mocked; the
 * service computes pagination (offset = (page - 1) * limit) for real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import {
  ISdDeliveriesRepository,
  SD_DELIVERIES_REPO,
} from '../../src/modules/sd/deliveries/i-sd-deliveries.repo';
import { DeliveriesService } from '../../src/modules/sd/deliveries/deliveries.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ISdDeliveriesRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findItemsByDeliveryId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  } as jest.Mocked<ISdDeliveriesRepository>;
}

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('Yetkazib berish topilmadi') };
}

describe('DeliveriesService', () => {
  let svc: DeliveriesService;
  let repo: jest.Mocked<ISdDeliveriesRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        { provide: SD_DELIVERIES_REPO, useValue: repo },
        { provide: I18nService, useValue: makeI18n() },
      ],
    }).compile();
    svc = module.get(DeliveriesService);
  });

  it('computes offset from page and limit when findAll called', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 }));
    await svc.findAll({ page: 3, limit: 25 });
    expect(repo.findAll).toHaveBeenCalledWith(25, 50);
  });

  it('defaults to page=1 limit=10 when query is empty', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    const r = await svc.findAll({});
    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { pagination: { total: number; page: number; limit: number } };
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    }
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));
    const r = await svc.findAll({});
    expect(r.ok).toBe(false);
  });

  it('returns 404 when findOne id is missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    await expect(svc.findOne(404)).rejects.toThrow();
  });

  it('returns merged delivery with items when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 5, status: 'shipped' }));
    repo.findItemsByDeliveryId.mockResolvedValue(Ok([{ sku: 'X' }]));
    const data = await svc.findOne(5);
    expect(data.id).toBe(5);
    expect((data as { items: unknown[] }).items).toHaveLength(1);
  });

  it('returns Err when create repository fails', async () => {
    repo.create.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.create({ orderId: 1 });
    expect(r.ok).toBe(false);
  });

  it('returns Err when updateStatus underlying findOne fails', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.updateStatus(404, 'shipped');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });
});
