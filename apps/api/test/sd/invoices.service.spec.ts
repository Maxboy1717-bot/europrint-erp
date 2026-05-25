/**
 * invoices.service.spec.ts
 *
 * Unit tests for InvoicesService. ISdInvoicesRepository is mocked; pagination
 * math (offset/page/limit envelope) is exercised end-to-end.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ISdInvoicesRepository,
  SD_INVOICES_REPO,
} from '../../src/modules/sd/invoices/i-sd-invoices.repo';
import { InvoicesService } from '../../src/modules/sd/invoices/invoices.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ISdInvoicesRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByInvoiceNumber: jest.fn(),
    create: jest.fn(),
  } as jest.Mocked<ISdInvoicesRepository>;
}

describe('InvoicesService', () => {
  let svc: InvoicesService;
  let repo: jest.Mocked<ISdInvoicesRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: SD_INVOICES_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(InvoicesService);
  });

  it('computes offset from page and limit when findAll called', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 4, limit: 10 });
    expect(repo.findAll).toHaveBeenCalledWith(10, 30);
  });

  it('returns pagination envelope including total when findAll succeeds', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }, { id: 2 }], count: 42 }));
    const r = await svc.findAll({ page: 1, limit: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        data: unknown[];
        pagination: { total: number; page: number; limit: number };
      };
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(42);
    }
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost')));
    const r = await svc.findAll({});
    expect(r.ok).toBe(false);
  });

  it('returns NOT_FOUND when findOne id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.findOne(999);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns invoice data when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 12, status: 'paid' }));
    const r = await svc.findOne(12);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { id: number };
      expect(data.id).toBe(12);
    }
  });

  it('forwards createdBy to repository when create called', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1 }));
    await svc.create({ amount: 5000 }, 7);
    expect(repo.create).toHaveBeenCalledWith({ amount: 5000 }, 7);
  });

  it('returns Err when create repository fails', async () => {
    repo.create.mockResolvedValue(Err(AppErr('DB_ERROR', 'insert failed')));
    const r = await svc.create({ amount: 10 });
    expect(r.ok).toBe(false);
  });
});
