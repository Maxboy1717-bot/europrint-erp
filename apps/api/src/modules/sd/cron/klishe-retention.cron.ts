/**
 * @module klishe-retention.cron
 * @description Klishe/forma ~3 yil saqlash muddati cron'i (vision 06-sd#14).
 *
 *   Har kuni 06:00 (Toshkent):
 *     1) qabul qilingan lekin `retention_until` to'ldirilmagan formalarga
 *        muddatni yozadi (received_at + ~3 yil = 1095 kun);
 *     2) muddat tugashiga <=90 kun qolgan/o'tgan (hali hisobdan chiqarilmagan)
 *        formalar sonini ogohlantirish sifatida loglaydi.
 *
 *   Cron HECH QACHON avtomatik hisobdan chiqarmaydi — write-off aktini inson
 *   (POST /sd/klishe-retention/:moldId/write-off) imzolaydi. Bu faqat ogohlantiradi.
 *
 * @layer Cron (SD)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isErr } from '@common/result';
import {
  KlisheRetentionService, KLISHE_RETENTION_DAYS, KLISHE_RETENTION_WARN_DAYS,
} from '../application/klishe-retention.service';

@Injectable()
export class KlisheRetentionCron {
  private readonly logger = new Logger(KlisheRetentionCron.name);

  constructor(private readonly svc: KlisheRetentionService) {}

  @Cron('0 6 * * *', { timeZone: 'Asia/Tashkent' })
  async sweepRetention(): Promise<void> {
    const backfill = await this.svc.backfillRetention(KLISHE_RETENTION_DAYS);
    if (isErr(backfill)) {
      this.logger.error(`Klishe-saqlash: retention_until backfill xatosi — ${backfill.error.message}`);
      return;
    }
    if (backfill.data.updated > 0) {
      this.logger.log(`Klishe-saqlash: ${backfill.data.updated} ta formaga saqlash muddati (~3 yil) yozildi`);
    }

    const due = await this.svc.listDue(KLISHE_RETENTION_WARN_DAYS);
    if (isErr(due)) {
      this.logger.error(`Klishe-saqlash: due-ro'yxat xatosi — ${due.error.message}`);
      return;
    }
    const rows = Array.isArray(due.data) ? due.data : [];
    if (rows.length > 0) {
      this.logger.warn(
        `Klishe-saqlash: ${rows.length} ta forma ~3 yil muddatiga yaqin/o'tgan — hisobdan chiqarish akti kerak`,
      );
    }
  }
}
