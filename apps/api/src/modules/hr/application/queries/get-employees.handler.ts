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

    const paginatedResult: PaginatedResult<Record<string, unknown>> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.debug(`Employees fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return Ok(paginatedResult);
  }
}
