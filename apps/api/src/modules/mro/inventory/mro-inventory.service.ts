/**
 * @module mro-inventory.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { mroInventory } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { MroInventoryRepository } from './mro-inventory.repository';

@Injectable()
export class MroInventoryService {
  private readonly logger = new Logger(MroInventoryService.name);

  constructor(private readonly repo: MroInventoryRepository) {}

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
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, _createdBy?: number) {
    return safeCall(async () => {
      const row: Omit<typeof mroInventory.$inferInsert, 'id'> = {
        name: (dto['name'] as string | undefined) ?? '',
        partNumber: dto['partNumber'] as string | undefined,
        warehouseId: dto['warehouseId'] as string | undefined,
        quantity: (dto['quantity'] as string | undefined) ?? '0',
        unit: dto['unit'] as string | undefined,
        minQuantity: (dto['minQuantity'] as string | undefined) ?? '0',
        unitPrice: dto['unitPrice'] as string | undefined,
      };
      return this.repo.create(row as typeof mroInventory.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof mroInventory.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.remove(id);
      this.logger.log(`mro inventory: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }
}
