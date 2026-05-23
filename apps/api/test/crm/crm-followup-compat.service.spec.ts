/**
 * crm-followup-compat.service.spec.ts
 *
 * Unit tests for CrmFollowupCompatService. The repository is mocked; safeCall
 * wrapping (Result<T> envelope from throws) is exercised.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmFollowupCompatService } from '../../src/modules/crm/application/crm-followup-compat.service';
import { CRM_FOLLOWUP_COMPAT_REPO } from '../../src/modules/crm/domain/repositories/i-crm-followup-compat.repo';

type RepoMock = {
  list: jest.Mock;
  today: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    today: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CrmFollowupCompatService', () => {
  let svc: CrmFollowupCompatService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmFollowupCompatService,
        { provide: CRM_FOLLOWUP_COMPAT_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmFollowupCompatService);
  });

  it('forwards lead id and pagination to list repository', async () => {
    repo.list.mockResolvedValue({ data: [] });
    await svc.list(7, 25, 10);
    expect(repo.list).toHaveBeenCalledWith(7, 25, 10);
  });

  it('returns Err when list repository throws', async () => {
    repo.list.mockRejectedValue(new Error('db down'));
    const r = await svc.list(null, 10, 0);
    expect(r.ok).toBe(false);
  });

  it('returns Ok with payload when today succeeds', async () => {
    repo.today.mockResolvedValue([{ id: 1 }]);
    const r = await svc.today();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { length: number };
      expect(data.length).toBe(1);
    }
  });

  it('returns Err when today repository throws', async () => {
    repo.today.mockRejectedValue(new Error('timeout'));
    const r = await svc.today();
    expect(r.ok).toBe(false);
  });

  it('returns Ok envelope when create succeeds', async () => {
    repo.create.mockResolvedValue({ id: 1 });
    const r = await svc.create({ title: 'F' });
    expect(r.ok).toBe(true);
  });

  it('returns Err when create repository throws', async () => {
    repo.create.mockRejectedValue(new Error('insert failed'));
    const r = await svc.create({});
    expect(r.ok).toBe(false);
  });

  it('returns Ok when update succeeds', async () => {
    repo.update.mockResolvedValue({ id: 1, updated: true });
    const r = await svc.update(1, { title: 'X' });
    expect(r.ok).toBe(true);
  });

  it('forwards id when delete called', async () => {
    repo.delete.mockResolvedValue(undefined);
    await svc.delete(99);
    expect(repo.delete).toHaveBeenCalledWith(99);
  });
});
