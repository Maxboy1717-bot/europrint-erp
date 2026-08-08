/**
 * test/sd/queries-sd-soft-delete-audit.spec.ts
 *
 * VISION-3340 #63 (2026-07-08): execSdCustomerSoftDelete() only ever set
 * status = 'deleted', leaving sd_customers.deleted_at/deleted_by NULL forever
 * even though both columns exist live (A89 boot migration,
 * apps/api/src/shared/db/invariants/migrations-drift.ts:3908-3909). Proves the
 * function now sets deleted_at = NOW() and deleted_by = <acting user> in the
 * SAME UPDATE as the status flip.
 *
 * Strategy: mock @shared/db (db.execute) so no real DB call is made, mirroring
 * test/pos/pos-wms-sync.service.created-by.spec.ts (same "value threaded into
 * a raw SQL query" shape). drizzle-orm's `sql` tag stays real — it only builds
 * a query object, no I/O.
 */

const mockExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: mockExecute },
}));

import { execSdCustomerSoftDelete } from '../../src/common/database/queries-sd';

// The drizzle `sql` tagged template's queryChunks alternate between
// {value: [text]} StringChunks and raw interpolated parameter values.
function queryText(query: { queryChunks: unknown[] }): string {
  return (query.queryChunks as Array<{ value?: string[] } | unknown>)
    .map((c) => (c as { value?: string[] })?.value?.join('') ?? '')
    .join('');
}
function rawValues(query: { queryChunks: unknown[] }): unknown[] {
  return (query.queryChunks as unknown[]).filter((c) => typeof c !== 'object' || c === null);
}

describe('execSdCustomerSoftDelete deleted_at/deleted_by audit (VISION-3340 #63)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: [] });
  });

  it('sets status, deleted_at and deleted_by in the same UPDATE', async () => {
    await execSdCustomerSoftDelete(42, 9);

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const query = mockExecute.mock.calls[0][0] as { queryChunks: unknown[] };
    const text = queryText(query);

    expect(text).toContain('UPDATE sd_customers');
    expect(text).toContain("status = 'deleted'");
    expect(text).toContain('deleted_at = NOW()');
    expect(text).toContain('deleted_by =');

    const values = rawValues(query);
    expect(values).toContain(9);  // deletedBy
    expect(values).toContain(42); // cid
  });

  it('writes NULL for deleted_by when no acting user is provided', async () => {
    await execSdCustomerSoftDelete(99);

    const query = mockExecute.mock.calls[0][0] as { queryChunks: unknown[] };
    const values = rawValues(query);
    expect(values).toContain(null);
    expect(values).toContain(99);
  });
});
