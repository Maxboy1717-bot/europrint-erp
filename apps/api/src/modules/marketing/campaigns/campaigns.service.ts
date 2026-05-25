/**
 * @module campaigns.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { marketingCampaigns } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { CampaignsRepository } from './campaigns.repository';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly repo: CampaignsRepository) {}

  private mapRow(r: Record<string, unknown>) {
    return { ...r, budget: Number(r['budget']) || 0, spent: Number(r['spentAmount']) || 0 };
  }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rawPage  = Number(query.page);
      const rawLimit = Number(query.limit);
      const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 10;
      const rowsR = await this.repo.findAll();
      const rowsData = (rowsR.ok ? rowsR.data as Record<string, unknown>[] : []);
      const total = rowsData.length;
      const data = rowsData.slice((page - 1) * limit, page * limit).map((r: Record<string, unknown>) => this.mapRow(r));
      return { data, total, page, limit };
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, createdBy?: number) {
    return safeCall(async () => {
      const row: Omit<typeof marketingCampaigns.$inferInsert, 'id'> = {
        name: (dto['name'] as string | undefined) ?? '',
        type: (dto['type'] as string | undefined) ?? 'email',
        status: (dto['status'] as string | undefined) ?? 'draft',
        budget: dto['budget'] as string | undefined,
        startDate: dto['startDate'] as Date | undefined,
        endDate: dto['endDate'] as Date | undefined,
        createdBy: createdBy ? String(createdBy) : (dto['createdBy'] as string | undefined),
      };
      return this.repo.create(row as typeof marketingCampaigns.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof marketingCampaigns.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.softDelete(id);
      this.logger.log(`campaigns: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }
}
