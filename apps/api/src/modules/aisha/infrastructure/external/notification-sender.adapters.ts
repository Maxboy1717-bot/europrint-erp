/**
 * @module notification-sender.adapters
 * @description Bridges Aisha's tool-level sender interfaces onto the real notifications
 * infrastructure (SmtpEmailAdapter / TelegramBotAdapter).
 *
 * Audit 2026-08-06: SendEmailTool and SendTelegramToTeamTool each declared their own
 * `Symbol('AISHA_EMAIL_SENDER')` / `Symbol('AISHA_TELEGRAM_SENDER')` token. Those symbols are
 * a different identity from the notifications module's EMAIL_SENDER / TELEGRAM_SENDER, and
 * AishaModule never imported NotificationsModule — so the `@Optional()` injections resolved
 * to null forever. The HITL approval flow worked correctly end to end and then sent nothing.
 *
 * The two sides also disagree on shape: Aisha's tools want a plain result object, the
 * notifications ports return Result<void>. These adapters translate between them, so neither
 * side has to change.
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  EMAIL_SENDER as NOTIF_EMAIL_SENDER,
  type IEmailSender as INotifEmailSender,
} from '../../../notifications/domain/ports/i-email-sender.port';
import {
  TELEGRAM_SENDER as NOTIF_TELEGRAM_SENDER,
  type ITelegramSender as INotifTelegramSender,
} from '../../../notifications/domain/ports/i-telegram-sender.port';
import type { IEmailSender as IAishaEmailSender } from '../../application/tools/send-email.tool';
import type { ITelegramSender as IAishaTelegramSender } from '../../application/tools/send-telegram-to-team.tool';

@Injectable()
export class AishaEmailSenderAdapter implements IAishaEmailSender {
  private readonly logger = new Logger(AishaEmailSenderAdapter.name);

  constructor(
    @Optional() @Inject(NOTIF_EMAIL_SENDER) private readonly sender?: INotifEmailSender,
  ) {}

  /**
   * Aisha passes several recipients at once; the notifications port sends to one address per
   * call, so we fan out and fail if any leg fails. Throwing (rather than returning a fake
   * messageId) keeps the tool's own error path honest — Q-40.
   */
  async send(opts: { to: string[]; subject: string; body: string; attachments?: string[] }): Promise<{ messageId: string }> {
    if (!this.sender) {
      throw new Error('Email provayderi sozlanmagan (EMAIL_SENDER ulanmagan)');
    }
    const recipients = opts.to.filter((t) => t.trim().length > 0);
    if (recipients.length === 0) {
      throw new Error('Email qabul qiluvchi ko\'rsatilmagan');
    }
    // Attachments arrive as URL strings; the notifications port expects Buffers. Rather than
    // fetch and inline them, the links are appended to the body — visible to the recipient
    // instead of silently dropped.
    const body = (opts.attachments?.length ?? 0) > 0
      ? `${opts.body}\n\n---\nIlovalar:\n${opts.attachments?.join('\n')}`
      : opts.body;

    const failures: string[] = [];
    for (const to of recipients) {
      const r = await this.sender.send({ to, subject: opts.subject, html: body, text: body });
      if (!r.ok) failures.push(`${to}: ${r.error.message}`);
    }
    if (failures.length > 0) {
      this.logger.warn(`Aisha email yuborilmadi — ${failures.join('; ')}`);
      throw new Error(`Email yuborilmadi — ${failures.join('; ')}`);
    }
    return { messageId: `aisha-${Date.now()}-${recipients.length}` };
  }
}

@Injectable()
export class AishaTelegramSenderAdapter implements IAishaTelegramSender {
  private readonly logger = new Logger(AishaTelegramSenderAdapter.name);

  constructor(
    @Optional() @Inject(NOTIF_TELEGRAM_SENDER) private readonly sender?: INotifTelegramSender,
  ) {}

  async sendMessage(chatId: number | string, text: string): Promise<{ ok: boolean }> {
    if (!this.sender) {
      this.logger.warn('Telegram provayderi sozlanmagan (TELEGRAM_SENDER ulanmagan)');
      return { ok: false };
    }
    const r = await this.sender.sendMessage(String(chatId), text);
    if (!r.ok) {
      this.logger.warn(`Aisha telegram yuborilmadi (chat ${chatId}) — ${r.error.message}`);
    }
    return { ok: r.ok };
  }
}
