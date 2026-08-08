/**
 * @module count-accuracy-alert.cron
 * @description Ombor / Inventarizatsiya — sanoq aniqlik% (<95%) darhol signali.
 *   Vizyon (docs/vision/_parts/10-warehouse.md #28): "Aniqlik% trend Direktor dashboardida,
 *   <95% darhol signal" ('<95% CC+Telegram, KPI kartaga'; "Haftalik digest kutilmaydi").
 *   Aniqlik% KPI (#12) allaqachon `GET /wms/inventory-counts/accuracy` orqali Direktor
 *   dashboardiga chiqadi; YETISHMAYOTGAN qism = avto <95% signal. Bu cron shu bo'shliqni
 *   yopadi: har kuni jami aniqlikni tekshiradi va 95% dan pastga tushsa Direktorga
 *   (RBAC marshrut) bildirishnoma yozadi.
 *
 *   Chegara 95% = VIZYON-BERILGAN (owner-config EMAS). Marshrut: notification_routing_rules
 *   event_type='wms.count_accuracy_low' bo'lsa o'sha; aks holda fallback rol 'director'
 *   (resolveUserIds — genuine RBAC: SELECT id FROM users WHERE role IN (...), org head_user_id EMAS).
 *
 *   Dedup: bir kunda bir marta (NOT EXISTS created_at >= CURRENT_DATE) — cron qayta ishga
 *   tushsa ham takroriy qator yozilmaydi (idempotent).
 *
 * NOTE: Raw SQL bildirishnoma yozuvi — cron-qatlam patterni (rasporyazhenie-escalation.cron.ts
 *   bilan bir xil; ARCHITECTURE_RULES.md Rule 4). Aniqlik O'QISH esa service→repo orqali
 *   (WmsCountsService.getCountAccuracy).
 * @layer Cron (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { WmsCountsService } from '../../application/wms-counts.service';
import { NotificationRoutingRepository } from '../../../notifications/infrastructure/notification-routing.repository';

/** Vizyon 10-warehouse #28 — aniqlik chegarasi (owner-config EMAS, vizyon-berilgan). */
const ACCURACY_THRESHOLD_PCT = 95;
/** notification_routing_rules.event_type — sozlanmasa fallback rolga qaytadi. */
const EVENT_TYPE = 'wms.count_accuracy_low';
/** Marshrut sozlanmagan bo'lsa — Direktor roli (vizyon: "<95% ... Direktor dashboardida"). */
const FALLBACK_ROLE = 'director';

@Injectable()
export class CountAccuracyAlertCron {
  private readonly logger = new Logger(CountAccuracyAlertCron.name);

  constructor(
    private readonly counts: WmsCountsService,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /**
   * Har kuni 08:00 — yakunlangan (completed/approved) inventarizatsiyalar bo'yicha jami
   * aniqlik% ni tekshiradi; jami pozitsiya > 0 va aniqlik < 95% bo'lsa Direktorga
   * signal-bildirishnoma yuboradi. (06:00 cycle-count generatoridan keyin.)
   */
  @Cron('0 8 * * *')
  async checkCountAccuracy(): Promise<void> {
    try {
      const r = await this.counts.getCountAccuracy();
      if (!r.ok) {
        this.logger.error('getCountAccuracy: [%s] %s', r.error.code, r.error.message);
        return;
      }
      const row = Array.isArray(r.data) ? r.data[0] : undefined;
      if (!row) return;
      const total = Number(row.total_positions);
      const pct = Number(row.accuracy_pct);
      // Jami 0 → hali sanoq yo'q (signal yo'q); aniqlik >= 95% → me'yorda.
      if (!(total > 0) || !(pct < ACCURACY_THRESHOLD_PCT)) return;

      const idsR = await this.routing.resolveUserIds(EVENT_TYPE, FALLBACK_ROLE);
      const userIds = idsR.ok ? idsR.data : [];
      if (userIds.length === 0) {
        this.logger.warn(`Aniqlik ${pct}% < ${ACCURACY_THRESHOLD_PCT}% — lekin marshrutda foydalanuvchi yo'q`);
        return;
      }

      const title = `Ombor aniqlik% ${ACCURACY_THRESHOLD_PCT}% dan past`;
      const body = `Inventarizatsiya aniqligi ${pct}% (chegara ${ACCURACY_THRESHOLD_PCT}%). Zudlik bilan tekshiring.`;
      let sent = 0;
      for (const uid of userIds) {
        sent += await this.notify(uid, title, body);
      }
      if (sent > 0) {
        this.logger.warn(`Aniqlik signali: ${pct}% < ${ACCURACY_THRESHOLD_PCT}% — ${sent} bildirishnoma yuborildi`);
      }
    } catch (e) {
      this.logger.error(`checkCountAccuracy: ${(e as Error).message}`);
    }
  }

  /**
   * Bitta foydalanuvchiga signal yozadi. Bir kunda bir marta (NOT EXISTS created_at >= CURRENT_DATE)
   * — cron takror ishga tushsa dublikat bo'lmaydi. notifications NOT NULL: user_id/type/title/body.
   * Qaytaradi: yozilgan qatorlar soni (0 = bugun allaqachon yuborilgan → deduped).
   */
  private async notify(userId: number, title: string, body: string): Promise<number> {
    const r = await runQuery<{ id: number }>(sql`
      INSERT INTO notifications
        (user_id, type, title, body, is_read, reference_type, priority, created_at)
      SELECT ${userId}, 'wms_count_accuracy_low', ${title}, ${body}, false, 'wms_count_accuracy', 'high', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = ${userId} AND type = 'wms_count_accuracy_low' AND created_at >= CURRENT_DATE
      )
      RETURNING id
    `);
    return r.rows.length;
  }
}
