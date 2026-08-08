/**
 * @module customer-inactivity.cron
 * @description 06-sd #27 — nightly inactive-customer cron. Runs after the 02:00
 *   ABC recompute so class thresholds (crm_inactivity_rules A=90/B=60/C=30) apply
 *   to fresh classes. Delegates to CustomerInactivityService (Qoida 15) — the cron
 *   only schedules + records status. Idempotent (Q-40: reads live sales_orders,
 *   fabricates nothing).
 *
 * @layer Cron (SD)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomerInactivityService } from '../modules/sd/application/customer-inactivity.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class CustomerInactivityCron {
  private readonly logger = new Logger(CustomerInactivityCron.name);

  constructor(
    private readonly service: CustomerInactivityService,
    private readonly cronStatus: CronStatusService,
  ) {}

  /** Har kuni 03:30 (Toshkent) — nofaol mijozlarni ABC-chegara bo'yicha belgilaydi. */
  @Cron('30 3 * * *')
  async sweepNightly(): Promise<void> {
    const jobName = 'CustomerInactivityCron';
    const r = await this.service.refresh();
    if (!r.ok) {
      this.logger.error(`Nofaol mijoz cron xato: ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    this.logger.log(`Nofaol mijoz cron: evaluated=${r.data.evaluated} flagged=${r.data.flagged}`);
    this.cronStatus.recordSuccess(jobName);
  }
}
