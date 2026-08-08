/**
 * @module mm-reconciliation-digest.cron
 * @description Vision 11-mm #33 — oy-oxiri (month-end) sverka digest. On the 1st of each
 *   month (06:00 Asia/Tashkent) computes the PRIOR month's vendor discrepancies
 *   (schyot-faktura != qabul qilingan tovar) and notifies the finance leadership.
 *
 *   Reuses MmReconciliationService.getMonthDigest (single grouped query — no N+1) and the
 *   CQRS CreateNotificationCommand path (same as CashierCashLimitAlertCron). Recipients are
 *   ROLE-based (users.role IN finance_manager/cfo/director) — RBAC, NOT org head_user_id,
 *   so no owner-data / blocked-module touch. FABRIKATSIYA YO'Q (Q-40): when there are no
 *   discrepancies nothing is sent (only a log line).
 * @layer Cron (MM)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { TashkentTimeService } from '@common/time';
import { CreateNotificationCommand } from '../../../notifications/application/commands/create-notification.command';
import { MmReconciliationService } from '../../application/mm-reconciliation.service';
import { MM_RECONCILIATION_REPO, type IMmReconciliationRepo } from '../../domain/repositories/i-mm-reconciliation.repo';

/** Finance leadership roles that receive the month-end sverka digest (RBAC, not org head). */
const RECON_NOTIFY_ROLES = ['finance_manager', 'cfo', 'director'];

@Injectable()
export class MmReconciliationDigestCron {
  private readonly logger = new Logger(MmReconciliationDigestCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    private readonly svc: MmReconciliationService,
    @Inject(MM_RECONCILIATION_REPO) private readonly repo: IMmReconciliationRepo,
    private readonly commandBus: CommandBus,
  ) {}

  // 1st of each month at 06:00 Tashkent — digest covers the PRIOR calendar month.
  @Cron('0 6 1 * *', { timeZone: 'Asia/Tashkent' })
  async run(): Promise<void> {
    const { from, to } = this._priorMonth();

    const digestRes = await this.svc.getMonthDigest(from, to);
    if (!digestRes.ok) {
      this.logger.error(`Sverka digest cron: hisoblab bo'lmadi — ${digestRes.error.message}`);
      return;
    }
    const rows = digestRes.data.rows;
    if (rows.length === 0) {
      this.logger.log(`Sverka digest cron (${from}..${to}): nomuvofiqlik yo'q`);
      return;
    }

    const recipientsRes = await this.repo.findUserIdsByRoles(RECON_NOTIFY_ROLES);
    const recipients = recipientsRes.ok && Array.isArray(recipientsRes.data) ? recipientsRes.data : [];

    const top = rows
      .slice(0, 5)
      .map((r) => `${r.vendorName ?? 'Vendor #' + r.vendorId}: ${r.discrepancy.toLocaleString('en-US')} UZS`)
      .join('; ');
    const title = `Oy-oxiri sverka digest (${from}..${to})`;
    const body =
      `${rows.length} ta yetkazib beruvchida hisob-kitob nomuvofiqligi aniqlandi ` +
      `(schyot-faktura summasi != qabul qilingan tovar qiymati). Eng kattalari: ${top}. ` +
      `Har biri uchun sverka aktini (PDF) yuklab olish mumkin.`;

    await Promise.allSettled(
      recipients.map((uid) =>
        this.commandBus.execute(
          new CreateNotificationCommand(String(uid), title, body, 'mm_reconciliation_digest'),
        ),
      ),
    );
    this.logger.log(
      `Sverka digest cron (${from}..${to}): ${rows.length} nomuvofiqlik, ${recipients.length} qabul qiluvchiga yuborildi`,
    );
  }

  /** Prior calendar month boundaries as YYYY-MM-DD (UTC math avoids DST/local drift). */
  private _priorMonth(): { from: string; to: string } {
    const now = this.time.now();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-based current month
    const first = new Date(Date.UTC(y, m - 1, 1));
    const last = new Date(Date.UTC(y, m, 0)); // day 0 of current month = last day of prior month
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { from: fmt(first), to: fmt(last) };
  }
}
