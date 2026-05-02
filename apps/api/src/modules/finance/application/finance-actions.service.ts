import { Injectable } from '@nestjs/common';
import { FinanceActionsRepository } from './finance-actions.repository';
import { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsService {
  constructor(private readonly repo: FinanceActionsRepository) {}

  getSalaryBenchmark(): Promise<Result<Row>> {
    return this.repo.getSalaryBenchmark();
  }

  approvePayment(id: number, approvedBy: number | string): Promise<Result<Row>> {
    return this.repo.approvePayment(id, approvedBy);
  }

  listAdvances(lim: number, off: number, page: number) {
    return this.repo.listAdvances(lim, off, page);
  }

  getPendingAdvances() {
    return this.repo.getPendingAdvances();
  }
}
