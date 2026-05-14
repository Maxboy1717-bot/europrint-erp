/**
 * @module notifications.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { TelegramService } from './domain/services/telegram.service';
import { EmailNotificationService } from './domain/services/email-notification.service';
import { SmsService } from './domain/services/sms.service';
import { MarkNotificationReadHandler } from './application/commands/mark-notification-read.handler';
import { CreateNotificationHandler } from './application/commands/create-notification.handler';
import { GetNotificationsHandler } from './application/queries/get-notifications.handler';
import { ErpEventsListener } from './infrastructure/event-handlers/erp-events.listener';
import { NotificationsController } from './presentation/notifications.controller';
import { NOTIFICATION_REPO } from './domain/repositories/i-notification.repo';
import { DrizzleNotificationRepository } from './infrastructure/repositories/drizzle-notification.repo';
import { TelegramSvc } from './telegram/telegram.service';
import { DrizzleTelegramSvcRepository } from './telegram/drizzle-telegram-svc.repo';
import { TELEGRAM_SVC_REPO } from './telegram/i-telegram-svc.repo';
import { NotificationPreferencesService } from './application/notification-preferences.service';
import { NotificationPreferencesRepository } from './infrastructure/repositories/notification-preferences.repository';
import { NotificationSchemaService } from './infrastructure/notification-schema.service';
import { NotificationSchemaRepository } from './infrastructure/notification-schema.repository';

const commandHandlers = [MarkNotificationReadHandler, CreateNotificationHandler];
const eventHandlers = [ErpEventsListener];
const queryHandlers = [GetNotificationsHandler];
const services = [TelegramService, EmailNotificationService, SmsService];
const repositories = [
  {
    provide: NOTIFICATION_REPO,
    useClass: DrizzleNotificationRepository,
  },
  { provide: TELEGRAM_SVC_REPO, useClass: DrizzleTelegramSvcRepository },
];

@Module({
  imports: [CqrsModule, HttpModule],
  controllers: [NotificationsController],
  providers: [...commandHandlers, ...eventHandlers, ...queryHandlers, ...services, ...repositories, TelegramSvc, NotificationPreferencesRepository, NotificationPreferencesService, NotificationSchemaRepository, NotificationSchemaService],
  exports: [TelegramService, EmailNotificationService, SmsService, NOTIFICATION_REPO, TELEGRAM_SVC_REPO, TelegramSvc, NotificationPreferencesService],
})
export class NotificationsModule {}
