/**
 * test/hr/leave.service.spec.ts
 *
 * Unit tests for LeaveService. Mocks IHrLeaveSvcRepository + I18nService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from '../../src/modules/hr/leave/leave.service';
import { HR_LEAVE_SVC_REPO } from '../../src/modules/hr/leave/i-hr-leave-svc.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

interface RepoMock {
  findAll: jest.Mock;
  findById: jest.Mock;
  findUserById: jest.Mock;
  create: jest.Mock;
  approve: jest.Mock;
  reject: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findAll: jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    findById: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'pending' })),
    findUserById: jest.fn().mockResolvedValue(Ok({ id: 5, name: 'X' })),
    create: jest.fn().mockResolvedValue(Ok({ id: 100 })),
    approve: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'approved' })),
    reject: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'rejected' })),
    ...overrides,
  };
}

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

async function buildSvc(repo: RepoMock): Promise<LeaveService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      LeaveService,
      { provide: HR_LEAVE_SVC_REPO, useValue: repo },
      { provide: I18nService, useValue: makeI18n() },
    ],
  }).compile();
  return mod.get(LeaveService);
}

describe('LeaveService', () => {
  describe('findAll()', () => {
    it('defaults: page=1 limit=10 → offset=0', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findAll();

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });

    it('forwards userId/status/leaveType filters', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findAll({ page: 1, limit: 5, userId: 42, status: 'pending', leaveType: 'vacation' });

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42, status: 'pending', leaveType: 'vacation' }),
      );
    });

    it('returns paginated envelope with totalPages', async () => {
      const repo = makeRepo({
        findAll: jest.fn().mockResolvedValue(Ok({ data: [], count: 23 })),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findAll({ page: 1, limit: 10 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { pagination: { totalPages: number; total: number } };
        expect(d.pagination.total).toBe(23);
        expect(d.pagination.totalPages).toBe(3);
      }
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findAll: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(false);
    });
  });

  describe('findOne()', () => {
    it('returns row when found', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const row = await svc.findOne(1);

      expect(row).toEqual({ id: 1, status: 'pending' });
    });

    it('throws NotFoundException when null', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerError when repo fails', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(1)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('create()', () => {
    it('verifies user exists before creating', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.create({ userId: 5, type: 'vacation' });

      expect(r.ok).toBe(true);
      expect(repo.findUserById).toHaveBeenCalledWith(5);
      expect(repo.create).toHaveBeenCalled();
    });

    it('returns failure when user not found', async () => {
      const repo = makeRepo({
        findUserById: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = await buildSvc(repo);

      const r = await svc.create({ userId: 999 });

      expect(r.ok).toBe(false);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('approve()', () => {
    it('approves a pending leave', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.approve(1);

      expect(r.ok).toBe(true);
      expect(repo.approve).toHaveBeenCalledWith(1);
    });

    it('rejects approving non-pending leaves', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'approved' })),
      });
      const svc = await buildSvc(repo);

      const r = await svc.approve(1);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
      expect(repo.approve).not.toHaveBeenCalled();
    });
  });

  describe('reject()', () => {
    it('rejects a leave after verifying existence', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.reject(1);

      expect(r.ok).toBe(true);
      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.reject).toHaveBeenCalledWith(1);
    });
  });
});
