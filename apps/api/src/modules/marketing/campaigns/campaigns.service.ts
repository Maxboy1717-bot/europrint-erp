/**
 * @module campaigns.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError } from '@common/result';
import { CampaignsRepository } from './campaigns.repository';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly repo: CampaignsRepository,
    private readonly i18n: I18nService,
  ) {}

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

  async findOne(id: string) {
    const r = await this.repo.findOne(id);
    const row = r.ok ? r.data : null;
    if (!row) throw new NotFoundException(await this.i18n.t('errors.campaignNotFoundWithId', { args: { id } }));
    return row;
  }

  async create(dto: Record<string, unknown>, createdBy?: number) {
    return safeCall(async () => {
      const row: Record<string, unknown> = {
        name: (dto['name'] as string | undefined) ?? '',
        description: dto['description'] as string | undefined,
        type: (dto['type'] as string | undefined) ?? 'digital',
        platform: dto['platform'] as string | undefined,
        status: (dto['status'] as string | undefined) ?? 'draft',
        budget: dto['budget'] != null ? String(dto['budget']) : undefined,
        startDate: dto['startDate'],
        endDate: dto['endDate'],
        targetAudience: dto['targetAudience'] != null
          ? (typeof dto['targetAudience'] === 'string' ? dto['targetAudience'] : JSON.stringify(dto['targetAudience']))
          : undefined,
        createdBy: createdBy ?? (dto['createdBy'] as number | undefined),
      };
      const r = await this.repo.create(row);
      if (!r.ok) throw new Error(String(r.error));
      return r.data;
    });
  }

  async update(id: string, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      const r = await this.repo.update(id, dto);
      if (!r.ok) throw new Error(String(r.error));
      return r.data;
    });
  }

  async remove(id: string) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.softDelete(id);
      this.logger.log(`campaigns: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }
}
