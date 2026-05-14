/**
 * @module sd-leads.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { SdLeadsRepository } from './sd-leads.repository';

@Injectable()
export class SdLeadsService {
  constructor(private readonly repo: SdLeadsRepository) {}

  async list(status: string | undefined, uid: number | null, pat: string | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.list(status, uid, pat, lim, off);
  }

  async getStats() {
    return this.repo.getStats();
  }

  async exportLeads(from?: string, to?: string, status?: string) {
    return this.repo.exportLeads(from, to, status);
  }

  async getById(lid: number) {
    return this.repo.getById(lid);
  }

  async create(body: Record<string, unknown>) {
    return this.repo.create(body);
  }

  async update(lid: number, body: Record<string, unknown>) {
    return this.repo.update(lid, body);
  }

  async updateStatus(lid: number, status: string) {
    return this.repo.updateStatus(lid, status);
  }

  async delete(lid: number) {
    return this.repo.delete(lid);
  }

  async convert(lid: number, notesVal: unknown) {
    return safeCall(async () => {
      const leadResult = await this.repo.getLeadForConvert(lid);
      if (!leadResult.ok) throw new Error(leadResult.error.message);
      const lead = leadResult.data;
      if (!lead) throw new NotFoundException(`Lead #${lid} topilmadi`);
      const order = await this.repo.insertOrderFromLead((lead as Record<string, unknown>).customer_id, (lead as Record<string, unknown>).expected_amount, lid, notesVal);
      await this.repo.markConverted(lid);
      return { lead_id: lid, order };
    });
  }

  async addActivity(lid: number, type: unknown, subject: unknown, notes: unknown, employee_id: unknown) {
    return this.repo.addActivity(lid, type, subject, notes, employee_id);
  }

  async getActivities(lid: number) {
    return this.repo.getActivities(lid);
  }
}
