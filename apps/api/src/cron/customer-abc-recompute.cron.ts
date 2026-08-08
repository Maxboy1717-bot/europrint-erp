/**
 * @module customer-abc-recompute.cron
 * @description 2.5 (MASTER-REJA-VIZYON) — customer-abc.service.ts computeAbc mantigi to'liq
 *   edi, lekin sd_customers.abc_class ni to'ldiruvchi avto-trigger yo'q edi (15/15 mijozda
 *   NULL). Kunlik cron CustomerAbcService.recompute() ni chaqiradi — bu allaqachon mavjud
 *   getAnnualRevenue (live sales_orders, last-12-month) + persistAbc (sd_customers.abc_class
 *   + abc_computed_at) zanjirini ishga tushiradi. Idempotent (qayta ishga tushirilsa ham
 *   natija bir xil bo'lguncha barqaror), fabrikatsiya yo'q (faqat live buyurtma summasidan
 *   hisoblaydi). Delegatsiya servisga (Qoida 15) — cron faqat schedule + status yozadi.
 *
 * @layer Cron (SD)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomerAbcService } from '../modules/sd/application/customer-abc.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class CustomerAbcRecomputeCron {
  private readonly logger = new Logger(CustomerAbcRecomputeCron.name);

  constructor(
    private readonly abcService: CustomerAbcService,
    private readonly cronStatus: CronStatusService,
  ) {}

  /** Har kuni 02:00 (Toshkent) — mijozlar ABC segmentatsiyasini live buyurtmalardan qayta hisoblaydi. */
  @Cron('0 2 * * *')
  async recomputeDaily(): Promise<void> {
    const jobName = 'CustomerAbcRecomputeCron';
    const r = await this.abcService.recompute();
    if (!r.ok) {
      this.logger.error(`Customer ABC kunlik recompute xato: ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    const { updated, summary } = r.data;
    this.logger.log(
      `Customer ABC kunlik recompute: updated=${updated} A=${summary.A} B=${summary.B} C=${summary.C}`,
    );
    this.cronStatus.recordSuccess(jobName);
  }
}
