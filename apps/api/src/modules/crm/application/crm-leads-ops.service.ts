/**
 * @module crm-leads-ops.service
 * @description Business-logic service for lead lifecycle operations.
 * Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError, AppErr, Err } from '@common/result';
import { CrmLeadsOpsRepository } from './crm-leads-ops.repository';

@Injectable()
export class CrmLeadsOpsService {
  constructor(private readonly repo: CrmLeadsOpsRepository) {}

  async updateStage(leadId: number, stageId: number, notes?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const stageResult = await this.repo.findStage(stageId);
      if (!stageResult.ok) throw new Error(stageResult.error.message);
      if (!stageResult.data) throw new NotFoundException(`Stage #${stageId} topilmadi`);
      const updateResult = await this.repo.updateLeadStage(leadId, stageId);
      if (!updateResult.ok) throw new Error(updateResult.error.message);
      if (notes) {
        await this.repo.insertActivityNote(leadId, notes);
      }
      return updateResult.data ?? { lead_id: leadId, stage_id: stageId };
    });
  }

  async convert(leadId: number, dealName?: string, amount?: number): Promise<Result<object, AppError>> {
    const leadResult = await this.repo.findLead(leadId);
    if (!leadResult.ok) return Err(leadResult.error);
    if (!leadResult.data) return Err(AppErr('NOT_FOUND', `Lead #${leadId} topilmadi`));

    const lead = leadResult.data as Record<string, unknown>;
    const name = dealName ?? [lead['first_name'], lead['last_name']].filter(Boolean).join(' ') + ' deal';
    const expectedAmount = amount ?? 0;
    const companyId = lead['company_id'];

    return safeCall(async () => {
      const dealResult = await this.repo.insertDeal(leadId, name, companyId, expectedAmount);
      if (!dealResult.ok) throw new Error(dealResult.error.message);
      await this.repo.convertLead(leadId);
      return dealResult.data ?? { lead_id: leadId, deal_name: name };
    });
  }

  async update(leadId: number, dto: Record<string, unknown>): Promise<Result<object[], AppError>> {
    return safeCall(async () => {
      const existsResult = await this.repo.leadExists(leadId);
      if (!existsResult.ok) throw new Error(existsResult.error.message);
      if (!existsResult.data) return [];
      const updateResult = await this.repo.updateLead(leadId, dto);
      if (!updateResult.ok) throw new Error(updateResult.error.message);
      const row = updateResult.data;
      return row ? [row as object] : [];
    });
  }

  async delete(leadId: number): Promise<Result<object, AppError>> {
    const existsResult = await this.repo.leadExists(leadId);
    if (!existsResult.ok) return Err(existsResult.error);
    if (!existsResult.data) return Err(AppErr('NOT_FOUND', `Lead #${leadId} topilmadi`));

    return safeCall(async () => {
      await this.repo.deleteLead(leadId);
      return { deleted: leadId };
    });
  }
}
