/**
 * @module pos-quarantine-check.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosInventoryPassportService } from '../services/pos-inventory-passport.service';
import { QuarantineWorkflowService } from '../services/quarantine-workflow.service';

@Injectable()
export class PosQuarantineCheckJob {
  private readonly logger = new Logger(PosQuarantineCheckJob.name);

  constructor(
    private readonly passportSvc: PosInventoryPassportService,
    private readonly workflowSvc: QuarantineWorkflowService,
  ) {}

  /** Har soatda muddati o'tgan karantinlarni tekshirish (default 48 soat, business_settings 'pos.quarantine_escalation_hours' orqali sozlanadi) */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredQuarantine(): Promise<void> {
    this.logger.debug('Karantin muddatlari tekshirilmoqda...');
    try {
      // 1) Passport bo'yicha tekshirish (eski)
      await this.passportSvc.checkExpiredQuarantine();
      // 2) Movement status bo'yicha — 48 soat → qc_review
      const r = await this.workflowSvc.escalateExpiredQuarantine();
      if (r.ok && r.data.moved > 0) {
        this.logger.log(`[Quarantine Cron] ${r.data.moved} ta movement avtomatik QC_REVIEW ga ko'chirildi`);
      }
    } catch (err: unknown) {
      this.logger.error('Karantin check job xatosi:', err);
    }
  }
}
