/**
 * @module sd-payments.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ISdPaymentsRepo, SD_PAYMENTS_REPO } from '../domain/repositories/i-sd-payments.repo';

@Injectable()
export class SdPaymentsService {
  constructor(@Inject(SD_PAYMENTS_REPO) private readonly repo: ISdPaymentsRepo) {}

  async list(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.list(customerId, status, lim, off);
  }

  async getDebitors(lim: number, off: number) {
    return this.repo.getDebitors(lim, off);
  }

  async getOverdue(lim: number, off: number) {
    return this.repo.getOverdue(lim, off);
  }

  async create(body: Record<string, unknown>) {
    return this.repo.create(body);
  }

  async getActiveRentals(lim: number, off: number) {
    return this.repo.getActiveRentals(lim, off);
  }
}
