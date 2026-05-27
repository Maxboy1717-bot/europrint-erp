/**
 * @module access.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { AccessRepository } from './access.repository';
import { securityAccess } from '@europrint/schemas';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(private readonly repo: AccessRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    const { page = 1, limit = 10 } = query;
    const r = await this.repo.findAll(Number(page), Number(limit));
    if (!r.ok) return r;
    const { data, total } = r.data as { data: unknown[]; total: number };
    return safeCall(async () => ({ data, pagination: { total, page, limit } }));
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, createdBy?: number) {
    return safeCall(async () => {
      this.logger.log(`access: yaratilmoqda`);
      const row: Omit<typeof securityAccess.$inferInsert, 'id'> = {
        userId: (dto['userId'] as string | undefined) ?? '',
        module: (dto['module'] as string | undefined) ?? '',
        canAccess: (dto['canAccess'] as boolean | undefined) ?? true,
        grantedBy: createdBy ? String(createdBy) : (dto['grantedBy'] as string | undefined),
      };
      return this.repo.create(row as typeof securityAccess.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      this.logger.log(`access: yangilanmoqda`);
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof securityAccess.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      this.logger.log(`access: o'chirilmoqda`);
      await this.findOne(id);
      await this.repo.remove(id);
      return { message: 'O\'chirildi' };
    });
  }
}
