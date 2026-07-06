/**
 * test/finance/finance-accounting.service.gl-approval-gate.spec.ts
 *
 * F9 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): manual journal entries (POST /finance/gl-entries)
 * now go through a real draft -> review -> post gate instead of posting straight to `entries`.
 * createGlDocument() writes a `pending_review` row to `gl_documents` (reused, 0 live rows, no new
 * table); approveGlDocument()/rejectGlDocument() complete the gate. `runQuery` is mocked — no real
 * DB. GlPostingService is mocked to isolate the gate logic from the engine itself (already covered
 * by gl-posting.service.spec.ts).
 */

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({
  db: {},
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

import { FinanceAccountingService } from '../../src/modules/finance/application/finance-accounting.service';
import { Ok, Err } from '../../src/common/result';
import type { I18nService } from 'nestjs-i18n';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import type { DrizzleFinanceAccountingRepo } from '../../src/modules/finance/infrastructure/repositories/drizzle-finance-accounting.repo';

function makeGlMock(): jest.Mocked<Pick<GlPostingService, 'postJournal'>> {
  return { postJournal: jest.fn() };
}

function makeI18nMock(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

const balancedLines = [
  { accountCode: '1010', accountName: 'Kassa', debit: 1000, credit: 0 },
  { accountCode: '6000', accountName: 'Kreditorlar', debit: 0, credit: 1000 },
];

describe('FinanceAccountingService — F9 GL draft/review/post gate', () => {
  let glMock: jest.Mocked<Pick<GlPostingService, 'postJournal'>>;
  let svc: FinanceAccountingService;

  beforeEach(() => {
    mockRunQuery.mockReset();
    glMock = makeGlMock();
    svc = new FinanceAccountingService({} as unknown as DrizzleFinanceAccountingRepo, glMock as unknown as GlPostingService, makeI18nMock());
  });

  describe('createGlDocument() — draft only, never posts directly', () => {
    it('inserts a pending_review draft and does NOT call the GL engine', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 42, created_at: '2026-07-06' }] });

      const result = await svc.createGlDocument({ documentNumber: 'GLDOC-1', lines: balancedLines }, 7);

      expect(glMock.postJournal).not.toHaveBeenCalled();
      expect(result).toMatchObject({ draftId: 42, status: 'pending_review', ledger: null });
      const insertSql = mockRunQuery.mock.calls[0][0];
      const sqlText = (insertSql.queryChunks ?? [])
        .map((c: unknown) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : ''))
        .join('');
      expect(sqlText).toMatch(/INSERT INTO gl_documents/);
      expect(sqlText).toMatch(/pending_review/);
    });

    it('still rejects an unbalanced document before ever touching the DB', async () => {
      await expect(
        svc.createGlDocument({ lines: [{ accountCode: '1010', debit: 1000, credit: 0 }] }, 7),
      ).rejects.toThrow(/glDocumentUnbalanced/i);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });
  });

  describe('approveGlDocument() — posts through the ONE engine, idempotent status guard', () => {
    it('posts the stored lines and flips status to posted', async () => {
      mockRunQuery
        .mockResolvedValueOnce({ rows: [{ id: 42, document_number: 'GLDOC-1', status: 'pending_review', metadata: { lines: balancedLines } }] })
        .mockResolvedValueOnce({ rows: [{ id: 42 }] }); // UPDATE ... SET status='posted'
      glMock.postJournal.mockResolvedValue(Ok(999));

      const result = await svc.approveGlDocument(42, 3);

      expect(glMock.postJournal).toHaveBeenCalledWith(balancedLines, 'GLDOC-1');
      expect(result).toEqual({ draftId: 42, entryId: 999, status: 'posted' });
    });

    it('rejects approving a draft that is already posted (no double-post)', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 42, document_number: 'GLDOC-1', status: 'posted', metadata: { lines: balancedLines } }] });

      await expect(svc.approveGlDocument(42, 3)).rejects.toThrow(/glDocumentAlreadyReviewedWithStatus/i);
      expect(glMock.postJournal).not.toHaveBeenCalled();
    });

    it('surfaces an engine rejection (e.g. period lock) without flipping status to posted', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 42, document_number: 'GLDOC-1', status: 'pending_review', metadata: { lines: balancedLines } }] });
      glMock.postJournal.mockResolvedValue(Err('Davr yopilgan'));

      await expect(svc.approveGlDocument(42, 3)).rejects.toThrow(/Davr yopilgan/);
      // Only the SELECT ran — no UPDATE to 'posted' after a failed post.
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException for a nonexistent draft', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [] });
      await expect(svc.approveGlDocument(999, 3)).rejects.toThrow(/glDraftNotFoundWithId/i);
    });
  });

  describe('rejectGlDocument() — status flip only, never touches the GL engine', () => {
    it('rejects a pending_review draft', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] });
      const result = await svc.rejectGlDocument(42, 3);
      expect(result).toEqual({ draftId: 42, status: 'rejected' });
    });

    it('errors when rejecting a draft that is not pending_review (already posted/rejected)', async () => {
      mockRunQuery.mockResolvedValueOnce({ rows: [] }); // WHERE status='pending_review' matched 0 rows
      await expect(svc.rejectGlDocument(42, 3)).rejects.toThrow();
    });
  });
});
