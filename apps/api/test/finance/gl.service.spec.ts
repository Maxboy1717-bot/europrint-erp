/**
 * test/finance/gl.service.spec.ts
 *
 * Unit tests for GlService (General Ledger). Mocks IFinanceGlRepository.
 *
 * Also covers FinanceAccountingService.reverseEntry() — the Q2 (SAP-conformance,
 * 2026-07-04) reversal path that replaced the deleted GlService.postDocument()/
 * DrizzleFinanceGlRepository.postDocument() dead code (which used to write a
 * `[REVERSAL]`-tagged gl_documents header that never touched the canonical
 * `entries` ledger). reverseEntry() instead posts a swapped, balanced journal
 * entry through GlPostingService.postJournal() with reference `REV-{id}`.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { GlService } from '../../src/modules/finance/gl/gl.service';
import { Ok, Err, AppErr } from '../../src/common/result';
import { runQuery } from '@shared/db';
import { FinanceAccountingService } from '../../src/modules/finance/application/finance-accounting.service';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import type { DrizzleFinanceAccountingRepo } from '../../src/modules/finance/infrastructure/repositories/drizzle-finance-accounting.repo';

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
  seedAccounts: jest.Mock;
}> = {}) {
  return {
    findAllDocuments: jest.fn().mockResolvedValue(Ok({ data: [], count: 0 })),
    findAllAccounts: jest.fn().mockResolvedValue(Ok([])),
    findAccountById: jest.fn().mockResolvedValue(Ok({ id: 1, accountCode: '1010' })),
    seedAccounts: jest.fn().mockResolvedValue(Ok([])),
    ...overrides,
  };
}

/** Minimal GlPostingService mock — only postJournal is exercised by reverseEntry(). */
function makeGlPosting(overrides: Partial<{ postJournal: jest.Mock }> = {}) {
  return {
    postJournal: jest.fn().mockResolvedValue(Ok(999)),
    ...overrides,
  } as unknown as GlPostingService;
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

  describe('FinanceAccountingService.reverseEntry() — Q2 reversal path', () => {
    beforeEach(() => {
      (runQuery as jest.Mock).mockReset();
    });

    function buildSvc(glPosting: GlPostingService) {
      // reverseEntry() never touches accountingRepo — only runQuery() + glPosting.postJournal() —
      // so an empty stub satisfies the constructor without needing a real DrizzleFinanceAccountingRepo.
      return new FinanceAccountingService({} as DrizzleFinanceAccountingRepo, glPosting);
    }

    it('posts a swapped, balanced journal entry referencing REV-{id}', async () => {
      (runQuery as jest.Mock).mockResolvedValue([
        { id: 42, amount: '1500.00', debit_code: '1010', credit_code: '9010' },
      ]);
      const glPosting = makeGlPosting();
      const svc = buildSvc(glPosting);

      const result = await svc.reverseEntry(42);

      expect(result).toEqual({ entryId: 999, reference: 'REV-42', reversedEntryId: 42, ledger: 'entries' });
      expect(glPosting.postJournal).toHaveBeenCalledWith(
        [
          { accountCode: '9010', accountName: '9010', debit: 1500, credit: 0 },
          { accountCode: '1010', accountName: '1010', debit: 0, credit: 1500 },
        ],
        'REV-42',
      );
    });

    it('throws NotFoundException when the original entry does not exist', async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);
      const glPosting = makeGlPosting();
      const svc = buildSvc(glPosting);

      await expect(svc.reverseEntry(999)).rejects.toThrow('Entries qatori topilmadi: id=999');
      expect(glPosting.postJournal).not.toHaveBeenCalled();
    });

    it('is idempotent: relies on GlPostingService reference-based dedup, does not double-post', async () => {
      (runQuery as jest.Mock).mockResolvedValue([
        { id: 7, amount: '200.00', debit_code: '1010', credit_code: '9010' },
      ]);
      // Simulates GlPostingService.postJournal's own findEntryIdByReference short-circuit:
      // a second reverse of the same id returns the SAME entry id without a fresh insert.
      const postJournal = jest.fn().mockResolvedValue(Ok(555));
      const glPosting = makeGlPosting({ postJournal });
      const svc = buildSvc(glPosting);

      const first = await svc.reverseEntry(7);
      const second = await svc.reverseEntry(7);

      expect(first).toEqual(second);
      expect(postJournal).toHaveBeenCalledTimes(2);
      expect(postJournal).toHaveBeenNthCalledWith(1, expect.anything(), 'REV-7');
      expect(postJournal).toHaveBeenNthCalledWith(2, expect.anything(), 'REV-7');
    });

    it('surfaces a GlPostingService failure (e.g. period lock, unbalanced) as InternalServerErrorException', async () => {
      (runQuery as jest.Mock).mockResolvedValue([
        { id: 5, amount: '80.00', debit_code: '1010', credit_code: '9010' },
      ]);
      const glPosting = makeGlPosting({
        postJournal: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'Davr yopilgan (EP-FIN-064)'))),
      });
      const svc = buildSvc(glPosting);

      await expect(svc.reverseEntry(5)).rejects.toThrow('Davr yopilgan (EP-FIN-064)');
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
