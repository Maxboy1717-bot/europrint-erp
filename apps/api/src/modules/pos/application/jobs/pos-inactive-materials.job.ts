/**
 * @module pos-inactive-materials.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PosReportsService } from '../services/pos-reports.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
import { PosTelegramService } from '../services/pos-telegram.service';
import { PosEventRepository } from '../../infrastructure/repositories/pos-event.repository';

/** Haftalik: 90+ kundan beri harakatsiz materiallarni topish va bildirish */
@Injectable()
export class PosInactiveMaterialsJob {
  private readonly logger = new Logger(PosInactiveMaterialsJob.name);

  constructor(
    private readonly reportsService:   PosReportsService,
    private readonly notifications:    PosNotificationsService,
    private readonly telegram:         PosTelegramService,
    private readonly eventRepo:        PosEventRepository,
  ) {}

  /** Har yakshanba kechki 22:00 da ishlaydi */
  @Cron('0 22 * * 0')
  async checkInactiveMaterials(): Promise<void> {
    this.logger.log('[InactiveMaterials] Haftalik harakatsiz materiallar tekshiruvi boshlanmoqda...');
    try {
      const r = await this.reportsService.getInactiveMaterials(90);
      if (!r.ok) { this.logger.error(`Inactive materials query failed: ${r.error}`); return; }

      const items = r.data as Array<{ material_card_id: number; material_name: string; qty_on_hand: number; days_inactive: number }>;
      if (items.length === 0) {
        this.logger.log('[InactiveMaterials] Harakatsiz material topilmadi.');
        return;
      }

      this.logger.warn(`[InactiveMaterials] ${items.length} ta material 90+ kundan beri harakatsiz`);

      const managers = await this.eventRepo.findByRoles(['pos_manager', 'warehouse_manager']);
      for (const mgr of managers) {
        await this.notifications.createNotification({
          type: 'INACTIVE_STOCK_ALERT',
          title: 'Harakatsiz materiallar',
          body: `${items.length} ta material 90+ kundan beri harakatsiz. ABC tahlil hisobotini ko'ring.`,
          targetRole: 'pos_manager',
        }).catch(() => null);
      }

      const topItems = items.slice(0, 5)
        .map(i => `${i.material_name}: ${i.qty_on_hand} dona (${i.days_inactive} kun)`)
        .join('\n');

      await this.telegram.sendAlert({
        title: `📦 ${items.length} ta harakatsiz material`,
        body: `90+ kundan beri harakatsiz:\n${topItems}`,
        severity: 'info',
      }).catch(() => null);

    } catch (err: unknown) {
      this.logger.error('[InactiveMaterials] Job xatosi:', err);
    }
  }
}
