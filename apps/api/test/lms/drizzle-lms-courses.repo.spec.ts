/**
 * test/lms/drizzle-lms-courses.repo.spec.ts
 *
 * Unit tests for DrizzleLmsCoursesRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  courses: { id: 'id', deletedAt: 'deletedAt' },
  modules: { id: 'id', courseId: 'courseId' },
  tests: { id: 'id', courseId: 'courseId' },
}));

import { DrizzleLmsCoursesRepository } from '../../src/modules/lms/courses/drizzle-lms-courses.repo';

describe('DrizzleLmsCoursesRepository', () => {
  let repo: DrizzleLmsCoursesRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleLmsCoursesRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1, title: 'Course' }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when no courses', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with course when present', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { id: number }).id).toBe(5);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findModulesByCourseId', () => {
    it('returns Ok with modules', async () => {
      kit.queueSelect([{ id: 1, courseId: 5 }]);
      const r = await repo.findModulesByCourseId(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when no modules', async () => {
      kit.queueSelect([]);
      const r = await repo.findModulesByCourseId(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findModulesByCourseId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findTestsByCourseId', () => {
    it('returns Ok with tests', async () => {
      kit.queueSelect([{ id: 1, courseId: 5 }]);
      const r = await repo.findTestsByCourseId(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok empty when no tests', async () => {
      kit.queueSelect([]);
      const r = await repo.findTestsByCourseId(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findTestsByCourseId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created course', async () => {
      kit.queueInsert([{ id: 1, title: 'New' }]);
      const r = await repo.create({ title: 'New' }, 7);
      expect(r.ok).toBe(true);
    });

    it('applies default status=active', async () => {
      kit.queueInsert([{ id: 2, status: 'active' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated course', async () => {
      kit.queueUpdate([{ id: 1, title: 'Edited' }]);
      const r = await repo.update(1, { title: 'Edited' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('returns Ok void on success', async () => {
      kit.queueUpdate(undefined);
      const r = await repo.softDelete(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('boom'));
      const r = await repo.softDelete(2);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.softDelete(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });
});
