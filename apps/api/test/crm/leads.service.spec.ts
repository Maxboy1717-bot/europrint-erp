/**
 * leads.service.spec.ts
 *
 * Unit tests for CRM LeadsService. ICrmLeadsRepository is mocked; pagination
 * envelope ({ data, pagination: { total, page, limit } }) runs as real logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ICrmLeadsRepository,
  CRM_LEADS_REPO,
} from '../../src/modules/crm/leads/i-crm-leads.repo';
import { LeadsService } from '../../src/modules/crm/leads/leads.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ICrmLeadsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as jest.Mocked<ICrmLeadsRepository>;
}

describe('LeadsService', () => {
  let svc: LeadsService;
  let repo: jest.Mocked<ICrmLeadsRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: CRM_LEADS_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(LeadsService);
  });

  it('returns pagination envelope when findAll succeeds', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [{ id: 1 }], count: 35 }));
    const r = await svc.findAll({ page: 2, limit: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        data: unknown[];
        pagination: { total: number; page: number; limit: number };
      };
      expect(data.pagination).toEqual({ total: 35, page: 2, limit: 5 });
    }
  });

  it('defaults to page=1 limit=10 when query empty', async () => {
    repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));
    await svc.findAll({});
    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.findAll({});
    expect(r.ok).toBe(false);
  });

  it('throws NotFound when findOne id missing', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    await expect(svc.findOne(404)).rejects.toThrow();
  });

  it('returns lead payload when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 7, status: 'new' }));
    const r = await svc.findOne(7);
    expect((r as { id: number }).id).toBe(7);
  });

  it('returns Err when update target not found', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.update(404, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when create repository fails', async () => {
    repo.create.mockResolvedValue(Err(AppErr('DB_ERROR', 'insert failed')));
    const r = await svc.create({ name: 'Lead' }, 5);
    expect(r.ok).toBe(false);
  });

  it('returns success when remove succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 1 }));
    repo.softDelete.mockResolvedValue(Ok(undefined));
    const r = await svc.remove(1);
    expect(r.ok).toBe(true);
  });
});
