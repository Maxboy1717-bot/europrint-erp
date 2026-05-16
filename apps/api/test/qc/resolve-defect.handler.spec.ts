/**
 * test/qc/resolve-defect.handler.spec.ts
 *
 * Unit tests for ResolveDefectHandler. Repo mocked. Real Defect mutated.
 */

import { Test } from '@nestjs/testing';
import { ResolveDefectHandler } from '../../src/modules/qc/application/commands/resolve-defect.handler';
import { ResolveDefectCommand } from '../../src/modules/qc/application/commands/resolve-defect.command';
import {
  Defect,
  DefectSeverity,
  DefectStatus,
} from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../src/modules/qc/infrastructure/repositories/drizzle-defect.repo';

type RepoMock = Partial<Record<keyof IQcDefectRepository, jest.Mock>> & {
  findDefectById: jest.Mock<Promise<Result<Defect | null>>, [string]>;
  updateDefect: jest.Mock<Promise<Result<Defect>>, [Defect]>;
};

function makeDefect(): Defect {
  return new Defect(
    'def-1', 'insp-1', 'po-1', 'wc-1', 'D-1', 'crease',
    DefectSeverity.MAJOR, DefectStatus.OPEN,
    2, 'pcs', 'reporter-1',
    null, null, null,
    new Date(), new Date(),
  );
}

function makeRepo(): RepoMock {
  return {
    findDefectById: jest.fn(),
    findDefects: jest.fn(),
    saveDefect: jest.fn(),
    updateDefect: jest.fn().mockImplementation((d: Defect) => Promise.resolve(Ok(d))),
    getDefectStats: jest.fn(),
    findReclamationById: jest.fn(),
    findReclamations: jest.fn(),
    saveReclamation: jest.fn(),
    updateReclamation: jest.fn(),
    getReclamationStats: jest.fn(),
  };
}

describe('ResolveDefectHandler', () => {
  let handler: ResolveDefectHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ResolveDefectHandler,
        { provide: QC_DEFECT_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ResolveDefectHandler);
  });

  it('returns NOT_FOUND when defect does not exist', async () => {
    repo.findDefectById.mockResolvedValueOnce(Ok(null));

    const r = await handler.execute(new ResolveDefectCommand('def-x', 'u-1', 'rework done'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.updateDefect).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when findDefectById itself errors out', async () => {
    repo.findDefectById.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new ResolveDefectCommand('def-x', 'u-1', 'r'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('marks defect resolved and forwards updated aggregate to repo on success', async () => {
    const defect = makeDefect();
    repo.findDefectById.mockResolvedValueOnce(Ok(defect));

    const r = await handler.execute(new ResolveDefectCommand('def-1', 'inspector-9', 'scrapped'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('def-1');
    expect(defect.status).toBe(DefectStatus.RESOLVED);
    expect(defect.resolvedBy).toBe('inspector-9');
    expect(defect.resolution).toBe('scrapped');
    expect(repo.updateDefect).toHaveBeenCalledWith(defect);
  });

  it('returns repository error when updateDefect fails', async () => {
    repo.findDefectById.mockResolvedValueOnce(Ok(makeDefect()));
    repo.updateDefect.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'write failed')));

    const r = await handler.execute(new ResolveDefectCommand('def-1', 'u-1', 'r'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('looks up the defect using the id from the command', async () => {
    repo.findDefectById.mockResolvedValueOnce(Ok(makeDefect()));

    await handler.execute(new ResolveDefectCommand('def-1', 'u-1', 'r'));

    expect(repo.findDefectById).toHaveBeenCalledWith('def-1');
  });
});
