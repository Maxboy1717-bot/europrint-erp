/**
 * test/finance/drizzle-gl-posting.repo.reference-lock.spec.ts
 *
 * C1.9 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): gl-posting.service.ts#createJournalEntry's
 * idempotency check (findEntryIdByReference) ran BEFORE opening any transaction — two truly-
 * concurrent posts of the SAME business reference could both see "not yet posted" and both
 * insert distinct entry_number values (entry_number embeds Date.now(), so no UNIQUE constraint
 * catches this), silently double-posting the ledger.
 *
 * Fix: insertJournal() now accepts an optional `reference`. When supplied, the insert
 * transaction opens with a Postgres advisory transaction-lock keyed on the reference (auto-
 * released on commit/rollback, no schema/migration needed), then re-checks for an existing
 * entry_number under THIS same transaction before inserting — the second of two concurrent
 * callers blocks on the lock until the first commits, then sees the first's row and returns its
 * id instead of inserting a duplicate.
 */

type Row = Record<string, unknown>;

const mockTxExecute = jest.fn();
const mockTxInsertReturning = jest.fn();
const mockDb = {
  select: jest.fn(() => mockDb),
  from: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
    cb({
      execute: mockTxExecute,
      insert: () => ({ values: () => ({ returning: mockTxInsertReturning }) }),
    }),
  ),
};
let resolvedAccounts: Row[] = [];
Object.defineProperty(mockDb, 'then', {
  get: () => (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(resolvedAccounts)),
  configurable: true,
});

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

jest.mock('@shared/db', () => ({ db: mockDb, runQuery: jest.fn() }));
jest.mock('@workspace/db', () => ({
  accounts: { accountCode: 'accounts.account_code', id: 'accounts.id', isActive: 'accounts.is_active', deletedAt: 'accounts.deleted_at' },
  entries: {},
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

const oneRow = [
  { entryNumber: 'SI-9-1720000000000-0', entryDate: '2026-07-07', documentType: 'journal', debitAccountId: '1010', creditAccountId: '4010', amount: 100 },
];

describe('DrizzleGlPostingRepository.insertJournal — C1.9 reference-scoped advisory lock', () => {
  let repo: DrizzleGlPostingRepository;

  beforeEach(() => {
    resolvedAccounts = [
      { account_code: '1010', id: 1 },
      { account_code: '4010', id: 2 },
    ];
    mockDb.transaction.mockClear();
    mockTxExecute.mockReset();
    mockTxInsertReturning.mockReset();
    repo = new DrizzleGlPostingRepository();
  });

  it('without a reference: skips the lock/recheck entirely and inserts unconditionally (unchanged legacy behavior)', async () => {
    mockTxInsertReturning.mockResolvedValue([{ id: 501 }]);

    const result = await repo.insertJournal(oneRow);

    expect(result).toEqual({ ok: true, data: 501 });
    expect(mockTxExecute).not.toHaveBeenCalled();
    expect(mockTxInsertReturning).toHaveBeenCalledTimes(1);
  });

  it('with a reference and no existing entry: acquires the advisory lock, re-checks, finds nothing, and inserts', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] }) // call 1: pg_advisory_xact_lock (return value unused)
      .mockResolvedValueOnce({ rows: [] }); // call 2: existence re-check — nothing found
    mockTxInsertReturning.mockResolvedValue([{ id: 900 }]);

    const result = await repo.insertJournal(oneRow, 'SI-9');

    expect(result).toEqual({ ok: true, data: 900 });
    expect(mockTxExecute).toHaveBeenCalledTimes(2); // 1: pg_advisory_xact_lock, 2: existence re-check
    const lockCallText = sqlText(mockTxExecute.mock.calls[0][0]);
    expect(lockCallText).toContain('pg_advisory_xact_lock');
    const checkCallText = sqlText(mockTxExecute.mock.calls[1][0]);
    expect(checkCallText).toContain('entry_number LIKE');
    expect(checkCallText).toContain('SI-9-%');
    expect(mockTxInsertReturning).toHaveBeenCalledTimes(1);
  });

  it('with a reference and an existing entry found under the lock (simulating a just-committed concurrent post): returns the existing id and does NOT insert a duplicate', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] }) // call 1: pg_advisory_xact_lock (return value unused)
      .mockResolvedValueOnce({ rows: [{ id: 777 }] }); // call 2: existence re-check finds the concurrent winner's row

    const result = await repo.insertJournal(oneRow, 'SI-9');

    expect(result).toEqual({ ok: true, data: 777 });
    expect(mockTxInsertReturning).not.toHaveBeenCalled();
  });
});
