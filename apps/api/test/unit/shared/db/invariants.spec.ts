/**
 * test/unit/shared/db/invariants.spec.ts
 *
 * Unit tests for ensureDbInvariants and ensureSchemaAdditions. The real
 * implementation iterates over constraint / migration arrays and calls
 * db.execute(sql.raw(...)). We mock the DB so the test runs offline and
 * verifies idempotency / error tolerance.
 */

const executeMock = jest.fn<Promise<unknown>, [unknown]>();

jest.mock('../../../../src/shared/db/schema', () => ({
  db: { execute: (q: unknown) => executeMock(q) },
}));

jest.mock('../../../../src/shared/db/invariants/constraints-data', () => ({
  DB_CONSTRAINTS: [
    { name: 'chk_test_pos', table: 'test_t', check: 'qty >= 0' },
    { name: 'chk_test_two', table: 'test_t', check: 'price > 0' },
  ],
}));

jest.mock('../../../../src/shared/db/invariants/migrations-schema', () => ({
  SCHEMA_MIGRATIONS: [{ name: 'mig_a', sql: 'ALTER TABLE t ADD COLUMN x int' }],
}));

jest.mock('../../../../src/shared/db/invariants/migrations-triggers', () => ({
  TRIGGER_MIGRATIONS: [{ name: 'trig_a', sql: 'CREATE TRIGGER ...' }],
}));

jest.mock('../../../../src/shared/db/invariants/migrations-crm', () => ({
  CRM_MIGRATIONS: [{ name: 'crm_a', sql: 'CREATE TABLE crm_x ...' }],
}));

jest.mock('../../../../src/shared/db/invariants/migrations-drift', () => ({
  DRIFT_MIGRATIONS: [],
}));

import { ensureDbInvariants, ensureSchemaAdditions } from '../../../../src/shared/db/invariants';

describe('ensureDbInvariants', () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it('exposes the function as a callable export when imported', () => {
    expect(typeof ensureDbInvariants).toBe('function');
    expect(typeof ensureSchemaAdditions).toBe('function');
  });

  it('calls db.execute once per constraint when all succeed', async () => {
    executeMock.mockResolvedValue(undefined);
    await ensureDbInvariants();
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it('does not throw when a constraint application fails on a missing table', async () => {
    executeMock.mockRejectedValueOnce(new Error('relation does not exist'));
    executeMock.mockResolvedValueOnce(undefined);
    await expect(ensureDbInvariants()).resolves.toBeUndefined();
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it('continues applying remaining constraints when an earlier one rejects', async () => {
    executeMock
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);
    await ensureDbInvariants();
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it('runs every schema/trigger/CRM migration when ensureSchemaAdditions called', async () => {
    executeMock.mockResolvedValue(undefined);
    await ensureSchemaAdditions();
    // SCHEMA_MIGRATIONS (1) + TRIGGER_MIGRATIONS (1) + CRM_MIGRATIONS (1) = 3
    expect(executeMock).toHaveBeenCalledTimes(3);
  });

  it('handles a rejecting migration gracefully when ensureSchemaAdditions called', async () => {
    executeMock
      .mockRejectedValueOnce(new Error('mig failed'))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    await expect(ensureSchemaAdditions()).resolves.toBeUndefined();
    expect(executeMock).toHaveBeenCalledTimes(3);
  });
});
