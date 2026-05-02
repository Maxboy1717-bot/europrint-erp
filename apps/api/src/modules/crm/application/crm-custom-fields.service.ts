import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmCustomFieldsRepository } from './crm-custom-fields.repository';

@Injectable()
export class CrmCustomFieldsService {
  constructor(private readonly repo: CrmCustomFieldsRepository) {}

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
