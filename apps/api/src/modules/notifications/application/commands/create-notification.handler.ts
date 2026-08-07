/**
 * @module create-notification.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CreateNotificationCommand } from './create-notification.command';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { ISmsSender, SMS_SENDER } from '../../domain/ports/i-sms-sender.port';
import { IEmailSender, EMAIL_SENDER } from '../../domain/ports/i-email-sender.port';
import { ITelegramSender, TELEGRAM_SENDER } from '../../domain/ports/i-telegram-sender.port';

export interface ExtendedCreateNotificationCommand extends CreateNotificationCommand {
  recipientEmail?: string;
  recipientPhone?: string;
  link?: string;
  channels?: Array<'telegram' | 'email' | 'sms' | 'in_app'>;
}

@Injectable()
@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationCommand> {
  private readonly logger = new Logger(CreateNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
    @Inject(TELEGRAM_SENDER) private readonly telegramService: ITelegramSender,
    @Inject(EMAIL_SENDER) private readonly emailService: IEmailSender,
    @Inject(SMS_SENDER) private readonly smsService: ISmsSender,
      ) {}

  async execute(command: CreateNotificationCommand): Promise<Result<Notification>> {
    const notification = Notification.createForUser(command.userId, command.title, command.body, command.type);

    if (command.referenceId) {
      notification.referenceId = command.referenceId;
    }
    if (command.referenceType) {
      notification.referenceType = command.referenceType;
    }
    if (command.senderId) {
      notification.senderId = command.senderId;
    }
    // Owner decision 2026-07-13 (chat) — module_code column: caller-supplied ERP module
    // vocabulary (no reliable inference from referenceType exists across current callers).
    if (command.moduleCode) {
      notification.moduleCode = command.moduleCode;
    }
    // Owner decision 2026-07-13 (chat) — category_code column: caller-supplied
    // notification-category taxonomy code (taxonomy_entries.code, category='notification_category').
    if (command.categoryCode) {
      notification.categoryCode = command.categoryCode;
    }

    const ext = command as ExtendedCreateNotificationCommand;
    const channels = ext.channels ?? ['telegram', 'in_app'];
    // channel column: primary channel attempted for this notification — first entry of the
    // resolved channels list, i.e. the same list the per-channel delivery loop below iterates.
    notification.channel = channels[0] ?? 'in_app';

    const saveResult = await this.notificationRepo.save(notification);

    if (!saveResult.ok) {
      this.logger.error('Failed to create notification');
      return saveResult;
    }

    const deliveries: Promise<void>[] = [];
    // Collects "<channel>: <reason>" for every outbound channel that did not deliver, so the
    // stored status reflects what actually happened instead of assuming success.
    const failed: string[] = [];

    // 18-notif — KRITIK BUG (2026-07-11 topildi): bu yergacha command.userId
    // (ichki users.id) TO'G'RIDAN-TO'G'RI Telegram chat_id sifatida yuborilardi
    // — Telegram API buni HAR DOIM rad etardi (haqiqiy chat_id emas), xato esa
    // .catch() ichida jimgina yutilardi. Bir keyingi tuzatish `users.telegram_chat_id`
    // ustunini qidira boshladi, lekin bu ustun HECH QACHON to'ldirilmaydi — real
    // manba `employees.telegram_chat_id` (Telegram HR-bot /start bog'lash oqimi;
    // bir xil naqsh telegram-auth.guard.ts:85-91, hr-bot-helpers.ts:41 da ishlatiladi
    // — `employees e JOIN users u ON u.id = e.user_id WHERE e.telegram_chat_id = ...`).
    // 2026-08-03: qidiruv shu haqiqiy ustunga to'g'irlandi (COALESCE bilan
    // users.telegram_chat_id ham zaxira sifatida tekshiriladi, agar kelajakda
    // to'g'ridan-to'g'ri to'ldirilsa); topilmasa — urinilmaydi (soxta muvaffaqiyat
    // emas, Q-40).
    if (channels.includes('telegram')) {
      deliveries.push(
        (async (): Promise<void> => {
          const row = await runQuery<{ telegram_chat_id: string | null }>(sql`
            SELECT COALESCE(e.telegram_chat_id, u.telegram_chat_id::text) AS telegram_chat_id
            FROM users u
            LEFT JOIN employees e ON e.user_id = u.id
            WHERE u.id = ${command.userId}
            LIMIT 1
          `);
          const chatId = row.rows[0]?.telegram_chat_id;
          if (!chatId) {
            this.logger.log(`Telegram yuborilmadi — user ${command.userId} chat_id bog'lamagan`);
            return;
          }
          const sent = await this.telegramService.sendMessage(
            String(chatId),
            `${command.title}\n${command.body}`,
          );
          if (!sent.ok) {
            failed.push(`telegram: ${sent.error.message}`);
            this.logger.warn(`Telegram notification yuborilmadi — ${sent.error.message}`);
          }
        })().catch((err: unknown): void => {
          this.logger.warn(`Telegram chat_id qidiruvi muvaffaqiyatsiz: ${String(err)}`);
        }),
      );
    }

    if (channels.includes('email') && ext.recipientEmail) {
      deliveries.push(
        (async (): Promise<void> => {
          const sent = await this.emailService.sendNotification(
            ext.recipientEmail as string, command.title, command.body, ext.link,
          );
          if (!sent.ok) {
            failed.push(`email: ${sent.error.message}`);
            this.logger.warn(`Email notification yuborilmadi — ${sent.error.message}`);
          }
        })(),
      );
    }

    if (channels.includes('sms') && ext.recipientPhone) {
      const smsText = `${command.title}: ${command.body}`.slice(0, 160);
      deliveries.push(
        (async (): Promise<void> => {
          const sent = await this.smsService.send({ to: ext.recipientPhone as string, text: smsText });
          if (!sent.ok) {
            failed.push(`sms: ${sent.error.message}`);
            this.logger.warn(`SMS notification yuborilmadi — ${sent.error.message}`);
          }
        })(),
      );
    }

    await Promise.allSettled(deliveries);

    // Audit 2026-08-06 (Notifications): every delivery used .then(()=>{}).catch(...), but the
    // adapters return Result and never throw — so .catch() was unreachable and the Result's
    // .ok was discarded. A dead SMTP host or a rejected Telegram send looked identical to a
    // successful one, and notifications.status (added 2026-07-13 for exactly this) stayed
    // 'pending' forever. Outcomes are now inspected and written back.
    const outboundUsed = channels.some((c) => c !== 'in_app');
    if (outboundUsed) {
      const status = failed.length === 0 ? 'sent' : 'failed';
      try {
        await runQuery(sql`
          UPDATE notifications SET status = ${status} WHERE id = ${saveResult.data.id}
        `);
      } catch (e) {
        this.logger.warn(`notifications.status yangilanmadi (id=${saveResult.data.id}): ${String(e)}`);
      }
      if (failed.length > 0) {
        this.logger.warn(
          { notificationId: saveResult.data.id, failed },
          'Notification yaratildi, lekin ba\'zi kanallar yetkazmadi',
        );
      }
    }

    this.logger.log(
      { notificationId: saveResult.data.id, userId: command.userId, channels },
      'Notification created',
    );

    return saveResult;
  }
}
