/**
 * @module get-employees.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult, Ok, Err, AppErr } from '@common/types/result.type';
import { GetEmployeesQuery } from './get-employees.query';
import { IHrRepo, HR_REPO } from '../../domain/repositories/i-hr.repo';

@Injectable()
@QueryHandler(GetEmployeesQuery)
export class GetEmployeesHandler implements IQueryHandler<GetEmployeesQuery> {
  private readonly logger = new Logger(GetEmployeesHandler.name);

  constructor(@Inject(HR_REPO) private readonly hrRepo: IHrRepo) {}

  async execute(query: GetEmployeesQuery): Promise<Result<PaginatedResult<Record<string, unknown>>>> {
    const result = await this.hrRepo
      .findAllEmployees(query.filters)
      .catch((err) => ({ ok: false as const, error: (err as Error).message }));

    if (!result.ok) {
      this.logger.error(`Failed to fetch employees: ${result.error}`);
      return Err(AppErr('INTERNAL', String(result.error)));
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    // Project raw snake_case DB rows → camelCase EmployeeRow shape expected by FE
    const items = result.data.items.map((row) => ({
      id:               String(row['id'] ?? ''),
      fullName:         [row['first_name'], row['last_name']].filter(Boolean).join(' '),
      employeeId:       String(row['employee_code'] ?? ''),
      telegramChatId:   (row['telegram_chat_id'] as string | null) ?? null,
      birthDate:        (row['date_of_birth'] ?? row['birth_date'] ?? null) as string | null,
      hireDate:         (row['hire_date'] as string | null) ?? null,
      address:          null,
      attestationDate:  null,
      orgDepartmentId:  row['department_id'] != null ? String(row['department_id']) : null,
      orgDepartmentName:(row['department_name'] as string | null) ?? null,
      orgPositionName:  (row['position_name'] as string | null) ?? null,
      phone:            (row['phone_number'] as string | null) ?? null,
      coursesTotal:     null,
      rating:           (row['total_points'] as number | null) ?? null,
      bonusAmount:      null,
      status:           (row['status'] as string) || 'active',
      failedTests:      null,
      disciplineCount:  null,
      profileImageUrl:  (row['photo_url'] as string | null) ?? null,
    }));

    const paginatedResult: PaginatedResult<Record<string, unknown>> = {
      items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.debug(`Employees fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return Ok(paginatedResult);
  }
}
