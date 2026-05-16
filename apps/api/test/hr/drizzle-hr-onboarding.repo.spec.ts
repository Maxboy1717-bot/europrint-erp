/**
 * test/hr/drizzle-hr-onboarding.repo.spec.ts
 *
 * Unit tests for DrizzleHrOnboardingRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  hrOnboardingPlans: {
    id: 'id', isActive: 'isActive', positionId: 'positionId',
    departmentId: 'departmentId', createdAt: 'createdAt',
  },
  hrEmployeeOnboardings: {
    id: 'id', employeeId: 'employeeId', startDate: 'startDate',
  },
  users: { id: 'id', fullName: 'fullName', deletedAt: 'deletedAt' },
}));

import { DrizzleHrOnboardingRepository } from '../../src/modules/hr/onboarding/repos/drizzle-hr-onboarding.repo';

describe('DrizzleHrOnboardingRepository', () => {
  let repo: DrizzleHrOnboardingRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleHrOnboardingRepository();
  });

  describe('createPlan', () => {
    it('returns Ok with created plan', async () => {
      kit.queueInsert([{ id: 1, title: 'Plan' }]);
      const r = await repo.createPlan({ title: 'Plan' }, 7);
      expect(r.ok).toBe(true);
    });

    it('serializes tasks to JSON when provided', async () => {
      kit.queueInsert([{ id: 2, tasks: '[]' }]);
      const r = await repo.createPlan({ title: 'P', tasks: [{ name: 'Step' }] }, 1);
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createPlan({}, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('listPlans', () => {
    it('returns Ok with active plans', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.listPlans();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('filters by positionId when provided', async () => {
      kit.queueSelect([{ id: 2, positionId: 5 }]);
      const r = await repo.listPlans(5);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.listPlans();
      expect(r.ok).toBe(false);
    });
  });

  describe('getPlanById', () => {
    it('returns Ok with plan when present', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.getPlanById(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.getPlanById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.getPlanById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findEmployeeById', () => {
    it('returns Ok with employee when present', async () => {
      kit.queueSelect([{ id: 7, fullName: 'Ali' }]);
      const r = await repo.findEmployeeById(7);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findEmployeeById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findEmployeeById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('startOnboarding', () => {
    it('returns Ok with created onboarding record', async () => {
      kit.queueInsert([{ id: 1, employeeId: 7 }]);
      const r = await repo.startOnboarding({
        employeeId: 7, planId: 1, startDate: new Date(), expectedEndDate: new Date(),
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.startOnboarding({
        employeeId: 1, planId: 1, startDate: new Date(), expectedEndDate: new Date(),
      });
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.startOnboarding({
        employeeId: 1, planId: 1, startDate: new Date(), expectedEndDate: new Date(),
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Onboarding boshlashda xatolik');
    });
  });

  describe('getOnboardingById', () => {
    it('returns Ok with onboarding when present', async () => {
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.getOnboardingById(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.getOnboardingById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getOnboardingById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateProgress', () => {
    it('returns Ok with updated row', async () => {
      kit.queueUpdate([{ id: 1, weeklyProgress: '[]' }]);
      const r = await repo.updateProgress(1, [{ week: 1 }], new Date());
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.updateProgress(1, [], new Date());
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.updateProgress(404, [], new Date());
      expect(r.ok).toBe(true);
    });
  });

  describe('completeProbation', () => {
    it('returns Ok with completed onboarding', async () => {
      kit.queueUpdate([{ id: 1, status: 'COMPLETED' }]);
      const r = await repo.completeProbation(1, {
        status: 'COMPLETED', isProbationPassed: true,
        actualEndDate: new Date(), updatedAt: new Date(),
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('boom'));
      const r = await repo.completeProbation(1, {
        status: 'COMPLETED', isProbationPassed: false,
        actualEndDate: new Date(), updatedAt: new Date(),
      });
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row', async () => {
      kit.queueUpdate([]);
      const r = await repo.completeProbation(1, {
        status: 'X', isProbationPassed: false,
        actualEndDate: new Date(), updatedAt: new Date(),
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('getEmployeeOnboarding', () => {
    it('returns Ok with onboarding history', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.getEmployeeOnboarding(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.getEmployeeOnboarding(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getEmployeeOnboarding(1);
      expect(r.ok).toBe(false);
    });
  });
});
