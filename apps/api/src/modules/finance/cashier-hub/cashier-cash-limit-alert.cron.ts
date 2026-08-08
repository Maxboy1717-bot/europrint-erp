/**
 * @module cashier-cash-limit-alert.cron
 * @description EP-FIN-072 (docs/audit/decisions/03-finance.md:517 — "kassa limiti + oshsa
 *   inkassatsiya eslatmasi (CRON)"): har soatda (ish vaqtida) BARCHA ochiq kassir smenalarini
 *   tekshiradi — agar joriy qoldiq (drawer balance) kunlik naqd-limitdan (per-shift override →
 *   global cfo_config default) oshsa, kassir + moliya rollariga bankka inkassatsiya (naqd
 *   topshirish) haqida eslatma notification yuboradi.
 *
 *   Bu — CASHIER-HUB KAS-1'da ALLAQACHON mavjud limit-hisoblash mexanizmini (getShiftLedger →
 *   dailyCashLimit/limitExceeded, cashier-hub.service.ts) qayta ISHLATADI (Q-46 — reuse, dublikat
 *   hisoblash yo'q); yangi narsa faqat CRON + notification fan-out qatlami.
 *
 *   Idempotent: bir smena bir kun ichida faqat bitta eslatma oladi (`cashier_shifts.limit_alert_sent_at`
 *   guard — atomic WHERE-update claim, xuddi Z-report pdf_generated_at naqshi bilan bir xil —
 *   parallel/qayta-ishga-tushirilgan cron ikkilamchi xabar yubormaydi). Smena yopilganda yoki
 *   yangi kun boshlanganda flag qayta hisoblanadi (yangi smena — yangi qator, flag NULL).
 *
 *   FABRIKATSIYA YO'Q (Q-40): limit sozlanmagan (dailyCashLimit=null) → hech narsa yuborilmaydi
 *   (limitExceeded har doim false shu holatda — getShiftLedger allaqachon shu qoidani qo'llaydi).
 * @layer Cron (Finance / Cashier-hub)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { TashkentTimeService } from '@common/time';
import { CreateNotificationCommand } from '../../notifications/application/commands/create-notification.command';
import { CashierHubService } from './cashier-hub.service';
import { CASHIER_HUB_REPO, type ICashierHubRepository } from './i-cashier-hub.repo';

/** Notification fan-out targets besides the shift's own cashier (EP-FIN-072: naqd-nazorat = moliya masalasi ham). */
const CASH_LIMIT_NOTIFY_ROLES = ['cashier', 'cfo', 'finance_manager', 'director'];

@Injectable()
export class CashierCashLimitAlertCron {
  private readonly logger = new Logger(CashierCashLimitAlertCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    @Inject(CASHIER_HUB_REPO) private readonly repo: ICashierHubRepository,
    private readonly hub: CashierHubService,
    private readonly commandBus: CommandBus,
  ) {}

  // Ish vaqtida har soat boshida tekshiradi (Asia/Tashkent) — kassa limiti kun davomida
  // istalgan vaqt oshishi mumkin, kunlik Z-reportdan farqli o'laroq bu tezkor ogohlantirish.
  @Cron('0 * * * *', { timeZone: 'Asia/Tashkent' })
  async run(): Promise<void> {
    const dateStr = this.time.formatDate(this.time.now());

    const openShiftsRes = await this.repo.listShifts({ status: 'open', limit: 100, offset: 0 });
    if (!openShiftsRes.ok) {
      this.logger.error(`Naqd-limit cron: ochiq smenalar o'qilmadi — ${openShiftsRes.error.message}`);
      return;
    }
    const shifts = Array.isArray(openShiftsRes.data?.data) ? openShiftsRes.data.data : [];
    if (shifts.length === 0) {
      this.logger.debug(`Naqd-limit cron (${dateStr}): ochiq smena yo'q — tekshiruv shart emas`);
      return;
    }

    const roleUsersRes = await this.repo.findUserIdsByRoles(CASH_LIMIT_NOTIFY_ROLES);
    const roleUserIds = roleUsersRes.ok && Array.isArray(roleUsersRes.data) ? roleUsersRes.data : [];

    let alerted = 0;
    let skipped = 0;
    let failed = 0;
    for (const shift of shifts) {
      try {
        const ledgerRes = await this.hub.getShiftLedger(shift.id);
        if (!ledgerRes.ok) {
          this.logger.warn(`Naqd-limit cron: smena #${shift.id} ledger xato — ${ledgerRes.error.message}`);
          failed++;
          continue;
        }
        const ledger = ledgerRes.data;
        if (!ledger.limitExceeded) continue; // limit sozlanmagan yoki oshmagan — jim o'tadi

        // Atomic claim — bugun bu smena uchun eslatma allaqachon yuborilgan bo'lsa, ikkinchi marta yubormaydi.
        const claimed = await this.repo.claimCashLimitAlert(shift.id, this.time.today());
        if (!claimed.ok) {
          this.logger.warn(`Naqd-limit cron: smena #${shift.id} claim xato — ${claimed.error.message}`);
          failed++;
          continue;
        }
        if (!claimed.data) {
          skipped++; // boshqa jarayon/soatlik urinish bugun allaqachon yuborgan
          continue;
        }

        const recipients = new Set<number>([shift.cashierUserId, ...roleUserIds]);
        const title = `⚠️ Kassa naqd-limiti oshdi — smena #${shift.id}`;
        const body =
          `Joriy qoldiq: ${ledger.balance.toLocaleString('en-US')} UZS, kunlik limit: ` +
          `${(ledger.dailyCashLimit ?? 0).toLocaleString('en-US')} UZS (EP-FIN-072). ` +
          `Ortiqcha naqdni bankka inkassatsiya qilish tavsiya etiladi.`;
        await Promise.allSettled(
          [...recipients].map((userId) =>
            this.commandBus.execute(
              new CreateNotificationCommand(
                String(userId), title, body, 'cashier_cash_limit_alert',
                String(shift.id), 'cashier_shift',
              ),
            ),
          ),
        );
        alerted++;
      } catch (e) {
        this.logger.error(`Naqd-limit cron: smena #${shift.id} xato — ${String(e)}`);
        failed++;
      }
    }
    if (alerted > 0 || failed > 0) {
      this.logger.log(
        `Naqd-limit cron (${dateStr}): ${alerted} eslatma yuborildi, ${skipped} skip (bugun allaqachon), ${failed} xato`,
      );
    }
  }
}
