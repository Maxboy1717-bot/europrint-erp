/**
 * @module gtd-flag.service
 * @description Vision 10-warehouse#10 — GTD (bojxona) yetishmovchilik bayrog'i + 14-kunlik
 *   eskalatsiya orkestratsiyasi. Qabulni BLOKLAMAYDI: import qabulida GTD talab belgilanadi
 *   (receipt_date + WMS_GTD_ESCALATION_DAYS), raqam kiritilmasa muddatdan keyin Klassifikatsiya
 *   + Moliyaga bir marta bildirishnoma yuboriladi. Nishon (kimga) CONFIG-DRIVEN —
 *   NotificationRoutingRepository.resolveUserIds(event_type, fallback_role); qator bo'lmasa
 *   fallback rolga qaytadi (regressiya yo'q, Q-39). Result<T> qaytaradi; raw throw yo'q (Qoida 1).
 */
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Ok, Err, AppErr, Result } from '@common/result';
import { GtdFlagRepository, OverdueMissingGtdRow } from '../infrastructure/repositories/gtd-flag.repository';
import { NotificationRoutingRepository } from '@modules/notifications/infrastructure/notification-routing.repository';
import { WMS_GTD_ESCALATION_DAYS } from '@common/constants/business.constants';

// GTD-yetishmovchilik nishonlari — vizyon "Klassifikatsiya + Moliya". CONFIG-DRIVEN;
// jonli rol yo'q bo'lsa fallback = 'manager' (mavjud rollar: director/manager/employee/super_admin).
const GTD_TARGETS = [
  { eventType: 'wms.gtd_missing.classification', fallbackRole: 'manager' },
  { eventType: 'wms.gtd_missing.finance',        fallbackRole: 'manager' },
];

@Injectable()
export class GtdFlagService {
  private readonly logger = new Logger(GtdFlagService.name);

  constructor(
    private readonly repo: GtdFlagRepository,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /** Import qabulini "GTD talab qilinadi" deb belgilaydi (14-kunlik eskalatsiya soatini boshlaydi). */
  async markRequired(receiptId: number): Promise<Result<{ id: number; gtd_due_date: string }>> {
    if (!Number.isInteger(receiptId) || receiptId <= 0) return Err(AppErr('VALIDATION', 'receiptId noto\'g\'ri'));
    try {
      const row = await this.repo.markRequired(receiptId, WMS_GTD_ESCALATION_DAYS);
      if (!row) return Err(AppErr('NOT_FOUND', 'Qabul topilmadi yoki GTD talab allaqachon belgilangan'));
      return Ok(row);
    } catch (e) {
      return Err(AppErr('DB_ERROR', (e as Error).message));
    }
  }

  /** GTD raqamini yozadi — gtd_missing (generated) avtomatik false bo'ladi. */
  async setNumber(receiptId: number, gtdNumber: string): Promise<Result<{ id: number; gtd_number: string; gtd_missing: boolean }>> {
    if (!Number.isInteger(receiptId) || receiptId <= 0) return Err(AppErr('VALIDATION', 'receiptId noto\'g\'ri'));
    try {
      const row = await this.repo.setNumber(receiptId, gtdNumber);
      if (!row) return Err(AppErr('NOT_FOUND', 'Qabul topilmadi'));
      return Ok(row);
    } catch (e) {
      return Err(AppErr('DB_ERROR', (e as Error).message));
    }
  }

  /** Muddati o'tgan GTD-yetishmovchiliklar ro'yxati (ogohlantirish yuzasi). */
  async listMissing(): Promise<Result<OverdueMissingGtdRow[]>> {
    try {
      return Ok(await this.repo.findOverdueMissing());
    } catch (e) {
      return Err(AppErr('DB_ERROR', (e as Error).message));
    }
  }

  /**
   * Cron chaqiradi — muddati o'tgan GTD-yetishmovchiliklarni Klassifikatsiya + Moliyaga eskalatsiya
   * qiladi (qabul bo'yicha bir marta; repo NOT EXISTS dedup). Qabulni BLOKLAMAYDI.
   */
  async escalateOverdue(): Promise<Result<{ escalated: number; notified: number }>> {
    return safeCall(async () => {
      const rows = await this.repo.findOverdueMissing();
      let escalated = 0;
      let notified = 0;

      // Nishon foydalanuvchilar (Klassifikatsiya + Moliya) — bir marta hal qilinadi (config-driven).
      const targetUsers = new Set<number>();
      for (const t of GTD_TARGETS) {
        const usersR = await this.routing.resolveUserIds(t.eventType, t.fallbackRole);
        if (usersR.ok) for (const uid of usersR.data) targetUsers.add(uid);
      }
      if (targetUsers.size === 0) return { escalated, notified };

      for (const row of Array.isArray(rows) ? rows : []) {
        if (row.already_notified) continue;
        const title = `GTD (bojxona) yetishmayapti — ${row.receipt_number}`;
        const body =
          `${row.receipt_number}: bojxona yuk deklaratsiyasi (GTD) ${row.days_overdue} kundan beri kiritilmagan ` +
          `(muddat: ${row.gtd_due_date}). Klassifikatsiya + Moliya tekshirsin (qabul bloklanmaydi).`;

        let firedForReceipt = false;
        for (const uid of targetUsers) {
          const ok = await this.repo.insertEscalationNotification(uid, row.id, title, body, 'high');
          if (ok) { notified += 1; firedForReceipt = true; }
        }
        if (firedForReceipt) {
          escalated += 1;
          this.logger.log(`GTD eskalatsiya: qabul ${row.receipt_number} → ${targetUsers.size} nishon (${row.days_overdue} kun)`);
        }
      }

      return { escalated, notified };
    });
  }
}
