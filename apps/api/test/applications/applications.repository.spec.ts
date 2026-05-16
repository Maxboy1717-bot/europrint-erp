/**
 * Unit tests for ApplicationsRepository.
 * The repository uses runQuery (raw SQL exec) and a helper for hard delete.
 */

const runQueryMock = jest.fn().mockResolvedValue({ rows: [] });
const execDeleteMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@shared/db', () => ({
  db: {},
  runQuery: runQueryMock,
  rawSql: jest.fn(),
}));

jest.mock('@common/database/queries-remaining', () => ({
  execHrApplicationDelete: execDeleteMock,
}));

import { ApplicationsRepository } from '../../src/modules/applications/applications.repository';

describe('ApplicationsRepository', () => {
  let repo: ApplicationsRepository;
  beforeEach(() => {
    repo = new ApplicationsRepository();
    runQueryMock.mockReset().mockResolvedValue({ rows: [] });
    execDeleteMock.mockReset().mockResolvedValue(undefined);
  });

  describe('list', () => {
    it('returns Ok with rows when no filters supplied', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      const r = await repo.list(null, null, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with filtered rows when status and positionId supplied', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 3 }] });
      const r = await repo.list('pending', 5, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('db error'));
      const r = await repo.list(null, null, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('getById', () => {
    it('returns Ok with row when application exists', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] });
      const r = await repo.getById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'pending' });
    });

    it('returns Ok with null when not found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getById(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when runQuery throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 10, status: 'pending' }] });
      const r = await repo.create({ first_name: 'A', last_name: 'B' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 10, status: 'pending' });
    });

    it('returns Ok with null when no rows returned', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.create({ first_name: 'X' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('insert failed'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when match', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1, status: 'approved' }] });
      const r = await repo.update(1, { status: 'approved' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'approved' });
    });

    it('returns Ok with null when no row updated', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.update(999, { status: 'rejected' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('conflict'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });
  });

  describe('delete', () => {
    it('returns Ok when delete helper succeeds', async () => {
      execDeleteMock.mockResolvedValueOnce(undefined);
      const r = await repo.delete(1);
      expect(r.ok).toBe(true);
      expect(execDeleteMock).toHaveBeenCalledWith(1);
    });

    it('returns Ok when target row absent (helper resolves)', async () => {
      execDeleteMock.mockResolvedValueOnce(undefined);
      const r = await repo.delete(9999);
      expect(r.ok).toBe(true);
    });

    it('returns Err when delete helper rejects', async () => {
      execDeleteMock.mockRejectedValueOnce(new Error('FK constraint'));
      const r = await repo.delete(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('listResponses', () => {
    it('returns Ok with rows when applicationId supplied', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.listResponses(5, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with rows when no applicationId filter', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });
      const r = await repo.listResponses(null, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Err when DB throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.listResponses(null, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('getResponseById', () => {
    it('returns Ok with row when found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const r = await repo.getResponseById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with null when not found', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.getResponseById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('boom'));
      const r = await repo.getResponseById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('createResponse', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [{ id: 7, stage: 'screening' }] });
      const r = await repo.createResponse({ application_id: 1 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, stage: 'screening' });
    });

    it('returns Ok with null when no row returned', async () => {
      runQueryMock.mockResolvedValueOnce({ rows: [] });
      const r = await repo.createResponse({});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      runQueryMock.mockRejectedValueOnce(new Error('insert err'));
      const r = await repo.createResponse({});
      expect(r.ok).toBe(false);
    });
  });
});
