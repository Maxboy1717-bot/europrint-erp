/**
 * @module vendors.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { vendors } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { VendorsRepository } from './vendors.repository';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly repo: VendorsRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10 } = query;
      const resultR = await this.repo.findAll(Number(page), Number(limit));
      const { data, total } = (resultR.ok ? resultR.data : { data: [], total: 0 }) as { data: unknown[]; total: number };
      return { data, pagination: { total, page, limit } };
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(await this.i18n.t('errors.notFound'));
    return row;
  }

  async create(dto: Record<string, unknown>, createdBy?: number) {
    return safeCall(async () => {
      const row: Omit<typeof vendors.$inferInsert, 'id'> = {
        name: (dto['name'] as string | undefined) ?? '',
        code: dto['code'] as string | undefined,
        email: dto['email'] as string | undefined,
        phone: dto['phone'] as string | undefined,
        address: dto['address'] as string | undefined,
        isActive: (dto['isActive'] as boolean | undefined) ?? true,
        ...(createdBy ? { createdBy: String(createdBy) } : {}),
      };
      const resultR = await this.repo.create(row as typeof vendors.$inferInsert);
      const result = (resultR.ok ? resultR.data as Record<string, unknown> : {});
      this.logger.log(`VendorsService: record created: #${result['id']}`);
      return result;
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      const resultR = await this.repo.update(id, dto as Partial<typeof vendors.$inferInsert>);
      const result = (resultR.ok ? resultR.data as Record<string, unknown> : {});
      this.logger.log(`VendorsService: record #${result['id']} updated`);
      return result;
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.deactivate(id);
      return { message: 'O\'chirildi' };
    });
  }
}
