/**
 * @module hr-attention-digest.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 *   Vizyon 02-hr #46 — "E'tibor talab qiluvchi xodim" haftalik HR digest.
 *   Har Dushanba 09:00 (Toshkent, Q29): 3 mezon bo'yicha (reyting 7-kun 10%+ tushish,
 *   3+ kech hisobot, qisqa ta'til <3 kun) e'tibor talab qiluvchi xodimlarni topib
 *   HR menejerlariga Telegram digest yuboradi. Bo'sh bo'lsa → "muammo yo'q" xabari.
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../telegram/telegram.service';
import { CronStatusService } from './cron-status.service';
import { AbsenceBlockRepository } from './repositories/absence-block.repository';
import {
  HrAttentionDigestRepository,
  AttentionEmployeeRow,
} from './repositories/hr-attention-digest.repository';
import { extractDrizzleError } from '@common/utils/drizzle-error.util';

// Vizyon 02-hr #46 mezonlari (kriteriya) — nomlangan (hardcode emas).
const RATING_DROP_FRACTION  = 0.10; // reyting 7-kun ichida 10%+ tushishi
const LATE_REPORT_THRESHOLD = 3;    // 3+ kech kunlik hisobot
const SHORT_LEAVE_DAYS      = 3;    // ta'til < 3 kun
const DIGEST_WINDOW_DAYS    = 7;    // 7-kunlik (haftalik) oyna

const REASON_LABEL_UZ: Record<string, string> = {
  rating_drop:  'reyting 10%+ tushdi',
  late_reports: '3+ kech hisobot',
  short_leave:  "qisqa ta'til (<3 kun)",
};

@Injectable()
export class HrAttentionDigestCron {
  private readonly logger = new Logger(HrAttentionDigestCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    @Optional() private readonly telegram: TelegramService,
    private readonly cronStatus: CronStatusService,
    private readonly digestRepo: HrAttentionDigestRepository,
    private readonly absenceRepo: AbsenceBlockRepository,
    private readonly events: EventEmitter2,
  ) {}

  // Har Dushanba 09:00 (Q29 — dushanba digest)
  @Cron('0 9 * * 1')
  async sendWeeklyDigest(): Promise<void> {
    const jobName = 'HrAttentionDigestCron';
    try {
      const employeesRes = await this.digestRepo.findAttentionNeededEmployees({
        ratingDropFraction:  RATING_DROP_FRACTION,
        lateReportThreshold: LATE_REPORT_THRESHOLD,
        shortLeaveDays:      SHORT_LEAVE_DAYS,
        windowDays:          DIGEST_WINDOW_DAYS,
      });
      const employees = Array.isArray(employeesRes) ? employeesRes : [];

      const recipientsRes = await this.absenceRepo.findHrManagersWithTelegram();
      const recipients = Array.isArray(recipientsRes) ? recipientsRes : [];

      const message = this._buildMessage(employees);

      let sent = 0;
      for (const hr of recipients) {
        if (this.telegram && hr.telegram_chat_id) {
          await this.telegram
            .sendMessage(hr.telegram_chat_id, message)
            .then(() => { sent++; })
            .catch((e) => this.logger.warn(`HrAttentionDigestCron HR notify: ${String(e)}`));
        }
      }
      if (recipients.length === 0) {
        this.logger.warn('HrAttentionDigestCron: no HR managers with Telegram');
      }

      this.events.emit('hr.attention.digest.generated', {
        count: employees.length,
        employee_ids: employees.map(e => e.employee_id),
        recipients: recipients.length,
      });

      this.logger.log(
        `HrAttentionDigestCron: flagged=${employees.length} recipients=${recipients.length} sent=${sent}`,
      );
      this.cronStatus.recordSuccess(jobName);
    } catch (err) {
      const detail = extractDrizzleError(err);
      this.logger.error('HrAttentionDigestCron error: %s', detail);
      this.cronStatus.recordFailure(jobName, detail);
    }
  }

  private _buildMessage(employees: AttentionEmployeeRow[]): string {
    const list = Array.isArray(employees) ? employees : [];
    const today = this.time
      .now()
      .toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

    if (list.length === 0) {
      // Vizyon #46 — bo'sh holat: "muammo yo'q"
      return (
        `✅ <b>HR Haftalik Digest</b>\n` +
        `Sana: ${today}\n\n` +
        `E'tibor talab qiluvchi xodim yo'q — muammo yo'q.`
      );
    }

    const lines = list.map((e) => {
      const reasons = e.reasons
        .split(',')
        .filter(r => r.length > 0)
        .map(r => REASON_LABEL_UZ[r] ?? r)
        .join(', ');
      const dept = e.department_name ?? "bo'lim noma'lum";
      return `• ${e.first_name} ${e.last_name} (${dept}) — ${reasons}`;
    });

    return (
      `⚠️ <b>HR Haftalik Digest</b>\n` +
      `Sana: ${today}\n\n` +
      `<b>${list.length} xodim</b> e'tibor talab qiladi:\n\n` +
      `${lines.join('\n')}`
    );
  }
}
