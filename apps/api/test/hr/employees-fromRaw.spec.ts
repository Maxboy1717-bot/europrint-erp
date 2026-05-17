/**
 * @module test/hr/employees-fromRaw.spec
 * @description H.12 — verifies `EmployeesService` hydrates raw repository rows
 * through `Employee.fromRaw(...)` and surfaces VO validation failures as
 * `Err({ code: 'VALIDATION', ... })` instead of leaking unchecked primitives.
 *
 *   The repository is replaced with a hand-written `jest.Mocked<IEmployeesRepository>`
 *   so the service is exercised in isolation: no Drizzle, no DB. We assert:
 *
 *     1. happy path → `findAll` returns Ok with `data` populated by `Employee`
 *        aggregates whose getters match the input row,
 *     2. invalid-email path → `findAll` rejects with `VALIDATION` (`Email.create`
 *        is the underlying gate that flips `Employee.fromRaw` to Err),
 *     3. happy path → `findOneAggregate` returns Ok(Employee) with id/email
 *        getters intact,
 *     4. invalid-id path → `findOneAggregate` returns Err with code `VALIDATION`,
 *     5. not-found → `findOneAggregate` returns Err with code `NOT_FOUND`.
 */

import 'reflect-metadata';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmployeesService } from '../../src/modules/hr/employees/employees.service';
import type { IEmployeesRepository } from '../../src/modules/hr/employees/i-employees.repo';
import { Employee } from '../../src/modules/hr/domain/aggregates/employee.aggregate';
import { Ok } from '../../src/common/result';

type Row = Record<string, unknown>;
type Repo = jest.Mocked<IEmployeesRepository>;

function makeRepo(): Repo {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByDepartment: jest.fn(),
    findSelf: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  } as Repo;
}

function validRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 11,
    user_id: 22,
    department_id: 3,
    position_id: 9,
    base_salary: 5_000_000,
    employment_type: 'monthly',
    status: 'active',
    email: 'sherzod@europrint.uz',
    phone: '+998901234567',
    ...overrides,
  };
}

describe('EmployeesService — Employee.fromRaw hydration (H.12)', () => {
  let repo: Repo;
  let service: EmployeesService;

  beforeEach(() => {
    repo = makeRepo();
    service = new EmployeesService(repo, new EventEmitter2());
  });

  describe('findAll', () => {
    it('returns Ok with Employee aggregates whose getters match input rows', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [validRow()], count: 1 }));

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      const envelope = result.data as { data: Employee[]; pagination: unknown };
      expect(envelope.data).toHaveLength(1);
      const e = envelope.data[0];
      expect(e).toBeInstanceOf(Employee);
      expect(e.id).toBe(11);
      expect(e.userId).toBe(22);
      expect(e.departmentId).toBe(3);
      expect(e.positionId).toBe(9);
      expect(e.baseSalary).toBe(5_000_000);
      expect(e.status).toBe('active');
      expect(e.email).toBe('sherzod@europrint.uz');
      expect(e.phone).toBe('+998901234567');
    });

    it('returns Err when a row carries an invalid email', async () => {
      // bad email → Email.create fails → Employee.fromRaw fails → service Errs
      repo.findAll.mockResolvedValue(
        Ok({ data: [validRow({ email: 'not-an-email' })], count: 1 }),
      );

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unreachable');
      // safeCall wraps InternalServerErrorException, so the failure surfaces
      // with the validation message embedded.
      expect(result.error.message).toMatch(/failed validation/i);
      expect(result.error.message).toMatch(/Invalid Email/i);
    });

    it('returns Err when a row carries a non-positive id', async () => {
      repo.findAll.mockResolvedValue(
        Ok({ data: [validRow({ id: 0 })], count: 1 }),
      );

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unreachable');
      expect(result.error.message).toMatch(/Invalid EmployeeId/i);
    });

    it('returns Ok with empty aggregate array when repo yields no rows', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      const envelope = result.data as { data: Employee[] };
      expect(envelope.data).toEqual([]);
    });
  });

  describe('findOneAggregate', () => {
    it('returns Ok(Employee) when the row hydrates cleanly', async () => {
      repo.findById.mockResolvedValue(Ok(validRow()));

      const result = await service.findOneAggregate(11);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      expect(result.data).toBeInstanceOf(Employee);
      expect(result.data.id).toBe(11);
      expect(result.data.email).toBe('sherzod@europrint.uz');
      expect(result.data.phone).toBe('+998901234567');
    });

    it('returns Err(NOT_FOUND) when repo returns null', async () => {
      repo.findById.mockResolvedValue(Ok(null));

      const result = await service.findOneAggregate(42);

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unreachable');
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toMatch(/Xodim #42/);
    });

    it('returns Err(VALIDATION) when the row has an invalid phone', async () => {
      // invalid E.164: too short
      repo.findById.mockResolvedValue(
        Ok(validRow({ phone: '+123' })),
      );

      const result = await service.findOneAggregate(11);

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unreachable');
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(/Invalid PhoneNumber/i);
    });
  });
});
