/**
 * deals.service.spec.ts
 *
 * Unit tests for CRM DealsService. ICrmDealsRepository is mocked; page/limit
 * clamping mirrors ContactsService (1..100).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import {
  ICrmDealsRepository,
  CRM_DEALS_REPO,
} from '../../src/modules/crm/deals/i-crm-deals.repo';
import { DealsService } from '../../src/modules/crm/deals/deals.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

function makeRepo(): jest.Mocked<ICrmDealsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as jest.Mocked<ICrmDealsRepository>;
}

describe('DealsService', () => {
  let svc: DealsService;
  let repo: jest.Mocked<ICrmDealsRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: CRM_DEALS_REPO, useValue: repo },
        { provide: I18nService, useValue: makeI18n() },
      ],
    }).compile();
    svc = module.get(DealsService);
  });

  it('clamps limit at 100 when over-large limit requested', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 1, limit: 1000 });
    expect(repo.findAll).toHaveBeenCalledWith(100, 0);
  });

  it('clamps limit to 1 when negative limit requested', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({ page: 2, limit: -1 });
    expect(repo.findAll).toHaveBeenCalledWith(1, 1);
  });

  it('returns total alongside data when findAll succeeds', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }], count: 7 }));
    const r = await svc.findAll({ page: 1, limit: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { data: unknown[]; total: number };
      expect(data.total).toBe(7);
    }
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.findAll({});
    expect(r.ok).toBe(false);
  });

  it('throws NotFound when findOne id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    await expect(svc.findOne(999)).rejects.toThrow();
  });

  it('returns deal payload when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 7, amount: 1000 }));
    const r = await svc.findOne(7);
    expect((r as { id: number }).id).toBe(7);
  });

  it('forwards createdBy when create called', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1 }));
    await svc.create({ name: 'D' }, 99);
    expect(repo.create).toHaveBeenCalledWith({ name: 'D' }, 99);
  });

  it('returns success message when remove succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 1 }));
    repo.softDelete.mockResolvedValue(Ok(undefined));
    const r = await svc.remove(1);
    expect(r.ok).toBe(true);
  });
});
