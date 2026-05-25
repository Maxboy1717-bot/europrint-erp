/**
 * @module crm-followup-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_FOLLOWUP_COMPAT_REPO, type ICrmFollowupCompatRepo } from '../domain/repositories/i-crm-followup-compat.repo';

@Injectable()
export class CrmFollowupCompatService {
  constructor(@Inject(CRM_FOLLOWUP_COMPAT_REPO) private readonly repo: ICrmFollowupCompatRepo) {}

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
