/**
 * test/qc/report-defect.handler.spec.ts
 *
 * Unit tests for ReportDefectHandler. Repo + EventBus mocked.
 * Real Defect aggregate is produced by the handler.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ReportDefectHandler } from '../../src/modules/qc/application/commands/report-defect.handler';
import { ReportDefectCommand } from '../../src/modules/qc/application/commands/report-defect.command';
import {
  Defect,
  DefectSeverity,
  DefectStatus,
} from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../src/modules/qc/infrastructure/repositories/drizzle-defect.repo';

type RepoMock = Partial<Record<keyof IQcDefectRepository, jest.Mock>> & {
  saveDefect: jest.Mock<Promise<Result<Defect>>, [Defect]>;
};

function makeRepo(): RepoMock {
  return {
    findDefectById: jest.fn(),
    findDefects: jest.fn(),
    saveDefect: jest.fn().mockImplementation((d: Defect) => Promise.resolve(Ok(d))),
    updateDefect: jest.fn(),
    getDefectStats: jest.fn(),
    findReclamationById: jest.fn(),
    findReclamations: jest.fn(),
    saveReclamation: jest.fn(),
    updateReclamation: jest.fn(),
    getReclamationStats: jest.fn(),
  };
}

function mkCmd(severity: DefectSeverity): ReportDefectCommand {
  return new ReportDefectCommand('insp-1', 'po-1', 'wc-1', 'D-001', 'edge crease', severity, 3, 'pcs', 'user-1');
}

describe('ReportDefectHandler', () => {
  let handler: ReportDefectHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportDefectHandler,
        { provide: QC_DEFECT_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(ReportDefectHandler);
  });

  it('returns ok with a Defect aggregate in OPEN status when save succeeds', async () => {
    const r = await handler.execute(mkCmd(DefectSeverity.MINOR));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeInstanceOf(Defect);
      expect(r.data.status).toBe(DefectStatus.OPEN);
      expect(r.data.defectCode).toBe('D-001');
    }
  });

  it('does NOT publish QC_FAILED event for minor defects', async () => {
    await handler.execute(mkCmd(DefectSeverity.MINOR));

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('publishes QC_FAILED event when severity is critical', async () => {
    await handler.execute(mkCmd(DefectSeverity.CRITICAL));

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const evt = eventBus.publish.mock.calls[0][0];
    expect(evt.severity).toBe('critical');
    expect(typeof evt.defectId).toBe('string');
  });

  it('returns err when repository save fails', async () => {
    repo.saveDefect.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'connection lost')));

    const r = await handler.execute(mkCmd(DefectSeverity.MAJOR));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('persists exactly one defect per command', async () => {
    await handler.execute(mkCmd(DefectSeverity.MAJOR));

    expect(repo.saveDefect).toHaveBeenCalledTimes(1);
    const saved = repo.saveDefect.mock.calls[0][0];
    expect(saved.quantity).toBe(3);
    expect(saved.unit).toBe('pcs');
  });
});
