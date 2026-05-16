/**
 * orders.service.spec.ts
 *
 * Unit tests for OrdersService. ISdOrdersRepository + I18nService are mocked;
 * the real cancel guard ("already cancelled" branch) runs as written.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import {
  ISdOrdersRepository,
  SD_ORDERS_REPO,
} from '../../src/modules/sd/orders/i-sd-orders.repo';
import { OrdersService } from '../../src/modules/sd/orders/orders.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ISdOrdersRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByDocumentNumber: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMasterStatus: jest.fn(),
    updateAdvancePayment: jest.fn(),
    cancel: jest.fn(),
  } as jest.Mocked<ISdOrdersRepository>;
}

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('translated error') };
}

describe('OrdersService', () => {
  let svc: OrdersService;
  let repo: jest.Mocked<ISdOrdersRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: SD_ORDERS_REPO, useValue: repo },
        { provide: I18nService, useValue: makeI18n() },
      ],
    }).compile();
    svc = module.get(OrdersService);
  });

  it('returns repository payload when findAll succeeds', async () => {
    const rows = [{ id: 1 } as unknown] as never;
    repo.findAll.mockResolvedValue(Ok(rows));
    const r = await svc.findAll();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(rows);
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'pg down')));
    const r = await svc.findAll();
    expect(r.ok).toBe(false);
  });

  it('throws NotFoundException when findOne id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    await expect(svc.findOne(404)).rejects.toThrow();
  });

  it('returns order when findOne succeeds', async () => {
    const order = { id: 5, status: 'new' } as unknown as never;
    repo.findById.mockResolvedValue(Ok(order));
    const r = await svc.findOne(5);
    expect(r).toBe(order);
  });

  it('forwards createdBy when create called', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1 } as unknown as never));
    await svc.create({ customerId: 7 }, 42);
    expect(repo.create).toHaveBeenCalledWith({ customerId: 7 }, 42);
  });

  it('rejects cancel when order already cancelled', async () => {
    repo.findById.mockResolvedValue(
      Ok({ id: 5, status: 'cancelled' } as unknown as never),
    );
    const r = await svc.cancel(5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('cancels order when status is active', async () => {
    repo.findById.mockResolvedValue(
      Ok({ id: 5, status: 'new', overallStatus: 'OPEN' } as unknown as never),
    );
    repo.cancel.mockResolvedValue(Ok(undefined));
    const r = await svc.cancel(5);
    expect(r.ok).toBe(true);
    expect(repo.cancel).toHaveBeenCalledWith(5);
  });

  it('returns Err when updateStatus underlying findOne returns null', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.updateStatus(404, 'shipped');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });
});
