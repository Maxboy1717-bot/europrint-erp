/**
 * @module sd-leads.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, Err, Ok } from '@common/result';
import { ISdLeadsRepo, SD_LEADS_REPO } from '../domain/repositories/i-sd-leads.repo';

@Injectable()
export class SdLeadsService {
  constructor(
    @Inject(SD_LEADS_REPO) private readonly repo: ISdLeadsRepo,
    private readonly i18n: I18nService,
  ) {}

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

  async convert(lid: number, notesVal: unknown, convertedBy?: number): Promise<Result<{ lead_id: number; order: unknown }, AppError>> {
    const leadNotFoundMsg = await this.i18n.t('errors.leadNotFound');
    const leadResult = await this.repo.getLeadForConvert(lid);
    if (!leadResult.ok) return Err(leadResult.error);
    const lead = leadResult.data;
    if (!lead) return Err({ code: 'NOT_FOUND', message: leadNotFoundMsg });
    // Atomic: order INSERT + lead status UPDATE in one tx (was: 2 separate writes,
    // partial failure left orphan order + lead still re-convertible = duplicate orders)
    const orderResult = await this.repo.convertLeadToOrderAtomic(
      (lead as Record<string, unknown>).customer_id,
      (lead as Record<string, unknown>).expected_amount,
      lid,
      notesVal,
      convertedBy,
    );
    if (!orderResult.ok) return Err(orderResult.error);
    return Ok({ lead_id: lid, order: orderResult.data });
  }

  async addActivity(lid: number, type: unknown, subject: unknown, notes: unknown, employee_id: unknown) {
    return this.repo.addActivity(lid, type, subject, notes, employee_id);
  }

  async getActivities(lid: number) {
    return this.repo.getActivities(lid);
  }
}
