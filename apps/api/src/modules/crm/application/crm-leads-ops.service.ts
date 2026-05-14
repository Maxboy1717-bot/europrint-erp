/**
 * @module crm-leads-ops.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import { CrmLeadsOpsRepository } from './crm-leads-ops.repository';

@Injectable()
export class CrmLeadsOpsService {
  constructor(private readonly repo: CrmLeadsOpsRepository) {}

  async update(lid: number, body: Record<string, unknown>): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.updateLead(lid, body);
  }

  async updateStage(lid: number, stageId: number, notes?: string) {
    return safeCall(async () => {
      const stageResult = await this.repo.findStage(stageId);
      if (!stageResult.ok) throw new Error(stageResult.error.message);
      if (!stageResult.data) throw new NotFoundException(`Lead stage #${stageId} topilmadi`);
      const resultR = await this.repo.updateLeadStage(lid, stageId);
      if (notes) await this.repo.insertActivityNote(lid, notes);
      return resultR.ok ? resultR.data : null;
    });
  }

  async convert(lid: number, deal_name?: string, expected_amount?: number) {
    return safeCall(async () => {
      const leadResult = await this.repo.findLead(lid);
      if (!leadResult.ok) throw new Error(leadResult.error.message);
      if (!leadResult.data) throw new NotFoundException(`Lead #${lid} topilmadi`);
      const lead = leadResult.data as Record<string, unknown>;
      const name = deal_name ?? `${lead['first_name']} ${lead['last_name'] ?? ''} deal`;
      const dealResult = await this.repo.insertDeal(lid, String(name), lead['company_id'], expected_amount ?? 0);
      await this.repo.convertLead(lid);
      return { lead_id: lid, deal: dealResult.ok ? dealResult.data : null };
    });
  }

  async delete(lid: number) {
    return safeCall(async () => {
      const existsResult = await this.repo.leadExists(lid);
      if (!existsResult.ok) throw new Error(existsResult.error.message);
      if (!existsResult.data) throw new NotFoundException(`Lead #${lid} topilmadi`);
      await this.repo.deleteLead(lid);
      return { ok: true, deleted: lid };
    });
  }
}
