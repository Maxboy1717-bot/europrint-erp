/**
 * @module drizzle-hr-base-save-employee.spec
 * @description Phase 2 / Task 2.4 regression — guards the transactional
 *   contract of HrBaseRepository.saveEmployee:
 *
 *     1. Wraps employee INSERT + inline audit INSERT in db.transaction.
 *     2. Returns Err(...) when the employee INSERT yields no row.
 *     3. Returns Err(...) and rolls back when the audit INSERT throws.
 *
 *   We mock @shared/db so the repo's tx callback runs against an in-memory
 *   stub instead of a real PG connection; the test asserts call order.
 */

import 'reflect-metadata';

const txOps: Array<{ kind: string; table?: string }> = [];
let nextEmployeeInsertResult: Array<Record<string, unknown>> = [{
  id: 7,
  employee_code: 'EMP-X',
  first_name: 'A',
  last_name: 'B',
}];
let executeFailsWith: Error | null = null;

jest.mock('@shared/db', () => {
  const mkInsertBuilder = (table: string) => ({
    values: (_v: unknown) => ({
      returning: () => {
        txOps.push({ kind: 'insert', table });
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
    runQuery: jest.fn(),
    db: {
      transaction: async <T>(fn: (txArg: unknown) => Promise<T>): Promise<T> => {
        txOps.push({ kind: 'tx-begin' });
        try {
          const r = await fn(tx);
          txOps.push({ kind: 'tx-commit' });
          return r;
        } catch (e) {
          txOps.push({ kind: 'tx-rollback' });
          throw e;
        }
      },
      select: jest.fn(),
      update: jest.fn(),
    },
    hrEmployees: { __name: 'employees' },
    hrDepartments: { __name: 'departments' },
    hrPositions: { __name: 'positions' },
    salary_history: { __name: 'salary_history' },
    payroll_periods_hr: { __name: 'payroll_periods' },
    candidates: { __name: 'candidates' },
    discipline_records: { __name: 'discipline_records' },
    hr_health_checkups: { __name: 'hr_health_checkups' },
  };
});

import { HrBaseRepository } from '../../src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo';

describe('HrBaseRepository.saveEmployee — transactional contract (Phase 2 / Task 2.4)', () => {
  let repo: HrBaseRepository;

  beforeEach(() => {
    // leaveRepo is unused by saveEmployee path; cast to any-shaped stub.
    repo = new HrBaseRepository({} as never);
    txOps.length = 0;
    nextEmployeeInsertResult = [{
      id: 7, employee_code: 'EMP-X', first_name: 'A', last_name: 'B',
    }];
    executeFailsWith = null;
  });

  it('runs INSERT employees + INSERT audit inside ONE transaction', async () => {
    const result = await repo.saveEmployee({
      firstName: 'A', lastName: 'B', hireDate: '2026-05-01',
    });
    expect(result.ok).toBe(true);

    expect(txOps.filter(o => o.kind === 'tx-begin')).toHaveLength(1);
    expect(txOps.filter(o => o.kind === 'tx-commit')).toHaveLength(1);
    const inner = txOps.filter(o => !o.kind.startsWith('tx-'));
    expect(inner[0]).toEqual({ kind: 'insert', table: 'employees' });
    expect(inner[1]).toEqual({ kind: 'audit' });
  });

  it('returns Err and rolls back when INSERT yields no row', async () => {
    nextEmployeeInsertResult = [];
    const result = await repo.saveEmployee({
      firstName: 'A', lastName: 'B', hireDate: '2026-05-01',
    });
    expect(result.ok).toBe(false);
    expect(txOps).toContainEqual({ kind: 'tx-rollback' });
    expect(txOps).not.toContainEqual({ kind: 'tx-commit' });
  });

  it('returns Err and rolls back when audit INSERT throws', async () => {
    executeFailsWith = new Error('FK violation on audit_logs');
    const result = await repo.saveEmployee({
      firstName: 'A', lastName: 'B', hireDate: '2026-05-01',
    });
    expect(result.ok).toBe(false);
    expect(txOps).toContainEqual({ kind: 'tx-rollback' });
    // Employee INSERT did run before the audit throw — rollback undoes it.
    expect(txOps).toContainEqual({ kind: 'insert', table: 'employees' });
  });

  it('falls back to today as hire_date when none is supplied', async () => {
    let observedHireDate: string | undefined;
    nextEmployeeInsertResult = [{
      id: 1, employee_code: 'EMP-1', first_name: 'A', last_name: 'B',
    }];
    // Re-mock the insert builder to capture the payload.
    const capture: Array<Record<string, unknown>> = [];
    jest.resetModules();
    jest.doMock('@shared/db', () => {
      const tx = {
        insert: (_t: unknown) => ({
          values: (v: Record<string, unknown>) => {
            capture.push(v);
            observedHireDate = v.hire_date as string;
            return { returning: () => Promise.resolve(nextEmployeeInsertResult) };
          },
        }),
        execute: () => Promise.resolve(),
      };
      return {
        __esModule: true,
        runQuery: jest.fn(),
        db: { transaction: async <T>(fn: (t: unknown) => Promise<T>) => fn(tx) },
        hrEmployees: { __name: 'employees' },
        hrDepartments: {}, hrPositions: {}, salary_history: {},
        payroll_periods_hr: {}, candidates: {}, discipline_records: {},
        hr_health_checkups: {},
      };
    });

    const { HrBaseRepository: FreshRepo } = await import('../../src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo');
    const fresh = new FreshRepo({} as never);
    const r = await fresh.saveEmployee({ firstName: 'A', lastName: 'B' });
    expect(r.ok).toBe(true);
    expect(observedHireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(capture).toHaveLength(1);
  });

  it('preserves the supplied employeeCode when provided', async () => {
    let observedCode: string | undefined;
    jest.resetModules();
    jest.doMock('@shared/db', () => {
      const tx = {
        insert: (_t: unknown) => ({
          values: (v: Record<string, unknown>) => {
            observedCode = v.employee_code as string;
            return {
              returning: () => Promise.resolve([{
                id: 1, employee_code: v.employee_code, first_name: 'A', last_name: 'B',
              }]),
            };
          },
        }),
        execute: () => Promise.resolve(),
      };
      return {
        __esModule: true,
        runQuery: jest.fn(),
        db: { transaction: async <T>(fn: (t: unknown) => Promise<T>) => fn(tx) },
        hrEmployees: { __name: 'employees' },
        hrDepartments: {}, hrPositions: {}, salary_history: {},
        payroll_periods_hr: {}, candidates: {}, discipline_records: {},
        hr_health_checkups: {},
      };
    });

    const { HrBaseRepository: FreshRepo } = await import('../../src/modules/hr/infrastructure/repositories/drizzle-hr-base.repo');
    const fresh = new FreshRepo({} as never);
    const r = await fresh.saveEmployee({
      firstName: 'A', lastName: 'B', employeeCode: 'CUSTOM-99',
    });
    expect(r.ok).toBe(true);
    expect(observedCode).toBe('CUSTOM-99');
  });
});
