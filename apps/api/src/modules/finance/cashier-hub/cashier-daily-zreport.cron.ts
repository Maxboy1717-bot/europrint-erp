/**
 * @module cashier-daily-zreport.cron
 * @description Vizyon A7 (OMBOR-KASSIR-INTERVYU §17): "Kassir kunlik PDF — kun oxirida
 *   avto-generatsiya → Telegram + ERP → xodim ko'radi (qabul qilganini belgilaydi)".
 *
 *   Har kun 20:00 Asia/Tashkent: bugun ochilgan har bir kassir smenasi uchun
 *   CashierHubPdfService.generateDailyCashReport PDF quriladi (ochiq smena = X-holat,
 *   yopiq smena = to'liq Z), `cashier_shifts.pdf_data` (BYTEA — employee_monthly_cards
 *   naqshi) ga saqlanadi va MAVJUD notification-infra (CreateNotificationCommand →
 *   in_app + telegram kanallari) orqali kassir + CFO + direktor rollariga yuboriladi
 *   (master-reja 2.17 — 2026-07-03: direktor fan-out qo'shildi).
 *   Qabul-belgisi = notifications.is_read (yangi jadval YO'Q — direktiva sharti).
 *
 *   Idempotent: pdf_generated_at guard (repo.listShiftsForZReport) — qayta ishga
 *   tushirilganda bugun allaqachon PDF olgan smena qayta yuborilmaydi.
 * @layer Cron (Finance / Cashier-hub)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { TashkentTimeService } from '@common/time';
import { CreateNotificationCommand } from '../../notifications/application/commands/create-notification.command';
import { CashierHubService } from './cashier-hub.service';
import { CashierHubPdfService } from './cashier-hub-pdf.service';
import { CASHIER_HUB_REPO, type ICashierHubRepository } from './i-cashier-hub.repo';

/**
 * Z-report notification fan-out targets besides the shift's own cashier
 * (vizyon A7 + master-reja 2.17: "kassir + CFO" + direktorga ham).
 * NOTE: live `users.role` enum today = director/employee/manager/super_admin — 'cashier'/'cfo'/
 * 'finance_manager' match no current rows (reserved for future role additions, kept per Q-46:
 * not this task's scope to remove). 'director' is the live role that actually resolves.
 */
const ZREPORT_NOTIFY_ROLES = ['cashier', 'cfo', 'finance_manager', 'director'];

@Injectable()
export class CashierDailyZReportCron {
  private readonly logger = new Logger(CashierDailyZReportCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    @Inject(CASHIER_HUB_REPO) private readonly repo: ICashierHubRepository,
    private readonly hub: CashierHubService,
    private readonly pdf: CashierHubPdfService,
    private readonly commandBus: CommandBus,
  ) {}

  // Vizyon A7 — kun oxirida avto-generatsiya (20:00 Toshkent).
  @Cron('0 20 * * *', { timeZone: 'Asia/Tashkent' })
  async run(): Promise<void> {
    const dayStart = this.time.today();
    const dateStr = this.time.formatDate(this.time.now());

    const shiftsRes = await this.repo.listShiftsForZReport(dayStart);
    if (!shiftsRes.ok) {
      this.logger.error(`Z-report cron: smenalar o'qilmadi — ${shiftsRes.error.message}`);
      return;
    }
    const shifts = Array.isArray(shiftsRes.data) ? shiftsRes.data : [];
    if (shifts.length === 0) {
      this.logger.log(`Z-report cron (${dateStr}): bugun smena yo'q — PDF yaratilmaydi (fabrikatsiya taqiq)`);
      return;
    }

    // Role-based recipients resolved once (not per shift) — no N+1 on users.
    const roleUsersRes = await this.repo.findUserIdsByRoles(ZREPORT_NOTIFY_ROLES);
    const roleUserIds = roleUsersRes.ok && Array.isArray(roleUsersRes.data) ? roleUsersRes.data : [];

    let ok = 0;
    let failed = 0;
    let skipped = 0;
    for (const shift of shifts) {
      try {
        const payloadRes = await this.hub.getDailyReportPayload(shift.id);
        if (!payloadRes.ok) {
          this.logger.warn(`Z-report: smena #${shift.id} payload xato — ${payloadRes.error.message}`);
          failed++;
          continue;
        }
        const payload = payloadRes.data;
        const pdfBuf = await this.pdf.generateDailyCashReport(payload);

        // Atomic claim (verify-fix 2026-07-02): saveShiftPdf WHERE-guard bilan bugungi PDF'ni
        // faqat BITTA jarayon "yutadi" — parallel jarayon (Q-44 zombie / ko'p-instans) yutqazsa
        // notification yubormaydi (A4 cronda jonli isbotlangan 7x dublikat poygasi bu yerda yopiq).
        const saved = await this.repo.saveShiftPdf(shift.id, pdfBuf, dayStart);
        if (!saved.ok) {
          this.logger.warn(`Z-report: smena #${shift.id} PDF saqlanmadi — ${saved.error.message}`);
          failed++;
          continue;
        }
        if (!saved.data) {
          this.logger.debug(`Z-report: smena #${shift.id} bugun allaqachon PDF olgan (parallel jarayon) — skip`);
          skipped++;
          continue;
        }

        // Recipients: smenaning o'z kassiri + kassir/CFO rollari (dedup).
        const recipients = new Set<number>([shift.cashierUserId, ...roleUserIds]);
        const title = `📄 Kunlik kassa Z-hisoboti — smena #${shift.id} (${dateStr})`;
        const body =
          `Kassir: ${payload.cashierName}. Kirim: ${payload.cashIn.toLocaleString('en-US')} UZS, ` +
          `chiqim: ${payload.cashOut.toLocaleString('en-US')} UZS, kutilgan qoldiq: ` +
          `${payload.expectedAmount.toLocaleString('en-US')} UZS` +
          (payload.variance !== null
            ? `, farq: ${payload.variance.toLocaleString('en-US')} UZS.`
            : ' (smena hali ochiq — X-holat).') +
          ` PDF: /api/finance/cashier/shifts/${shift.id}/pdf`;
        await Promise.allSettled(
          [...recipients].map((userId) =>
            this.commandBus.execute(
              new CreateNotificationCommand(
                String(userId), title, body, 'cashier_daily_zreport',
                String(shift.id), 'cashier_shift',
              ),
            ),
          ),
        );
        ok++;
      } catch (e) {
        this.logger.error(`Z-report: smena #${shift.id} xato — ${String(e)}`);
        failed++;
      }
    }
    this.logger.log(
      `Z-report cron (${dateStr}): ${ok} PDF yaratildi/yuborildi, ${skipped} skip (allaqachon olgan), ${failed} xato`,
    );
  }
}
