/**
 * @module crm-settings.service
 * @description Thin application service for the manager-owned CRM vocabularies (Batch 5 Item 6).
 *   Delegates to CrmSettingsRepository; no business arithmetic (master-data only).
 */

import { Injectable } from '@nestjs/common';
import {
  CrmSettingsRepository,
  LossReasonCreate, LossReasonUpdate, StageCreate, StageUpdate,
} from './crm-settings.repo';

@Injectable()
export class CrmSettingsService {
  constructor(private readonly repo: CrmSettingsRepository) {}

  listLossReasons(includeInactive: boolean) { return this.repo.listLossReasons(includeInactive); }
  createLossReason(input: LossReasonCreate) { return this.repo.createLossReason(input); }
  updateLossReason(id: number, patch: LossReasonUpdate) { return this.repo.updateLossReason(id, patch); }

  listStages(pipelineId?: number) { return this.repo.listStages(pipelineId); }
  createStage(input: StageCreate) { return this.repo.createStage(input); }
  updateStage(id: number, patch: StageUpdate) { return this.repo.updateStage(id, patch); }
}
