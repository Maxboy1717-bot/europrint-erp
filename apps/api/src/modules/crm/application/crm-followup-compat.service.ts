/**
 * @module crm-followup-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmFollowupCompatRepository } from './crm-followup-compat.repository';

@Injectable()
export class CrmFollowupCompatService {
  constructor(private readonly repo: CrmFollowupCompatRepository) {}

  async list(lid: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.list(lid, lim, off);
    });
  }

  async today() {
    return safeCall(async () => {
      return this.repo.today();
    });
  }

  async create(body: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.create(body);
    });
  }

  async update(id: number, body: Record<string, unknown>): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      return this.repo.update(id, body);
    });
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
