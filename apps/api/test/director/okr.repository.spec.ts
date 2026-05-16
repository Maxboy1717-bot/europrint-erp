/**
 * Unit tests for OkrRepository.
 * Covers list/get/create/update on objectives + key results + dashboards.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  okr_objectives: {
    id: 'oo.id', title: 'oo.title', type: 'oo.type', year: 'oo.year',
    quarter: 'oo.quarter', status: 'oo.status', description: 'oo.description',
    created_at: 'oo.created_at',
  },
  okr_key_results: {
    id: 'okr.id', objective_id: 'okr.objective_id', title: 'okr.title',
    target_value: 'okr.target_value', current_value: 'okr.current_value',
    unit: 'okr.unit', owner_id: 'okr.owner_id', status: 'okr.status',
    created_at: 'okr.created_at', updated_at: 'okr.updated_at',
  },
}));

import { OkrRepository } from '../../src/modules/director/application/okr.repository';

describe('OkrRepository', () => {
  let repo: OkrRepository;
  beforeEach(() => {
    repo = new OkrRepository();
    dbStub.__setResolved([]);
  });

  describe('listObjectives', () => {
    it('returns Ok with rows when objectives present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.listObjectives(null, null, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with rows when filtered by year+quarter', async () => {
      dbStub.__setResolved([{ id: 5, year: 2025, quarter: 'Q1' }]);
      const r = await repo.listObjectives(null, 2025, 'Q1', null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listObjectives(null, null, null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('getObjective', () => {
    it('returns Ok with row array when found', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.getObjective(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getObjective(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getObjective(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('createObjective', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7, title: 'Grow' }]);
      const r = await repo.createObjective('Grow', 'company', 2025, 'Q1', null, 1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, title: 'Grow' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createObjective('Grow', 'company', 2025, 'Q1', null, 1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createObjective('X', 'company', 2025, 'Q1', null, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateObjective', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, status: 'completed' }]);
      const r = await repo.updateObjective(1, null, 'completed', null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'completed' });
    });

    it('returns Ok with default message when no rows updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateObjective(99, 'Title', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Yangilandi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateObjective(1, null, 'paused', null);
      expect(r.ok).toBe(false);
    });
  });

  describe('listKeyResults', () => {
    it('returns Ok with rows when KRs present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.listKeyResults(null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(3);
    });

    it('returns Ok with empty array when no KRs', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listKeyResults(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listKeyResults(null);
      expect(r.ok).toBe(false);
    });
  });

  describe('createKeyResult', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7 }]);
      const r = await repo.createKeyResult(1, 'KR1', 100, 0, '%', 2);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createKeyResult(1, 'KR1', 100, 0, '%', 2);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createKeyResult(1, 'KR1', 100, 0, '%', 2);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateKeyResult', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, current_value: '50' }]);
      const r = await repo.updateKeyResult(1, 50, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, current_value: '50' });
    });

    it('returns Ok with default message when no rows updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateKeyResult(99, 100, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Yangilandi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateKeyResult(1, 50, null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('getDashboardObjectives', () => {
    it('returns Ok with status rows when present', async () => {
      dbStub.__setResolved([{ status: 'active', cnt: 5 }]);
      const r = await repo.getDashboardObjectives();
      expect(r.ok).toBe(true);
      if (r.ok) expect(Array.isArray(r.data)).toBe(true);
    });

    it('returns Ok with empty array when no objectives', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getDashboardObjectives();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getDashboardObjectives();
      expect(r.ok).toBe(false);
    });
  });

  describe('getDashboardKeyResults', () => {
    it('returns Ok with aggregates when row present', async () => {
      dbStub.__setResolved([{ avg_progress: 75.5, total: 12 }]);
      const r = await repo.getDashboardKeyResults();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(12);
    });

    it('returns Ok with default zero aggregates when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getDashboardKeyResults();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.avg_progress).toBe(0);
        expect(r.data.total).toBe(0);
      }
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getDashboardKeyResults();
      expect(r.ok).toBe(false);
    });
  });
});
