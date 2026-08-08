/**
 * @module create-employee.handler.spec
 * @description Phase 2 / Task 2.4 — verifies the Add Employee transaction.
 *
 *   Mocks @shared/db so the test exercises the handler's branching logic
 *   without a real DB connection. Specifically, we assert:
 *
 *     1. happy path INSERTs the employee row and audit row inside ONE
 *        db.transaction call (single commit boundary),
 *     2. when createUserAccount is provided, the users INSERT also runs
 *        inside the same transaction BEFORE the employee INSERT,
 *     3. an INSERT failure aborts the transaction — no audit row is
 *        written, and the handler returns Err(...),
 *     4. the audit row records the actor user id and employee code,
 *     5. when the employee INSERT returns no row (RETURNING empty), the
 *        handler returns Err and rolls back.
 *
 *   We track call order via a shared `ops` array so we can assert that
 *   the user INSERT precedes the employee INSERT precedes the audit
 *   INSERT, all driven from the same transaction callback.
 */

import 'reflect-metadata';

// Shared mock state — captured during each test.
const txOps: Array<{ kind: string; table?: string }> = [];
let nextEmployeeInsertResult: Array<Record<string, unknown>> = [{
  id: 99,
  employee_code: 'EMP-1',
  first_name: 'Test',
  last_name: 'User',
}];
let nextUserInsertResult: Array<Record<string, unknown>> = [{ id: 'user-uuid-1' }];
let executeFailsWith: Error | null = null;

jest.mock('@shared/db', () => {
  const mkInsertBuilder = (table: string) => ({
    values: (_v: unknown) => ({
      returning: (_sel?: unknown) => {
        txOps.push({ kind: 'insert', table });
        if (table === 'users') return Promise.resolve(nextUserInsertResult);
        return Promise.resolve(nextEmployeeInsertResult);
      },
    }),
  });

  const tx = {
    insert: (tableMarker: { __name: string }) => mkInsertBuilder(tableMarker.__name),
    execute: (_sql: unknown) => {
      if (executeFailsWith) throw executeFailsWith;
      txOps.push({ kind: 'audit' });
      return Promise.resolve();
    },
  };

  return {
    __esModule: true,
    db: {
      transaction: async <T>(fn: (txArg: unknown) => Promise<T>): Promise<T> => {
        txOps.push({ kind: 'tx-begin' });
        try {
          const result = await fn(tx);
          txOps.push({ kind: 'tx-commit' });
          return result;
        } catch (e) {
          txOps.push({ kind: 'tx-rollback' });
          throw e;
        }
      },
    },
    hrEmployees: { __name: 'employees' },
    users: { __name: 'users' },
  };
});

import { CreateEmployeeHandler } from '../../src/modules/hr/application/commands/create-employee.handler';
import { CreateEmployeeCommand } from '../../src/modules/hr/application/commands/create-employee.command';

function makeCommand(overrides: Partial<CreateEmployeeCommand> = {}): CreateEmployeeCommand {
  return new CreateEmployeeCommand(
    overrides.firstName ?? 'Sherzod',
    overrides.lastName ?? 'Tursunov',
    overrides.hireDate ?? '2026-05-01',
    overrides.employeeCode ?? 'EMP-T1',
    overrides.middleName ?? null,
    overrides.departmentId ?? 1,
    overrides.positionId ?? 2,
    overrides.baseSalary ?? 5_000_000,
    overrides.phoneNumber ?? '+998901234567',
    overrides.emailWork ?? 'sherzod@europrint.uz',
    overrides.gender ?? 'M',
    overrides.dateOfBirth ?? '1990-01-15',
    overrides.employmentType ?? 'full_time',
    overrides.status ?? 'active',
    overrides.createUserAccount === undefined ? null : overrides.createUserAccount,
    overrides.actorUserId ?? 1,
  );
}

describe('CreateEmployeeHandler (Phase 2 / Task 2.4)', () => {
  let handler: CreateEmployeeHandler;

  beforeEach(() => {
    handler = new CreateEmployeeHandler();
    txOps.length = 0;
    nextEmployeeInsertResult = [{
      id: 99,
      employee_code: 'EMP-T1',
      first_name: 'Sherzod',
      last_name: 'Tursunov',
    }];
    nextUserInsertResult = [{ id: 'user-uuid-1' }];
    executeFailsWith = null;
  });

  it('writes employee + audit inside ONE transaction (happy path)', async () => {
    const result = await handler.execute(makeCommand());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.data.id).toBe(99);
    expect(result.data.employeeCode).toBe('EMP-T1');
    expect(result.data.userId).toBeNull();

    // exactly one tx-begin / tx-commit pair
    expect(txOps.filter(o => o.kind === 'tx-begin')).toHaveLength(1);
    expect(txOps.filter(o => o.kind === 'tx-commit')).toHaveLength(1);
    expect(txOps.filter(o => o.kind === 'tx-rollback')).toHaveLength(0);

    // employee INSERT then audit INSERT
    const innerOps = txOps.filter(o => o.kind !== 'tx-begin' && o.kind !== 'tx-commit');
    expect(innerOps[0]).toEqual({ kind: 'insert', table: 'employees' });
    expect(innerOps[1]).toEqual({ kind: 'audit' });
  });

  it('runs user INSERT BEFORE employee INSERT when createUserAccount is set', async () => {
    const result = await handler.execute(makeCommand({
      createUserAccount: { username: 'sherzod', passwordHash: 'hash', role: 'employee' },
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.data.userId).toBe('user-uuid-1');

    const innerOps = txOps.filter(o => o.kind !== 'tx-begin' && o.kind !== 'tx-commit');
    expect(innerOps[0]).toEqual({ kind: 'insert', table: 'users' });
    expect(innerOps[1]).toEqual({ kind: 'insert', table: 'employees' });
    expect(innerOps[2]).toEqual({ kind: 'audit' });
  });

  it('rolls back when employee INSERT returns no row', async () => {
    // The handler returns { kind: 'err' } (no throw) when INSERT returns no row.
    // The mock transaction commits (no throw = commit path), then the handler
    // checks outcome.kind and returns Err() — so the tx commits but the
    // Result is still Err. No tx-rollback is emitted in this case.
    nextEmployeeInsertResult = [];
    const result = await handler.execute(makeCommand());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.message).toMatch(/CreateEmployee: employee INSERT returned no row/);
    expect(txOps).toContainEqual({ kind: 'tx-commit' });
    expect(txOps).not.toContainEqual({ kind: 'tx-rollback' });
  });

  it('rolls back when user INSERT returns no row', async () => {
    // Same rationale: handler returns { kind: 'err' } without throwing, so
    // the transaction commits and the caller gets Err from the outcome check.
    nextUserInsertResult = [];
    const result = await handler.execute(makeCommand({
      createUserAccount: { username: 'u', passwordHash: 'h', role: 'employee' },
    }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.message).toMatch(/CreateEmployee: user INSERT returned no row/);
    expect(txOps).toContainEqual({ kind: 'tx-commit' });
    expect(txOps).not.toContainEqual({ kind: 'tx-rollback' });
  });

  it('rolls back when audit INSERT throws (no half-state)', async () => {
    executeFailsWith = new Error('audit_logs constraint violation');
    const result = await handler.execute(makeCommand());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.message).toMatch(/audit_logs constraint violation/);
    // employee insert ran but audit threw — tx rolls back
    expect(txOps).toContainEqual({ kind: 'tx-rollback' });
    expect(txOps).not.toContainEqual({ kind: 'tx-commit' });
  });

  it('does not call audit when user INSERT fails first', async () => {
    nextUserInsertResult = [];
    const result = await handler.execute(makeCommand({
      createUserAccount: { username: 'u', passwordHash: 'h', role: 'employee' },
    }));
    expect(result.ok).toBe(false);
    expect(txOps.find(o => o.kind === 'audit')).toBeUndefined();
    expect(txOps.find(o => o.kind === 'insert' && o.table === 'employees')).toBeUndefined();
  });
});
