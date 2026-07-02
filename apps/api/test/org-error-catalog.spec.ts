/**
 * org-error-catalog.spec.ts — Rule 22 unit test for ErrorCatalogService.
 *
 * Covers the NOT_FOUND translation logic that ErrorCatalogService layers on top
 * of ErrorCatalogRepository (T10-08, EP-ORG-097): findById/update/softDelete all
 * turn a repo `Ok(null)` (row missing or already soft-deleted) into a proper
 * `Err(AppErr('NOT_FOUND', ...))`, and all three propagate repo-level errors
 * untouched. `list`/`create` are thin pass-throughs and are covered by a single
 * delegation check.
 */
import { ErrorCatalogService } from '../src/modules/org-structure/error-catalog.service';
import { Ok, Err, AppErr } from '../src/common/result';

type Row = Record<string, unknown>;

interface FakeRepo {
  list: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  softDelete: jest.Mock;
}

function makeRepo(overrides: Partial<FakeRepo> = {}): FakeRepo {
  return {
    list: jest.fn().mockResolvedValue(Ok([])),
    findById: jest.fn().mockResolvedValue(Ok(null)),
    create: jest.fn().mockResolvedValue(Ok(null)),
    update: jest.fn().mockResolvedValue(Ok(null)),
    softDelete: jest.fn().mockResolvedValue(Ok(null)),
    ...overrides,
  };
}

function svc(repo: FakeRepo): ErrorCatalogService {
  // Test double: cast via `as never` keeps tsc happy without `as unknown` stubs.
  // ErrorCatalogService only touches the repo methods mocked here.
  return new ErrorCatalogService(repo as never);
}

describe('ErrorCatalogService', () => {
  describe('findById', () => {
    it('returns NOT_FOUND when repo finds no row', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).findById(999);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/999/);
      }
    });

    it('returns the row unwrapped when repo finds one', async () => {
      const row: Row = { id: 5, code: 'MAT-01', name: 'Material xato' };
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).findById(5);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });

    it('propagates a repo-level error untouched', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('INTERNAL', 'db down'))),
      });
      const result = await svc(repo).findById(1);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('INTERNAL');
    });
  });

  describe('update', () => {
    it('returns NOT_FOUND when the target row does not exist', async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).update(42, { name: 'Yangi nom' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/42/);
      }
    });

    it('returns the updated row when repo succeeds', async () => {
      const row: Row = { id: 7, name: 'Yangi nom' };
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).update(7, { name: 'Yangi nom' });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });

    it('propagates a repo-level error (e.g. duplicate active code) untouched', async () => {
      const repo = makeRepo({
        update: jest.fn().mockResolvedValue(Err(AppErr('CONFLICT', "'MAT-01' kodli faol xato-katalog allaqachon mavjud"))),
      });
      const result = await svc(repo).update(7, { code: 'MAT-01' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CONFLICT');
    });
  });

  describe('softDelete', () => {
    it('returns NOT_FOUND (with "already archived" hint) when the row is missing/archived', async () => {
      const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(null)) });
      const result = await svc(repo).softDelete(13);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toMatch(/13/);
        expect(result.error.message).toMatch(/arxivlangan/);
      }
    });

    it('returns the archived row when repo succeeds', async () => {
      const row: Row = { id: 13, is_active: false, deleted_at: new Date().toISOString() };
      const repo = makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(row)) });
      const result = await svc(repo).softDelete(13);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });
  });

  describe('list / create (thin delegation)', () => {
    it('list() forwards cardId/includeArchived to the repo unchanged', async () => {
      const repo = makeRepo();
      await svc(repo).list(3, true);
      expect(repo.list).toHaveBeenCalledWith(3, true);
    });

    it('create() forwards dto/createdBy to the repo and returns its Result verbatim', async () => {
      const row: Row = { id: 1, name: 'Nam kirish' };
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(Ok(row)) });
      const dto = { name: 'Nam kirish', cardId: null };
      const result = await svc(repo).create(dto, 9);
      expect(repo.create).toHaveBeenCalledWith(dto, 9);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual(row);
    });
  });
});
