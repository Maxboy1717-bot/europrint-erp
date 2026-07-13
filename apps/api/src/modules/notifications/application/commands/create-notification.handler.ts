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

    // 18-notif — KRITIK BUG (2026-07-11 topildi): bu yergacha command.userId
    // (ichki users.id) TO'G'RIDAN-TO'G'RI Telegram chat_id sifatida yuborilardi
    // — Telegram API buni HAR DOIM rad etardi (haqiqiy chat_id emas), xato esa
    // .catch() ichida jimgina yutilardi. Endi haqiqiy users.telegram_chat_id
    // avval qidiriladi; topilmasa — urinilmaydi (soxta muvaffaqiyat emas, Q-40).
    if (channels.includes('telegram')) {
      deliveries.push(
        (async (): Promise<void> => {
          const row = await runQuery<{ telegram_chat_id: number | null }>(sql`
            SELECT telegram_chat_id FROM users WHERE id = ${command.userId} LIMIT 1
          `);
          const chatId = row.rows[0]?.telegram_chat_id;
          if (!chatId) {
            this.logger.log(`Telegram yuborilmadi — user ${command.userId} chat_id bog'lamagan`);
            return;
          }
          await this.telegramService
            .sendMessage(String(chatId), `${command.title}\n${command.body}`)
            .then((): void => { /* void */ })
            .catch((): void => {
              this.logger.warn('Telegram notification yuborilmadi');
            });
        })(),
      );
    }

    if (channels.includes('email') && ext.recipientEmail) {
      deliveries.push(
        this.emailService
          .sendNotification(ext.recipientEmail, command.title, command.body, ext.link)
          .then((): void => { /* void */ })
          .catch((): void => {
            this.logger.warn('Email notification yuborilmadi');
          }),
      );
    }

    if (channels.includes('sms') && ext.recipientPhone) {
      const smsText = `${command.title}: ${command.body}`.slice(0, 160);
      deliveries.push(
        this.smsService.send({ to: ext.recipientPhone, text: smsText }).then((): void => { /* void */ }).catch((): void => {
          this.logger.warn('SMS notification yuborilmadi');
        }),
      );
    }

    await Promise.allSettled(deliveries);

    this.logger.log(
      { notificationId: saveResult.data.id, userId: command.userId, channels },
      'Notification created',
    );

    return saveResult;
  }
}
