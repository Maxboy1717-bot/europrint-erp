/**
 * @module leads.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { marketingLeads } from '@europrint/schemas';
import { safeCall, Result, AppError } from '@common/result';
import { LeadsRepository } from './leads.repository';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly repo: LeadsRepository) {}

  private mapRow(r: Record<string, unknown>) {
    const parts = String(r['name'] ?? '').split(' ');
    return { ...r, firstName: parts[0] || '', lastName: parts.length > 1 ? parts.slice(1).join(' ') : '' };
  }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rawPage  = Number(query.page);
      const rawLimit = Number(query.limit);
      const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
      const lim   = Math.min(200, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10);
      const totalR = await this.repo.count();
      const total = totalR.ok ? totalR.data : 0;
      const rowsR = await this.repo.findAll({ limit: lim, offset: (page - 1) * lim });
      const rowsData = rowsR.ok && Array.isArray(rowsR.data) ? rowsR.data : [];
      const data = rowsData.map((r: Record<string, unknown>) => this.mapRow(r));
      return { data, total, page, limit: lim };
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, _createdBy?: number) {
    return safeCall(async () => {
      const row: Omit<typeof marketingLeads.$inferInsert, 'id'> = {
        campaignId: dto['campaignId'] as string | undefined,
        firstName: dto['firstName'] as string | undefined,
        lastName: dto['lastName'] as string | undefined,
        email: dto['email'] as string | undefined,
        phone: dto['phone'] as string | undefined,
        status: (dto['status'] as string | undefined) ?? 'new',
      };
      return this.repo.create(row as typeof marketingLeads.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof marketingLeads.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.softDelete(id);
      this.logger.log(`leads: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }

  async getLossAnalysis() {
    return this.repo.getLossAnalysis();
  }
}
