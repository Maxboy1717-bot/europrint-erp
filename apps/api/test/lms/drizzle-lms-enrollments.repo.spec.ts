/**
 * test/lms/drizzle-lms-enrollments.repo.spec.ts
 *
 * Unit tests for DrizzleLmsEnrollmentsRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  assignments: { id: 'id', userId: 'userId', courseId: 'courseId' },
  courses: { id: 'id' },
}));

import { DrizzleLmsEnrollmentsRepository } from '../../src/modules/lms/enrollments/drizzle-lms-enrollments.repo';

describe('DrizzleLmsEnrollmentsRepository', () => {
  let repo: DrizzleLmsEnrollmentsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleLmsEnrollmentsRepository();
  });

  describe('findCourseById', () => {
    it('returns Ok with course when present', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findCourseById(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findCourseById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findCourseById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findExistingEnrollment', () => {
    it('returns Ok with enrollment when present', async () => {
      kit.queueSelect([{ id: 1, userId: 7, courseId: 5 }]);
      const r = await repo.findExistingEnrollment(7, 5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when no enrollment', async () => {
      kit.queueSelect([]);
      const r = await repo.findExistingEnrollment(7, 5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findExistingEnrollment(1, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('enroll', () => {
    it('returns Ok with new enrollment', async () => {
      kit.queueInsert([{ id: 1, userId: 7, courseId: 5 }]);
      const r = await repo.enroll({ userId: 7, courseId: 5 });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.enroll({ userId: 1, courseId: 2 });
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when nothing returned', async () => {
      kit.queueInsert([]);
      const r = await repo.enroll({ userId: 1, courseId: 2 });
      expect(r.ok).toBe(true);
    });
  });

  describe('findAll', () => {
    it('returns Ok with paginated slice', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.findAll(2, 0);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.data).toHaveLength(2);
        expect(r.data.count).toBe(3);
      }
    });

    it('returns Ok with empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with enrollment when present', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated enrollment', async () => {
      kit.queueUpdate([{ id: 1, progress: 50 }]);
      const r = await repo.update(1, { progress: 50 });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
    });
  });

  describe('remove', () => {
    it('returns Ok void when delete succeeds', async () => {
      kit.queueDelete(undefined);
      const r = await repo.remove(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when delete throws', async () => {
      kit.queueDelete(new Error('FK'));
      const r = await repo.remove(2);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when error empty', async () => {
      kit.queueDelete(new Error(''));
      const r = await repo.remove(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });
});
