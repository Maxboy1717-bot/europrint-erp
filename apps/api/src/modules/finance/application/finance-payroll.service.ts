/**
 * @module finance-payroll.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { FINANCE_PAYROLL_APP_REPO, type IFinancePayrollRepo } from '../domain/repositories/i-finance-payroll.repo';

@Injectable()
export class FinancePayrollService {
  constructor(@Inject(FINANCE_PAYROLL_APP_REPO) private readonly repo: IFinancePayrollRepo) {}

  async byDepartment(periodId?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.byDepartment(periodId);
    });
  }

  async byBrigade(periodId?: string) {
    return safeCall(async () => {
      return this.repo.byBrigade(periodId);
    });
  }

  async taxSummary(periodId?: string) {
    return safeCall(async () => {
      return this.repo.taxSummary(periodId);
    });
  }
}
