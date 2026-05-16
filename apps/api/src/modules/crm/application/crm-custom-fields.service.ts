/**
 * @module crm-custom-fields.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_CUSTOM_FIELDS_REPO, type ICrmCustomFieldsRepo } from '../domain/repositories/i-crm-custom-fields.repo';

@Injectable()
export class CrmCustomFieldsService {
  constructor(@Inject(CRM_CUSTOM_FIELDS_REPO) private readonly repo: ICrmCustomFieldsRepo) {}

  async list(entityType: string | null): Promise<Result<object, AppError>> {
    return this.repo.list(entityType);
  }

  async create(body: Record<string, unknown>) {
    return this.repo.create(body);
  }

  async update(id: number, body: Record<string, unknown>) {
    return this.repo.update(id, body);
  }

  async reorder(items: Array<{ id: number; order_index: number }>) {
    return safeCall(async () => {
      await this.repo.reorder(items);
      return { reordered: items.length };
    });
  }

  async delete(id: number) {
    return safeCall(async () => {
      await this.repo.remove(id);
      return { deleted: true };
    });
  }
}
