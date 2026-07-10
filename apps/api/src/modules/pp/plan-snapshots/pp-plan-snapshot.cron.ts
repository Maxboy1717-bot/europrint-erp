/**
 * @module pp-plan-snapshot.cron
 * @description The "shift/daily-close job" for vision 07-pp#49: once a day, just after the
 *   day-shift change (06:05 Asia/Tashkent), freeze the previous day's factory-wide PP plan%
 *   snapshot so the Director dashboard has an offline-safe daily value. Shift-level snapshots
 *   are frozen on demand via POST /pp/plan-snapshots/capture at shift close. Errors are logged,
 *   never thrown (a failed snapshot must not crash the scheduler). ScheduleModule.forRoot() is
 *   registered globally in app.module.ts, so this provider's @Cron fires without a local import.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PpPlanSnapshotsService } from './pp-plan-snapshots.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PpPlanSnapshotCron {
  private readonly logger = new Logger(PpPlanSnapshotCron.name);

  constructor(private readonly svc: PpPlanSnapshotsService) {}

  @Cron('5 6 * * *', { timeZone: 'Asia/Tashkent' })
  async captureDailyAtShiftChange(): Promise<void> {
    const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString().slice(0, 10);
    const res = await this.svc.captureSnapshot({
      periodType: 'daily',
      snapshotDate: yesterday,
      source: 'cron',
    });
    if (!res.ok) {
      this.logger.error(`Kunlik PP reja-snapshot yozilmadi (${yesterday}): ${res.error.message}`);
      return;
    }
    this.logger.log(`Kunlik PP reja-snapshot yozildi: ${yesterday} -> ${res.data.planPercent}%`);
  }
}
