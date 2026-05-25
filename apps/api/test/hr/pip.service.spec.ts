/**
 * test/hr/pip.service.spec.ts
 *
 * Unit tests for PipService — performance-improvement plans.
 * Mocks PipRepository + EventEmitter2.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { PipService } from '../../src/modules/hr/pip/pip.service';
import { PipRepository } from '../../src/modules/hr/pip/pip.repository';
import { PipWorkflowService } from '../../src/modules/hr/pip/pip-workflow.service';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  createPip: jest.Mock;
  addProgressUpdate: jest.Mock;
  getPip: jest.Mock;
  markCompleted: jest.Mock;
  markFailed: jest.Mock;
  acknowledge: jest.Mock;
  getByIdWithEmployee: jest.Mock;
  getProgressUpdates: jest.Mock;
  getByEmployee: jest.Mock;
  getActivePips: jest.Mock;
  listAll: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    createPip: jest.fn().mockResolvedValue(Ok({ id: 100, employee_id: 5 })),
    addProgressUpdate: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    getPip: jest.fn().mockResolvedValue(Ok({ id: 100, employee_id: 5 })),
    markCompleted: jest.fn().mockResolvedValue(Ok({ id: 100, status: 'completed' })),
    markFailed: jest.fn().mockResolvedValue(Ok({ id: 100, status: 'failed' })),
    acknowledge: jest.fn().mockResolvedValue(Ok({ id: 100 })),
    getByIdWithEmployee: jest.fn().mockResolvedValue(Ok({ id: 100, employee_id: 5 })),
    getProgressUpdates: jest.fn().mockResolvedValue([]),
    getByEmployee: jest.fn().mockResolvedValue(Ok([{ id: 1, employee_id: 5 }])),
    getActivePips: jest.fn().mockResolvedValue(Ok([])),
    listAll: jest.fn().mockResolvedValue(Ok([])),
    ...overrides,
  };
}

function makeEmitter(): EventEmitter2 {
  return { emit: jest.fn().mockReturnValue(true) } as unknown as EventEmitter2;
}

async function buildSvc(repo: RepoMock, emitter: EventEmitter2 = makeEmitter()): Promise<PipService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      PipService,
      PipWorkflowService,
      { provide: PipRepository, useValue: repo },
      { provide: EventEmitter2, useValue: emitter },
    ],
  }).compile();
  return mod.get(PipService);
}

describe('PipService', () => {
  describe('createPip()', () => {
    it('uses default duration 30 days when not provided', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createPip({ employeeId: 5, createdBy: 1 });

      const arg = repo.createPip.mock.calls[0]?.[0] as { durationDays: number };
      expect(arg.durationDays).toBe(30);
    });

    it('preserves custom durationDays', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createPip({ employeeId: 5, createdBy: 1, durationDays: 60 });

      const arg = repo.createPip.mock.calls[0]?.[0] as { durationDays: number };
      expect(arg.durationDays).toBe(60);
    });

    it('emits PIP_STARTED event with employeeId', async () => {
      const emitter = makeEmitter();
      const svc = await buildSvc(makeRepo(), emitter);

      await svc.createPip({ employeeId: 5, createdBy: 1 });

      expect(emitter.emit).toHaveBeenCalled();
      const args = (emitter.emit as jest.Mock).mock.calls[0];
      expect(args[1]).toMatchObject({ employeeId: 5 });
    });
  });

  describe('addProgressUpdate()', () => {
    it('uses default status "on_track" when not provided', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addProgressUpdate(100, { updatedBy: 1, notes: 'good' });

      const call = repo.addProgressUpdate.mock.calls[0];
      expect(call[3]).toBe('on_track');
    });

    it('triggers markCompleted when status="completed"', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addProgressUpdate(100, { updatedBy: 1, notes: 'done', status: 'completed' });

      expect(repo.markCompleted).toHaveBeenCalledWith(100);
    });

    it('triggers markFailed when status="failed"', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addProgressUpdate(100, { updatedBy: 1, notes: 'no improvement', status: 'failed' });

      expect(repo.markFailed).toHaveBeenCalledWith(100);
    });

    it('does not mark completion for other statuses', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.addProgressUpdate(100, { updatedBy: 1, notes: 'progress', status: 'on_track' });

      expect(repo.markCompleted).not.toHaveBeenCalled();
      expect(repo.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('acknowledge()', () => {
    it('returns success when row exists', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.acknowledge(100);

      expect(r.ok).toBe(true);
      expect(repo.acknowledge).toHaveBeenCalledWith(100);
    });

    it('returns failure Result when row missing', async () => {
      const repo = makeRepo({ acknowledge: jest.fn().mockResolvedValue(Err(AppErr('NOT_FOUND', 'pip not found'))) });
      const svc = await buildSvc(repo);

      const r = await svc.acknowledge(999);

      expect(r.ok).toBe(false);
    });
  });

  describe('getById()', () => {
    it('returns failure when not found', async () => {
      const repo = makeRepo({
        getByIdWithEmployee: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getById(999);

      expect(r.ok).toBe(false);
    });

    it('attaches progress_updates when found', async () => {
      const repo = makeRepo({
        getByIdWithEmployee: jest.fn().mockResolvedValue(Ok({ id: 100, employee_id: 5 })),
        getProgressUpdates: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getById(100);

      expect(r.ok).toBe(true);
      expect(repo.getProgressUpdates).toHaveBeenCalledWith(100);
    });
  });
});
