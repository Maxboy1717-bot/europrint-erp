/**
 * pipelines.service.spec.ts
 *
 * Unit tests for CRM PipelinesService. ICrmPipelinesRepository is mocked; the
 * real "fetch pipeline + nested stages" merge runs for the findOne flow.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ICrmPipelinesRepository,
  CRM_PIPELINES_REPO,
} from '../../src/modules/crm/pipelines/i-crm-pipelines.repo';
import { PipelinesService } from '../../src/modules/crm/pipelines/pipelines.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeRepo(): jest.Mocked<ICrmPipelinesRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findStagesByCategoryId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as jest.Mocked<ICrmPipelinesRepository>;
}

describe('PipelinesService', () => {
  let svc: PipelinesService;
  let repo: jest.Mocked<ICrmPipelinesRepository>;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelinesService,
        { provide: CRM_PIPELINES_REPO, useValue: repo },
      ],
    }).compile();
    svc = module.get(PipelinesService);
  });

  it('returns repository payload when findAll succeeds', async () => {
    repo.findAll.mockResolvedValue(Ok([{ id: 1 }, { id: 2 }]));
    const r = await svc.findAll();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('returns Err when findAll repository fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const r = await svc.findAll();
    expect(r.ok).toBe(false);
  });

  it('merges stages into pipeline when findOne succeeds', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 5, name: 'Sales' }));
    repo.findStagesByCategoryId.mockResolvedValue(
      Ok([{ id: 11, name: 'Qualified' }]),
    );
    const r = await svc.findOne(5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { id: number; stages: unknown[] };
      expect(data.id).toBe(5);
      expect(data.stages).toHaveLength(1);
    }
  });

  it('returns NOT_FOUND when pipeline does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const r = await svc.findOne(404);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when stage repo fails', async () => {
    repo.findById.mockResolvedValue(Ok({ id: 5 }));
    repo.findStagesByCategoryId.mockResolvedValue(
      Err(AppErr('DB_ERROR', 'fail')),
    );
    const r = await svc.findOne(5);
    expect(r.ok).toBe(false);
  });

  it('forwards dto to repository when create called', async () => {
    repo.create.mockResolvedValue(Ok({ id: 1, name: 'P' }));
    await svc.create({ name: 'P' });
    expect(repo.create).toHaveBeenCalledWith({ name: 'P' });
  });

  it('returns success message when remove succeeds', async () => {
    repo.remove.mockResolvedValue(Ok(undefined));
    const r = await svc.remove(1);
    expect(r.ok).toBe(true);
  });
});
