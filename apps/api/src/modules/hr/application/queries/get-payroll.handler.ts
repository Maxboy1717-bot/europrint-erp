/**
 * @module get-payroll.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetPayrollQuery } from './get-payroll.query';
import { IHrRepo, HR_REPO } from '../../domain/repositories/i-hr.repo';

@Injectable()
@QueryHandler(GetPayrollQuery)
export class GetPayrollHandler implements IQueryHandler<GetPayrollQuery> {
  private readonly logger = new Logger(GetPayrollHandler.name);

  constructor(@Inject(HR_REPO) private readonly hrRepo: IHrRepo) {}

  async execute(query: GetPayrollQuery): Promise<Result<object[]>> {
    const result = await this.hrRepo
      .findPayroll(query.filters)
      .catch((err) => ({ ok: false as const, error: (err as Error).message }));

    if (!result.ok) {
      this.logger.error(`Failed to fetch payroll: ${result.error}`);
      return result as Result<object[]>;
    }

    this.logger.debug(`Payroll records fetched: count=${result.data.length}`);

    return { ok: true, data: result.data };
  }
}
