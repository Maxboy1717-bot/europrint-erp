/**
 * @module library.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { designLibraryItems } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { LibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(private readonly repo: LibraryRepository) {}

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
      this.logger.log(`library: yaratilmoqda`);
      const row: Omit<typeof designLibraryItems.$inferInsert, 'id'> = {
        name: (dto['name'] as string | undefined) ?? '',
        type: (dto['type'] as string | undefined) ?? 'image',
        fileUrl: dto['fileUrl'] as string | undefined,
        thumbnailUrl: dto['thumbnailUrl'] as string | undefined,
        tags: dto['tags'] as string | undefined,
        status: (dto['status'] as string | undefined) ?? 'active',
        createdBy: createdBy ? String(createdBy) : (dto['createdBy'] as string | undefined),
      };
      return this.repo.create(row as typeof designLibraryItems.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      this.logger.log(`library: yangilanmoqda`);
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof designLibraryItems.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      this.logger.log(`library: o'chirilmoqda`);
      await this.findOne(id);
      await this.repo.softDelete(id);
      return { message: 'O\'chirildi' };
    });
  }
}
