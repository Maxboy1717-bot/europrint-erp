/**
 * test/hr/career-path.service.spec.ts
 *
 * Unit tests for CareerPathService — employee growth trajectory tracker.
 * Mocks CareerPathRepository + EventEmitter2.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CareerPathService } from '../../src/modules/hr/career-path/career-path.service';
import { CareerPathRepository } from '../../src/modules/hr/career-path/career-path.repository';
import { Ok } from '../../src/common/result';

interface RepoMock {
  createPath: jest.Mock;
  updateStep: jest.Mock;
  getPathProgress: jest.Mock;
  getPath: jest.Mock;
  updatePathProgress: jest.Mock;
  markPathCompleted: jest.Mock;
  getByEmployee: jest.Mock;
  getStepsByPath: jest.Mock;
  addStep: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    createPath: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    updateStep: jest.fn().mockResolvedValue({ id: 1, is_completed: true }),
    getPathProgress: jest.fn().mockResolvedValue(Ok({ total: 5, completed: 2 })),
    getPath: jest.fn().mockResolvedValue(Ok({
      id: 1,
      employee_id: 5,
      start_date: '2025-01-01',
      created_at: '2025-01-01',
      estimated_months: 12,
    })),
    updatePathProgress: jest.fn().mockResolvedValue(undefined),
    markPathCompleted:  jest.fn().mockResolvedValue(undefined),
    getByEmployee: jest.fn().mockResolvedValue(Ok([{ id: 1 }])),
    getStepsByPath: jest.fn().mockResolvedValue([{ id: 1 }]),
    addStep: jest.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

function makeEmitter(): EventEmitter2 {
  return { emit: jest.fn().mockReturnValue(true) } as unknown as EventEmitter2;
}

async function buildSvc(repo: RepoMock, emitter: EventEmitter2 = makeEmitter()): Promise<CareerPathService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      CareerPathService,
      { provide: CareerPathRepository, useValue: repo },
      { provide: EventEmitter2, useValue: emitter },
    ],
  }).compile();
  return mod.get(CareerPathService);
}

describe('CareerPathService', () => {
  describe('createPath()', () => {
    it('passes estimatedMonths through (custom value)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createPath({
        employeeId: 5,
        currentPositionId: 1,
        targetPositionId: 2,
        createdBy: 1,
        estimatedMonths: 18,
      });

      const arg = repo.createPath.mock.calls[0]?.[0] as { estimatedMonths: number };
      expect(arg.estimatedMonths).toBe(18);
    });

    it('defaults estimatedMonths to 12 when missing', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createPath({
        employeeId: 5,
        currentPositionId: 1,
        targetPositionId: 2,
        createdBy: 1,
      });

      const arg = repo.createPath.mock.calls[0]?.[0] as { estimatedMonths: number };
      expect(arg.estimatedMonths).toBe(12);
    });
  });

  describe('updateProgress()', () => {
    it('marks path completed when overallProgress reaches 100', async () => {
      // total/completed both 5 → skillsProgress=100; very old start → timeProgress=100
      // → overall=100 → markPathCompleted called
      const repo = makeRepo({
        getPathProgress: jest.fn().mockResolvedValue(Ok({ total: 5, completed: 5 })),
        getPath: jest.fn().mockResolvedValue(Ok({
          id: 1,
          employee_id: 5,
          start_date: '2020-01-01',
          estimated_months: 1,
        })),
      });
      const svc = await buildSvc(repo);

      await svc.updateProgress(1, 10, true, 1);

      expect(repo.markPathCompleted).toHaveBeenCalledWith(1);
    });

    it('updates progress when path is incomplete', async () => {
      const repo = makeRepo({
        getPathProgress: jest.fn().mockResolvedValue(Ok({ total: 5, completed: 1 })),
      });
      const svc = await buildSvc(repo);

      await svc.updateProgress(1, 10, false, 1);

      expect(repo.updatePathProgress).toHaveBeenCalled();
      expect(repo.markPathCompleted).not.toHaveBeenCalled();
    });

    it('emits progress event', async () => {
      const emitter = makeEmitter();
      const svc = await buildSvc(makeRepo(), emitter);

      await svc.updateProgress(1, 10, true, 1);

      expect(emitter.emit).toHaveBeenCalled();
    });
  });

  describe('getByEmployee()', () => {
    it('attaches steps to each path row', async () => {
      const repo = makeRepo({
        getByEmployee: jest.fn().mockResolvedValue(Ok([{ id: 11 }, { id: 12 }])),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getByEmployee(5);

      expect(r.ok).toBe(true);
      expect(repo.getStepsByPath).toHaveBeenCalledTimes(2);
    });
  });

  describe('addStep()', () => {
    it('converts estimatedDays to estimated months (≥ 1)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addStep(1, { stepOrder: 1, estimatedDays: 60 });

      const callArg = repo.addStep.mock.calls[0]?.[1] as { requiredMonths: number };
      expect(callArg.requiredMonths).toBe(2);
    });

    it('clamps requiredMonths to at least 1', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addStep(1, { stepOrder: 1, estimatedDays: 5 });

      const callArg = repo.addStep.mock.calls[0]?.[1] as { requiredMonths: number };
      expect(callArg.requiredMonths).toBeGreaterThanOrEqual(1);
    });

    it('joins skill code and description when both provided', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addStep(1, {
        stepOrder: 1,
        requiredSkillCode: 'JS',
        description: 'advanced',
      });

      const callArg = repo.addStep.mock.calls[0]?.[1] as { skills: string | null };
      expect(callArg.skills).toContain('JS');
      expect(callArg.skills).toContain('advanced');
    });
  });
});
