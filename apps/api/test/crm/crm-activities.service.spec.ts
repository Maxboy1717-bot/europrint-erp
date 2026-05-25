/**
 * crm-activities.service.spec.ts
 *
 * Unit tests for CrmActivitiesService. The repository is mocked; the service's
 * "row missing → 404" guards run for getById/update/complete.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmActivitiesService } from '../../src/modules/crm/application/crm-activities.service';
import { CRM_ACTIVITIES_REPO } from '../../src/modules/crm/domain/repositories/i-crm-activities.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  list: jest.Mock;
  today: jest.Mock;
  getById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  complete: jest.Mock;
  delete: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    list: jest.fn(),
    today: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    complete: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CrmActivitiesService', () => {
  let svc: CrmActivitiesService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmActivitiesService,
        { provide: CRM_ACTIVITIES_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmActivitiesService);
  });

  it('forwards all filter arguments to list repository call', async () => {
    repo.list.mockResolvedValue(Ok([]));
    await svc.list(1, 2, 3, 'call', 'open', 25, 10);
    expect(repo.list).toHaveBeenCalledWith(1, 2, 3, 'call', 'open', 25, 10);
  });

  it('returns Err when getById row missing', async () => {
    repo.getById.mockResolvedValue(Ok(null));
    const r = await svc.getById(99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when getById repo errors', async () => {
    repo.getById.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.getById(99);
    expect(r.ok).toBe(false);
  });

  it('returns activity data when getById succeeds', async () => {
    repo.getById.mockResolvedValue(Ok({ id: 7, type: 'call' }));
    const r = await svc.getById(7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { id: number };
      expect(data.id).toBe(7);
    }
  });

  it('returns Err when update target missing', async () => {
    repo.update.mockResolvedValue(Ok(null));
    const r = await svc.update(404, { notes: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('forwards outcome and id when complete called', async () => {
    repo.complete.mockResolvedValue(Ok({ id: 1, status: 'done' }));
    const r = await svc.complete(1, 'success');
    expect(repo.complete).toHaveBeenCalledWith(1, 'success');
    expect(r.ok).toBe(true);
  });

  it('returns Err when complete row missing', async () => {
    repo.complete.mockResolvedValue(Ok(null));
    const r = await svc.complete(1, 'success');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });
});
