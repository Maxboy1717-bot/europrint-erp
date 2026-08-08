/**
 * test/finance/gl-posting-cost-center.spec.ts
 *
 * VISION-3340 #21: cost_centers is full CRUD master data, but no GL posting could be tagged to a
 * cost center — the canonical posting table `entries` (written by DrizzleGlPostingRepository.
 * insertJournal, the ONE engine behind GlPostingService.postJournal) had no cost_center_id.
 *
 * These tests prove the OPTIONAL costCenterId tag threads end-to-end:
 *   1. Service level — a JournalLine.costCenterId flows through createJournalEntry into the rows
 *      handed to insertJournal; omitting it leaves the row's tag undefined (backward-compat).
 *   2. Repo level — insertJournal's INSERT values carry cost_center_id (the concrete number when
 *      set, NULL when omitted). Uses the same transaction-mock style as
 *      drizzle-gl-posting.repo.reference-lock.spec.ts.
 *
 * No debit/credit/balance logic is touched — costCenterId is a pure pass-through attribute.
 */

// ── Repo-level mock harness (mirrors reference-lock.spec.ts) ─────────────────────────────────
type Row = Record<string, unknown>;

const mockTxExecute = jest.fn();
const mockTxInsertReturning = jest.fn();
const capturedInsertValues: Row[] = [];
const mockDb = {
  select: jest.fn(() => mockDb),
  from: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
    cb({
      execute: mockTxExecute,
      insert: () => ({
        values: (v: Row) => {
          capturedInsertValues.push(v);
          return { returning: mockTxInsertReturning };
        },
      }),
    }),
  ),
};
let resolvedAccounts: Row[] = [];
Object.defineProperty(mockDb, 'then', {
  get: () => (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(resolvedAccounts)),
  configurable: true,
});

jest.mock('@shared/db', () => ({ db: mockDb, runQuery: jest.fn() }));
jest.mock('@workspace/db', () => ({
  accounts: { accountCode: 'accounts.account_code', id: 'accounts.id', isActive: 'accounts.is_active', deletedAt: 'accounts.deleted_at' },
  entries: { id: 'entries.id' },
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  inArray: (col: unknown, vals: unknown) => ({ __op: 'inArray', col, vals }),
  and: (...conds: unknown[]) => ({ __op: 'and', conds }),
  eq: (col: unknown, val: unknown) => ({ __op: 'eq', col, val }),
  isNull: (col: unknown) => ({ __op: 'isNull', col }),
}));

import { DrizzleGlPostingRepository } from '../../src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo';
import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { Ok } from '../../src/common/result';
import type { IGlPostingRepository } from '../../src/modules/finance/domain/repositories/i-gl-posting.repo';

// ── 1. SERVICE LEVEL — threading from JournalLine into the insertJournal rows ────────────────
function makeMockGlRepo(): jest.Mocked<IGlPostingRepository> {
  return {
    insertEntry: jest.fn().mockResolvedValue(Ok(1)),
    insertJournal: jest.fn().mockResolvedValue(Ok(1)),
    findEntryIdByReference: jest.fn().mockResolvedValue(Ok(null)),
    findClosedPeriodForDate: jest.fn().mockResolvedValue(Ok(null)),
    financeInvoiceExists: jest.fn().mockResolvedValue(Ok(true)),
    salesOrderExists: jest.fn().mockResolvedValue(Ok(true)),
  };
}

describe('GlPostingService — VISION-3340 #21 costCenterId threading', () => {
  let mockGlRepo: jest.Mocked<IGlPostingRepository>;
  let svc: GlPostingService;

  beforeEach(() => {
    mockGlRepo = makeMockGlRepo();
    svc = new GlPostingService(mockGlRepo);
  });

  it('threads a JournalLine.costCenterId into the balanced row handed to insertJournal', async () => {
    const r = await svc.postJournal(
      [
        { accountCode: '1000', accountName: 'A', debit: 500, credit: 0, costCenterId: 7 },
        { accountCode: '2000', accountName: 'B', debit: 0, credit: 500 },
      ],
      'CC-1',
    );
    expect(r.ok).toBe(true);
    expect(mockGlRepo.insertJournal).toHaveBeenCalledTimes(1);
    const rows = mockGlRepo.insertJournal.mock.calls[0][0] as Array<{ costCenterId?: number }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].costCenterId).toBe(7);
  });

  it('leaves the row tag undefined when no line carries a costCenterId (backward-compat)', async () => {
    const r = await svc.postJournal(
      [
        { accountCode: '1000', accountName: 'A', debit: 500, credit: 0 },
        { accountCode: '2000', accountName: 'B', debit: 0, credit: 500 },
      ],
      'CC-2',
    );
    expect(r.ok).toBe(true);
    const rows = mockGlRepo.insertJournal.mock.calls[0][0] as Array<{ costCenterId?: number }>;
    expect(rows[0].costCenterId).toBeUndefined();
  });
});

// ── 2. REPO LEVEL — the INSERT values actually carry cost_center_id ──────────────────────────
describe('DrizzleGlPostingRepository.insertJournal — VISION-3340 #21 cost_center_id in INSERT', () => {
  let repo: DrizzleGlPostingRepository;

  beforeEach(() => {
    resolvedAccounts = [
      { account_code: '1000', id: 1 },
      { account_code: '2000', id: 2 },
    ];
    capturedInsertValues.length = 0;
    mockDb.transaction.mockClear();
    mockTxExecute.mockReset();
    mockTxInsertReturning.mockReset();
    mockTxInsertReturning.mockResolvedValue([{ id: 42 }]);
    repo = new DrizzleGlPostingRepository();
  });

  it('persists costCenterId as entries.cost_center_id when the row carries one', async () => {
    const result = await repo.insertJournal([
      { entryNumber: 'E1', entryDate: '2026-07-08', documentType: 'journal', debitAccountId: '1000', creditAccountId: '2000', amount: 100, costCenterId: 7 },
    ]);

    expect(result).toEqual({ ok: true, data: 42 });
    expect(capturedInsertValues).toHaveLength(1);
    expect(capturedInsertValues[0].costCenterId).toBe(7);
  });

  it('inserts cost_center_id as NULL when the row omits it (backward-compat)', async () => {
    const result = await repo.insertJournal([
      { entryNumber: 'E2', entryDate: '2026-07-08', documentType: 'journal', debitAccountId: '1000', creditAccountId: '2000', amount: 100 },
    ]);

    expect(result).toEqual({ ok: true, data: 42 });
    expect(capturedInsertValues).toHaveLength(1);
    expect(capturedInsertValues[0].costCenterId).toBeNull();
  });
});
