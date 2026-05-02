import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { FinancePayrollRepository } from './finance-payroll.repository';

@Injectable()
export class FinancePayrollService {
  constructor(private readonly repo: FinancePayrollRepository) {}

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
