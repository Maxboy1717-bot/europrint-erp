/**
 * test/mm/drizzle-materials-svc.repo.spec.ts
 *
 * Unit tests for DrizzleMaterialsSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  materials: { id: 'id', deletedAt: 'deletedAt' },
}));

import { DrizzleMaterialsSvcRepository } from '../../src/modules/mm/materials/drizzle-materials-svc.repo';

describe('DrizzleMaterialsSvcRepository', () => {
  let repo: DrizzleMaterialsSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleMaterialsSvcRepository();
  });

  describe('findAll', () => {
    it('returns Ok with rows when query succeeds', async () => {
      kit.queueSelect([{ id: 1, name: 'Paper' }, { id: 2, name: 'Ink' }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no materials', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when db rejects', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('boom');
    });

    it('returns Err with default message when error message empty', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Materiallar topilmadi');
    });
  });
});
