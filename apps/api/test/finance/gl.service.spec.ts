/**
 * test/finance/gl.service.spec.ts
 *
 * Unit tests for GlService (General Ledger). Mocks IFinanceGlRepository.
 */

import { GlService } from '../../src/modules/finance/gl/gl.service';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

function makeRepo(overrides: Partial<{
  findAllDocuments: jest.Mock;
  findAllAccounts: jest.Mock;
  findAccountById: jest.Mock;
  postDocument: jest.Mock;
  seedAccounts: jest.Mock;
}> = {}) {
  return {
    findAllDocuments: jest.fn().mockResolvedValue(Ok({ data: [], count: 0 })),
    findAllAccounts: jest.fn().mockResolvedValue(Ok([])),
    findAccountById: jest.fn().mockResolvedValue(Ok({ id: 1, accountCode: '1010' })),
    postDocument: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    seedAccounts: jest.fn().mockResolvedValue(Ok([])),
    ...overrides,
  };
}

describe('GlService', () => {
  describe('findAllDocuments()', () => {
    it('returns paginated result with defaults when query empty', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.findAllDocuments({});

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { pagination: { page: number; limit: number; total: number }; data: unknown[] };
        expect(d.pagination.page).toBe(1);
        expect(d.pagination.limit).toBe(10);
      }
      // page 1 → offset 0
      expect(repo.findAllDocuments).toHaveBeenCalledWith(10, 0);
    });

    it('computes correct offset for page=3, limit=25', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      await svc.findAllDocuments({ page: 3, limit: 25 });

      expect(repo.findAllDocuments).toHaveBeenCalledWith(25, 50);
    });

    it('returns empty list with total=0 when repo fails (graceful fallback)', async () => {
      const repo = makeRepo({
        findAllDocuments: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'gone'))),
      });
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.findAllDocuments();

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { data: unknown[]; pagination: { total: number } };
        expect(d.data).toEqual([]);
        expect(d.pagination.total).toBe(0);
      }
    });
  });

  describe('findAccountById()', () => {
    it('returns Ok when account found', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.findAccountById(1);

      expect(r.ok).toBe(true);
    });

    it('returns Err NOT_FOUND when repo returns null data', async () => {
      const repo = makeRepo({
        findAccountById: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.findAccountById(999);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('returns Err NOT_FOUND when repo fails', async () => {
      const repo = makeRepo({
        findAccountById: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.findAccountById(1);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });
  });

  describe('postDocument()', () => {
    it('rejects unbalanced debit/credit with BadRequest → BAD_REQUEST', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.postDocument({ totalDebit: 100, totalCredit: 50 });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
      expect(repo.postDocument).not.toHaveBeenCalled();
    });

    it('accepts balanced entries', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.postDocument({ totalDebit: 100, totalCredit: 100 });

      expect(r.ok).toBe(true);
      expect(repo.postDocument).toHaveBeenCalled();
    });

    it('balanced with zero amounts is allowed', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.postDocument({ totalDebit: 0, totalCredit: 0 });

      expect(r.ok).toBe(true);
    });

    it('returns Err when repo write fails', async () => {
      const repo = makeRepo({
        postDocument: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'fk violation'))),
      });
      const svc = new GlService(repo as never, makeI18n());

      const r = await svc.postDocument({ totalDebit: 50, totalCredit: 50 });

      expect(r.ok).toBe(false);
    });
  });

  describe('seedAccounts()', () => {
    it('uses default chart when rows is empty', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      await svc.seedAccounts([]);

      const arg = (repo.seedAccounts.mock.calls[0]?.[0] ?? []) as Array<{ accountCode: string }>;
      expect(arg.length).toBeGreaterThanOrEqual(10);
      const codes = arg.map((a) => a.accountCode);
      expect(codes.length).toBeGreaterThan(0);
    });

    it('uses caller-supplied rows verbatim', async () => {
      const repo = makeRepo();
      const svc = new GlService(repo as never, makeI18n());

      await svc.seedAccounts([{ accountCode: '9999', accountName: 'X', accountType: 'asset' }]);

      const arg = (repo.seedAccounts.mock.calls[0]?.[0] ?? []) as unknown[];
      expect(arg).toHaveLength(1);
    });
  });
});
