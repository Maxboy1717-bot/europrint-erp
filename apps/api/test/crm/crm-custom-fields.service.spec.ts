/**
 * crm-custom-fields.service.spec.ts
 *
 * Unit tests for CrmCustomFieldsService. CrmCustomFieldsRepository is mocked;
 * the reorder/delete envelope builders execute as real logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmCustomFieldsService } from '../../src/modules/crm/application/crm-custom-fields.service';
import { CrmCustomFieldsRepository } from '../../src/modules/crm/application/crm-custom-fields.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  list: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  reorder: jest.Mock;
  remove: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    reorder: jest.fn(),
    remove: jest.fn(),
  };
}

describe('CrmCustomFieldsService', () => {
  let svc: CrmCustomFieldsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmCustomFieldsService,
        { provide: CrmCustomFieldsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmCustomFieldsService);
  });

  it('forwards entity type filter to list repository', async () => {
    repo.list.mockResolvedValue(Ok([]));
    await svc.list('lead');
    expect(repo.list).toHaveBeenCalledWith('lead');
  });

  it('passes null filter when no entity type provided', async () => {
    repo.list.mockResolvedValue(Ok([]));
    await svc.list(null);
    expect(repo.list).toHaveBeenCalledWith(null);
  });

  it('returns payload when create succeeds', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1, label: 'x' }));
    const r = await svc.create({ label: 'x' });
    expect(r.ok).toBe(true);
  });

  it('returns reordered count when reorder succeeds', async () => {
    repo.reorder.mockResolvedValue(undefined);
    const items = [
      { id: 1, order_index: 0 },
      { id: 2, order_index: 1 },
      { id: 3, order_index: 2 },
    ];
    const r = await svc.reorder(items);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { reordered: number };
      expect(data.reordered).toBe(3);
    }
  });

  it('returns Err when reorder repository throws', async () => {
    repo.reorder.mockRejectedValue(new Error('db locked'));
    const r = await svc.reorder([{ id: 1, order_index: 0 }]);
    expect(r.ok).toBe(false);
  });

  it('returns deleted flag when delete succeeds', async () => {
    repo.remove.mockResolvedValue(undefined);
    const r = await svc.delete(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { deleted: boolean };
      expect(data.deleted).toBe(true);
    }
  });

  it('returns Err when delete repository throws', async () => {
    repo.remove.mockRejectedValue(new Error('FK violation'));
    const r = await svc.delete(1);
    expect(r.ok).toBe(false);
  });

  it('forwards update body verbatim to repository', async () => {
    repo.update.mockResolvedValue(Ok({ id: 1, label: 'new' }));
    await svc.update(1, { label: 'new' });
    expect(repo.update).toHaveBeenCalledWith(1, { label: 'new' });
  });
});
