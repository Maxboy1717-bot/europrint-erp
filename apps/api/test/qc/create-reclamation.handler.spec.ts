/**
 * test/qc/create-reclamation.handler.spec.ts
 *
 * Unit tests for CreateReclamationHandler. IQcDefectRepository is mocked;
 * real Reclamation aggregate is constructed by the handler.
 */

import { Test } from '@nestjs/testing';
import { CreateReclamationHandler } from '../../src/modules/qc/application/commands/create-reclamation.handler';
import { CreateReclamationCommand } from '../../src/modules/qc/application/commands/create-reclamation.command';
import {
  Reclamation,
  ReclamationStatus,
} from '../../src/modules/qc/domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../src/modules/qc/infrastructure/repositories/drizzle-defect.repo';

type RepoMock = Partial<Record<keyof IQcDefectRepository, jest.Mock>> & {
  saveReclamation: jest.Mock<Promise<Result<Reclamation>>, [Reclamation]>;
};

function makeRepo(): RepoMock {
  return {
    findDefectById: jest.fn(),
    findDefects: jest.fn(),
    saveDefect: jest.fn(),
    updateDefect: jest.fn(),
    getDefectStats: jest.fn(),
    findReclamationById: jest.fn(),
    findReclamations: jest.fn(),
    saveReclamation: jest.fn().mockImplementation((r: Reclamation) => Promise.resolve(Ok(r))),
    updateReclamation: jest.fn(),
    getReclamationStats: jest.fn(),
  };
}

describe('CreateReclamationHandler', () => {
  let handler: CreateReclamationHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateReclamationHandler,
        { provide: QC_DEFECT_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(CreateReclamationHandler);
  });

  it('returns ok with a Reclamation when repository save succeeds', async () => {
    const cmd = new CreateReclamationCommand('ACME LLC', 'cust-1', 'ord-1', 'broken case', DefectSeverity.MAJOR);

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeInstanceOf(Reclamation);
      expect(r.data.customerName).toBe('ACME LLC');
      expect(r.data.severity).toBe(DefectSeverity.MAJOR);
    }
  });

  it('initializes status to NEW on freshly created reclamation', async () => {
    await handler.execute(
      new CreateReclamationCommand('X', null, null, 'd', DefectSeverity.MINOR),
    );

    const saved = repo.saveReclamation.mock.calls[0][0];
    expect(saved.status).toBe(ReclamationStatus.NEW);
  });

  it('forwards repository failure verbatim when save returns err', async () => {
    repo.saveReclamation.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'oops')));

    const r = await handler.execute(
      new CreateReclamationCommand('X', null, null, 'd', DefectSeverity.MINOR),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('persists the aggregate through the repository exactly once', async () => {
    await handler.execute(
      new CreateReclamationCommand('Cust', null, null, 'desc', DefectSeverity.CRITICAL),
    );

    expect(repo.saveReclamation).toHaveBeenCalledTimes(1);
  });

  it('always passes id=0 as a placeholder -- the repository assigns the real serial id', async () => {
    await handler.execute(
      new CreateReclamationCommand('A', null, null, 'd', DefectSeverity.MINOR),
    );
    await handler.execute(
      new CreateReclamationCommand('B', null, null, 'd', DefectSeverity.MINOR),
    );

    const first = repo.saveReclamation.mock.calls[0][0];
    const second = repo.saveReclamation.mock.calls[1][0];
    expect(first.id).toBe(0);
    expect(second.id).toBe(0);
  });

  // B14 (2026-07-05): qc_reclamations.created_by existed but was never written.
  it('threads command.createdBy onto the saved Reclamation', async () => {
    await handler.execute(
      new CreateReclamationCommand('X', null, null, 'd', DefectSeverity.MINOR, 42),
    );

    const saved = repo.saveReclamation.mock.calls[0][0];
    expect(saved.createdBy).toBe(42);
  });
});
