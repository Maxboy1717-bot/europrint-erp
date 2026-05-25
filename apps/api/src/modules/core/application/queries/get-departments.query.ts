/**
 * @module get-departments.query
 * @description Source module. See exports for details.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Department } from '../../domain/aggregates/department.aggregate';

export class GetDepartmentsQuery {
  constructor(public readonly filters?: { isActive?: boolean; parentId?: string }) {}
}

export interface DepartmentWithHead extends Department {
  headName?: string;
}

@QueryHandler(GetDepartmentsQuery)
export class GetDepartmentsHandler implements IQueryHandler<GetDepartmentsQuery> {
  private readonly logger = new Logger(GetDepartmentsHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(query: GetDepartmentsQuery): Promise<Result<DepartmentWithHead[]>> {
    const result = await this.repo.findAllDepartments(query.filters);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      data: result.data,
    };
  }
}
