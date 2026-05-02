import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { CreateNotificationCommand } from './create-notification.command';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { TelegramService } from '../../domain/services/telegram.service';
import { EmailNotificationService } from '../../domain/services/email-notification.service';
import { SmsService } from '../../domain/services/sms.service';

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
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailNotificationService,
    private readonly smsService: SmsService,
      ) {}

  async execute(command: CreateNotificationCommand): Promise<Result<Notification>> {
    const notification = Notification.createForUser(command.userId, command.title, command.body, command.type);

    if (command.referenceId) {
      notification.referenceId = command.referenceId;
    }
    if (command.referenceType) {
      notification.referenceType = command.referenceType;
    }

    const saveResult = await this.notificationRepo.save(notification);

    if (!saveResult.ok) {
      this.logger.error('Failed to create notification');
      return saveResult;
    }

    const ext = command as ExtendedCreateNotificationCommand;
    const channels = ext.channels ?? ['telegram', 'in_app'];

    const deliveries: Promise<void>[] = [];

    if (channels.includes('telegram')) {
      deliveries.push(
        this.telegramService
          .sendMessage(command.userId, `${command.title}\n${command.body}`)
          .then((): void => { /* void */ })
          .catch((): void => {
            this.logger.warn('Telegram notification yuborilmadi');
          }),
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
        this.smsService.send(ext.recipientPhone, smsText).then((): void => { /* void */ }).catch((): void => {
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
