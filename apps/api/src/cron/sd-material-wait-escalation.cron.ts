/**
 * @module sd-material-wait-escalation.cron
 * @description 06-sd #2 — material-wait (Ожд.Сырьё) escalation driver (hourly).
 *   Delegates to SdMaterialWaitEscalationService (Qoida 15). Source-of-truth is the
 *   DB clock (hitl_approvals.created_at + sd_material_wait_escalations ledger), so a
 *   skipped run is harmless — the next hourly run still catches every overdue/rejected
 *   material-wait item. Mirrors the MesSosEscalationCron wiring pattern.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SdMaterialWaitEscalationService } from '../modules/sd/application/sd-material-wait-escalation.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class SdMaterialWaitEscalationCron {
  private readonly logger = new Logger(SdMaterialWaitEscalationCron.name);

  constructor(
    private readonly escalation: SdMaterialWaitEscalationService,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async escalateMaterialWait(): Promise<void> {
    const jobName = 'SdMaterialWaitEscalationCron';
    const r = await this.escalation.escalateOverdue();
    if (!r.ok) {
      this.logger.error(`❌ SdMaterialWaitEscalationCron error: ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    if (r.data.escalated > 0) {
      this.logger.log(
        `✅ SdMaterialWaitEscalationCron: ${r.data.escalated} eskalatsiya (${r.data.scanned} tekshirildi)`,
      );
    }
    this.cronStatus.recordSuccess(jobName);
  }
}
