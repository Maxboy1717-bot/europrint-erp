/**
 * test/crm/drizzle-crm-pipelines.repo.spec.ts
 *
 * Unit tests for DrizzleCrmPipelinesRepository. `db` from `@shared/db` is
 * mocked at module level — no real DB. Tests assert Result<T> shape and
 * that the mocked chain was invoked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  crmPipelines: { id: 'id', sort: 'sort' },
  crmStages: { id: 'id', sort: 'sort', categoryId: 'categoryId' },
}));

import { DrizzleCrmPipelinesRepository } from '../../src/modules/crm/pipelines/drizzle-crm-pipelines.repo';

describe('DrizzleCrmPipelinesRepository', () => {
  let repo: DrizzleCrmPipelinesRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleCrmPipelinesRepository();
  });

  describe('findAll', () => {
    it('returns Ok with rows when query succeeds', async () => {
      kit.queueSelect([{ id: 1, name: 'Default' }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([{ id: 1, name: 'Default' }]);
      expect(kit.db.select).toHaveBeenCalled();
    });

    it('returns Ok with empty array when no pipelines exist', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when db throws', async () => {
      kit.queueSelect(new Error('connection lost'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('connection lost');
    });
  });

  describe('findById', () => {
    it('returns Ok with row when pipeline exists', async () => {
      kit.queueSelect([{ id: 7, name: 'Sales' }]);
      const r = await repo.findById(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, name: 'Sales' });
    });

    it('returns Ok with null when pipeline not found', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when db fails', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('boom');
    });
  });

  describe('findStagesByCategoryId', () => {
    it('returns Ok with stages when query succeeds', async () => {
      kit.queueSelect([{ id: 1, name: 'Qualified' }]);
      const r = await repo.findStagesByCategoryId(3);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty stages when none match', async () => {
      kit.queueSelect([]);
      const r = await repo.findStagesByCategoryId(42);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when db throws', async () => {
      kit.queueSelect(new Error('db gone'));
      const r = await repo.findStagesByCategoryId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted row when successful', async () => {
      kit.queueInsert([{ id: 1, name: 'New' }]);
      const r = await repo.create({ name: 'New' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'New' });
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('unique violation'));
      const r = await repo.create({ name: 'dup' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('unique violation');
    });

    it('returns Err with default message when error has no message', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Yaratishda xatolik');
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when successful', async () => {
      kit.queueUpdate([{ id: 1, name: 'Edited' }]);
      const r = await repo.update(1, { name: 'Edited' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'Edited' });
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('locked'));
      const r = await repo.update(1, { name: 'x' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('locked');
    });

    it('returns Ok with undefined data when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('returns Ok void when delete succeeds', async () => {
      kit.queueDelete(undefined);
      const r = await repo.remove(1);
      expect(r.ok).toBe(true);
      expect(kit.db.delete).toHaveBeenCalled();
    });

    it('returns Err when delete throws', async () => {
      kit.queueDelete(new Error('FK violation'));
      const r = await repo.remove(2);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('FK violation');
    });

    it('returns Err with default message when error message missing', async () => {
      kit.queueDelete(new Error(''));
      const r = await repo.remove(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });
});
