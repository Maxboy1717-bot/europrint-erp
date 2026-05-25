/**
 * @module employees.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Read path (H.12): repo rows are mapped through `Employee.fromRaw(...)` so the
 * service hands back validated `Employee` aggregates (VO-checked id/email/phone)
 * instead of raw record objects. A validation failure on any row short-circuits
 * with `Err({ code: 'VALIDATION', ... })` — the fail-fast / strict policy.
 *
 * Mutation methods (`create`/`update`/`remove`) still surface raw repository
 * shapes; promoting them is out of scope for H.12.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEmployeesRepository, EMPLOYEES_REPO } from './i-employees.repo';
import { safeCall, Result, Ok, Err, AppErr, AppError } from '@common/result';
import {
  Employee,
  EmployeeRawProps,
} from '../domain/aggregates/employee.aggregate';

type Row = Record<string, unknown>;

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @Inject(EMPLOYEES_REPO) private readonly employeesRepo: IEmployeesRepository,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Translate a raw repository row into the primitive shape `Employee.fromRaw`
   * expects. Field names diverge (DB row uses snake_case + table aliases) so
   * we centralise the mapping here. Defaults preserve legacy semantics:
   *   - `userId` falls back to `id` when the column is absent
   *   - `employmentType` defaults to 'monthly'
   *   - `status` defaults to 'active'
   *   - email/phone stay `undefined` when missing (Employee VOs accept that)
   */
  private toEmployeeRawProps(row: Row): EmployeeRawProps {
    const idCandidate = row.id ?? row.employee_id ?? row.employeeId;
    const userIdCandidate =
      row.user_id ?? row.userId ?? row.id ?? row.employee_id;
    const departmentIdCandidate =
      row.department_id ?? row.departmentId ?? 0;
    const positionIdCandidate =
      row.position_id ?? row.positionId ?? 0;
    const baseSalaryCandidate =
      row.base_salary ?? row.baseSalary ?? 0;
    const employmentType =
      (row.employment_type as EmployeeRawProps['employmentType']) ??
      (row.employmentType as EmployeeRawProps['employmentType']) ??
      'monthly';
    const status =
      (row.status as EmployeeRawProps['status']) ?? 'active';
    const email =
      typeof row.email === 'string' ? row.email : undefined;
    const phone =
      typeof row.phone === 'string' ? row.phone : undefined;

    return {
      id: Number(idCandidate),
      userId: Number(userIdCandidate),
      departmentId: Number(departmentIdCandidate),
      positionId: Number(positionIdCandidate),
      employmentType,
      baseSalary: Number(baseSalaryCandidate),
      status,
      email,
      phone,
    };
  }

  /**
   * Strict (fail-fast) mapper from raw repo rows to validated `Employee`
   * aggregates. On the first row that fails VO validation we return an `Err`
   * with the underlying domain error attached — no partial successes.
   */
  private mapRowsToAggregates(rows: Row[]): Result<Employee[], AppError> {
    const safe = Array.isArray(rows) ? rows : [];
    const out: Employee[] = [];
    for (let i = 0; i < safe.length; i++) {
      const row = safe[i];
      const built = Employee.fromRaw(this.toEmployeeRawProps(row));
      if (!built.ok) {
        return Err(
          AppErr(
            'VALIDATION',
            `Employee row #${i} failed validation: ${built.error.message}`,
            { row, cause: built.error },
          ),
        );
      }
      out.push(built.data);
    }
    return Ok(out);
  }

  async findAll(query: Record<string, unknown> = {}, currentUser?: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10, search, departmentId, status } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const role = currentUser?.role;

    if (role && role !== 'super_admin' && role !== 'admin' && role !== 'hr_manager') {
      const selfResult = await this.employeesRepo.findById(Number(currentUser.sub));
      if (!selfResult.ok) throw new InternalServerErrorException(selfResult.error);
      const selfDeptId = selfResult.data?.departmentId;

      if (role === 'manager') {
        const result = await this.employeesRepo.findByDepartment(Number(selfDeptId), Number(limit), Number(offset), search as string | undefined, status as string | undefined);
        if (!result.ok) throw new InternalServerErrorException(result.error);
        const { data, count: total } = result.data;
        const mapped = this.mapRowsToAggregates(data);
        if (!mapped.ok) throw new InternalServerErrorException(mapped.error.message);
        return { data: mapped.data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
      }

      const selfListResult = await this.employeesRepo.findSelf(Number(currentUser.sub), Number(limit), Number(offset));
      if (!selfListResult.ok) throw new InternalServerErrorException(selfListResult.error);
      const { data, count: total } = selfListResult.data;
      const mapped = this.mapRowsToAggregates(data);
      if (!mapped.ok) throw new InternalServerErrorException(mapped.error.message);
      return { data: mapped.data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };
    }

    const result = await this.employeesRepo.findAll({ limit: Number(limit), offset: Number(offset), search: search as string | undefined, departmentId: departmentId as number | undefined, status: status as string | undefined });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    const mapped = this.mapRowsToAggregates(data);
    if (!mapped.ok) throw new InternalServerErrorException(mapped.error.message);
    return { data: mapped.data, pagination: { total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) } };

    });}

  /**
   * Returns the raw repository row for back-compat (mutation paths still rely
   * on it). Prefer {@link findOneAggregate} for new callers that want the
   * validated `Employee` aggregate.
   */
  async findOne(id: number) {
    const result = await this.employeesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Xodim #${id} topilmadi`);
    return result.data;
  }

  /**
   * Aggregate-returning read for a single employee. The row goes through
   * `Employee.fromRaw`, so any invalid id/email/phone surfaces as a `VALIDATION`
   * error instead of leaking into business code.
   */
  async findOneAggregate(id: number): Promise<Result<Employee, AppError>> {
    const result = await this.employeesRepo.findById(id);
    if (!result.ok) return Err(AppErr('INTERNAL', String(result.error)));
    if (!result.data) return Err(AppErr('NOT_FOUND', `Xodim #${id} topilmadi`));
    const built = Employee.fromRaw(this.toEmployeeRawProps(result.data as Row));
    if (!built.ok) {
      return Err(AppErr('VALIDATION', `Employee #${id} failed validation: ${built.error.message}`, { cause: built.error }));
    }
    return Ok(built.data);
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.employeesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const employee = result.data;
    this.events.emit('employee.created', { employeeId: employee['id'], photoUrl: employee['photo_url'] ?? employee['avatar'] });
    return employee;

    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.employeesRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.employeesRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "Xodim o'chirildi" };
  
    });}
}
