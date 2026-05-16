/**
 * sd-leads.service.spec.ts
 *
 * Unit tests for SdLeadsService. Repository + I18n are mocked; the convert
 * flow's atomic lead→order conversion logic is exercised end-to-end.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { SdLeadsService } from '../../src/modules/sd/application/sd-leads.service';
import { SdLeadsRepository } from '../../src/modules/sd/application/sd-leads.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  list: jest.Mock;
  getStats: jest.Mock;
  exportLeads: jest.Mock;
  getById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateStatus: jest.Mock;
  delete: jest.Mock;
  getLeadForConvert: jest.Mock;
  convertLeadToOrderAtomic: jest.Mock;
  addActivity: jest.Mock;
  getActivities: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    getStats: jest.fn(),
    exportLeads: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    getLeadForConvert: jest.fn(),
    convertLeadToOrderAtomic: jest.fn(),
    addActivity: jest.fn(),
    getActivities: jest.fn(),
  };
}

function makeI18n(): { t: jest.Mock } {
  return { t: jest.fn().mockResolvedValue('Lead not found') };
}

describe('SdLeadsService', () => {
  let svc: SdLeadsService;
  let repo: RepoMock;
  let i18n: { t: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    i18n = makeI18n();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdLeadsService,
        { provide: SdLeadsRepository, useValue: repo },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();
    svc = module.get(SdLeadsService);
  });

  it('forwards list filters and pagination to repository', async () => {
    repo.list.mockResolvedValue(Ok({ data: [], total: 0 }));
    await svc.list('new', 5, 'phone%', 20, 0);
    expect(repo.list).toHaveBeenCalledWith('new', 5, 'phone%', 20, 0);
  });

  it('returns Err when convert and lead not found in repository', async () => {
    repo.getLeadForConvert.mockResolvedValue(Ok(null));
    const r = await svc.convert(123, 'notes');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when convert fails reading the lead', async () => {
    repo.getLeadForConvert.mockResolvedValue(Err(AppErr('DB_ERROR', 'read failed')));
    const r = await svc.convert(123, null);
    expect(r.ok).toBe(false);
  });

  it('returns Err when atomic order creation fails on convert', async () => {
    repo.getLeadForConvert.mockResolvedValue(
      Ok({ customer_id: 7, expected_amount: 10000 }),
    );
    repo.convertLeadToOrderAtomic.mockResolvedValue(
      Err(AppErr('DB_ERROR', 'tx aborted')),
    );
    const r = await svc.convert(123, 'note');
    expect(r.ok).toBe(false);
  });

  it('returns lead_id and order when convert succeeds', async () => {
    repo.getLeadForConvert.mockResolvedValue(
      Ok({ customer_id: 7, expected_amount: 50000 }),
    );
    repo.convertLeadToOrderAtomic.mockResolvedValue(Ok({ id: 999, status: 'new' }));
    const r = await svc.convert(123, 'note');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.lead_id).toBe(123);
      expect(r.data.order).toEqual({ id: 999, status: 'new' });
    }
    expect(repo.convertLeadToOrderAtomic).toHaveBeenCalledWith(7, 50000, 123, 'note');
  });

  it('returns repository payload when getStats succeeds', async () => {
    const stats = { total: 100, new: 30 };
    repo.getStats.mockResolvedValue(Ok(stats));
    const r = await svc.getStats();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(stats);
  });
});
