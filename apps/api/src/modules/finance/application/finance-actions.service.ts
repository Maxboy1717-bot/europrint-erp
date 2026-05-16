/**
 * @module finance-actions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { FINANCE_ACTIONS_REPO, type IFinanceActionsRepo } from '../domain/repositories/i-finance-actions.repo';
import { Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsService {
  constructor(@Inject(FINANCE_ACTIONS_REPO) private readonly repo: IFinanceActionsRepo) {}

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

  createApEntry(data: Record<string, unknown>) {
    return this.repo.createApEntry(data);
  }

  createArEntry(data: Record<string, unknown>) {
    return this.repo.createArEntry(data);
  }
}
