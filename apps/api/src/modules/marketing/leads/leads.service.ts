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
      const { page = 1, limit = 10 } = query;
      const rowsR = await this.repo.findAll();
      const rowsData = (rowsR.ok ? rowsR.data as Record<string, unknown>[] : []);
      const total = rowsData.length;
      const data = rowsData.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)).map((r: Record<string, unknown>) => this.mapRow(r));
      return { data, total, page, limit };
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
    const r = await this.repo.getLossAnalysis();
    if (!r.ok) throw new Error(String(r.error));
    return r.data;
  }
}
