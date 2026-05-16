/**
 * test/lms/drizzle-knowledge-base.repo.spec.ts
 *
 * Unit tests for KnowledgeBaseRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@shared/db/schema-misc-qc', () => ({
  knowledge_base: {
    id: 'id', title: 'title', content: 'content', category: 'category',
    order: 'order', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
}));

import { KnowledgeBaseRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-knowledge-base.repo';

describe('KnowledgeBaseRepository', () => {
  let repo: KnowledgeBaseRepository;

  beforeEach(() => {
    kit.reset();
    repo = new KnowledgeBaseRepository();
  });

  describe('findAll', () => {
    it('returns Ok with rows when no filters', async () => {
      kit.queueSelect([{ id: '1', title: 'A' }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with search results when search term supplied', async () => {
      kit.queueSelect([{ id: '1', title: 'matched' }]);
      const r = await repo.findAll(undefined, 'match');
      expect(r.ok).toBe(true);
    });

    it('returns Ok with category-filtered results when category supplied', async () => {
      kit.queueSelect([{ id: '1', category: 'safety' }]);
      const r = await repo.findAll('safety');
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with article when present', async () => {
      kit.queueSelect([{ id: 'a-1', title: 'X' }]);
      const r = await repo.findById('a-1');
      expect(r.ok).toBe(true);
      if (r.ok && r.data) expect(r.data.id).toBe('a-1');
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById('missing');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findById('a-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('insert', () => {
    it('returns Ok with inserted row', async () => {
      kit.queueInsert([{ id: 'a-1', title: 'New' }]);
      const r = await repo.insert({ title: 'New', content: 'c', category: 'g' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.insert({ title: 'X', content: 'c', category: 'g' });
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when nothing returned', async () => {
      kit.queueInsert([]);
      const r = await repo.insert({ title: 'X', content: 'c', category: 'g' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeUndefined();
    });
  });

  describe('update', () => {
    it('returns Ok with updated row', async () => {
      kit.queueUpdate([{ id: 'a-1', title: 'Edited' }]);
      const r = await repo.update('a-1', { title: 'Edited' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update('a-1', {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update('missing', {});
      expect(r.ok).toBe(true);
    });
  });

  describe('remove', () => {
    it('returns Ok with id when delete succeeds', async () => {
      kit.queueDelete(undefined);
      const r = await repo.remove('a-1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.id).toBe('a-1');
    });

    it('returns Err when delete throws', async () => {
      kit.queueDelete(new Error('FK'));
      const r = await repo.remove('a-1');
      expect(r.ok).toBe(false);
    });

    it('returns Ok with id even when row already gone', async () => {
      kit.queueDelete([]);
      const r = await repo.remove('a-2');
      expect(r.ok).toBe(true);
    });
  });
});
