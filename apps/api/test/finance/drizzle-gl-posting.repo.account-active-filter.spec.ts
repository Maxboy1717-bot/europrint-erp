/**
 * test/finance/drizzle-gl-posting.repo.account-active-filter.spec.ts
 *
 * C6.7 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): resolveAccountIds() resolved GL account CODE→id
 * with no is_active/deleted_at filter — a journal could post to a deactivated/soft-deleted
 * account. The fix adds `AND is_active = true AND deleted_at IS NULL` to the existing
 * inArray(...) WHERE clause; a code belonging to an inactive/deleted account now simply doesn't
 * resolve, which the caller's pre-existing "any code missing from the map -> Err, reject the
 * whole journal" contract already handles correctly with zero further changes needed.
 */

const mockDb = {
  select: jest.fn(() => mockDb),
  from: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  transaction: jest.fn(),
};
let resolved: unknown[] = [];
Object.defineProperty(mockDb, 'then', {
  get: () => (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(resolved)),
  configurable: true,
});

jest.mock('@shared/db', () => ({ db: mockDb, runQuery: jest.fn() }));
jest.mock('@workspace/db', () => ({
  accounts: { accountCode: 'accounts.account_code', id: 'accounts.id', isActive: 'accounts.is_active', deletedAt: 'accounts.deleted_at' },
  entries: {},
}));
jest.mock('drizzle-orm', () => ({
  sql: jest.fn(),
  inArray: (col: unknown, vals: unknown) => ({ __op: 'inArray', col, vals }),
  and: (...conds: unknown[]) => ({ __op: 'and', conds }),
  eq: (col: unknown, val: unknown) => ({ __op: 'eq', col, val }),
  isNull: (col: unknown) => ({ __op: 'isNull', col }),
}));

import { DrizzleGlPostingRepository } from '../../src/modules/finance/infrastructure/repositories/drizzle-gl-posting.repo';

describe('DrizzleGlPostingRepository — C6.7 account is_active/deleted_at filter', () => {
  let repo: DrizzleGlPostingRepository;

  beforeEach(() => {
    resolved = [];
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.where.mockClear();
    repo = new DrizzleGlPostingRepository();
  });

  it('includes is_active=true and deleted_at IS NULL in the account-resolution WHERE clause', async () => {
    resolved = [{ account_code: '5010', id: 42 }];

    await repo.insertJournal([
      { entryNumber: 'E1', entryDate: '2026-07-06', documentType: 'test', debitAccountId: '5010', creditAccountId: '5010', amount: 100 },
    ]).catch(() => undefined); // transaction path isn't under test here; only care about the WHERE clause built

    expect(mockDb.where).toHaveBeenCalledTimes(1);
    const whereArg = mockDb.where.mock.calls[0][0] as { __op: string; conds: { __op: string }[] };
    expect(whereArg.__op).toBe('and');
    const ops = whereArg.conds.map((c) => c.__op);
    expect(ops).toContain('inArray');
    expect(ops).toContain('eq');
    expect(ops).toContain('isNull');
    const eqCond = whereArg.conds.find((c) => c.__op === 'eq') as { col: unknown; val: unknown };
    expect(eqCond.col).toBe('accounts.is_active');
    expect(eqCond.val).toBe(true);
    const isNullCond = whereArg.conds.find((c) => c.__op === 'isNull') as { col: unknown };
    expect(isNullCond.col).toBe('accounts.deleted_at');
  });

  it('treats a code excluded by the filter (e.g. deactivated account) as missing and rejects the journal', async () => {
    // Simulates a deactivated account: the WHERE clause (is_active=true) means resolveAccountIds
    // returns an EMPTY map for that code even though the code exists in the table.
    resolved = [];

    const result = await repo.insertJournal([
      { entryNumber: 'E2', entryDate: '2026-07-06', documentType: 'test', debitAccountId: '9999', creditAccountId: '9999', amount: 100 },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/not in chart of accounts/);
  });
});
