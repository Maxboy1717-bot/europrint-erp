/**
 * @module notifications.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
import { EskizSmsAdapter } from './infrastructure/external/eskiz-sms.adapter';
import { SmtpEmailAdapter } from './infrastructure/external/smtp-email.adapter';
import { TelegramBotAdapter } from './infrastructure/external/telegram-bot.adapter';
import { SMS_SENDER } from './domain/ports/i-sms-sender.port';
import { EMAIL_SENDER } from './domain/ports/i-email-sender.port';
import { TELEGRAM_SENDER } from './domain/ports/i-telegram-sender.port';
import { MarkNotificationReadHandler } from './application/commands/mark-notification-read.handler';
import { CreateNotificationHandler } from './application/commands/create-notification.handler';
import { GetNotificationsHandler } from './application/queries/get-notifications.handler';
import { MroMachineStoppedNotificationListener } from './infrastructure/event-handlers/mro-machine-stopped-notification.listener';
import { DealWonNotificationListener } from './infrastructure/event-handlers/deal-won-notification.listener';
import { OrderCreatedNotificationListener } from './infrastructure/event-handlers/order-created-notification.listener';
import { QcFailedNotificationListener } from './infrastructure/event-handlers/qc-failed-notification.listener';
import { LmsCertExpiredNotificationListener } from './infrastructure/event-handlers/lms-cert-expired-notification.listener';
import { OrphanEventsListener } from './infrastructure/event-handlers/orphan-events.listener';
import { LeaveApprovedNotificationListener } from './infrastructure/event-handlers/leave-approved-notification.listener';
import { NotificationsController } from './presentation/notifications.controller';
import { NOTIFICATION_REPO } from './domain/repositories/i-notification.repo';
import { DrizzleNotificationRepository } from './infrastructure/repositories/drizzle-notification.repo';
import { NotificationScheduleCron } from './infrastructure/notification-schedule.cron';
import { NotificationSchedulesRepository } from './infrastructure/notification-schedules.repository';
import { NotificationSchedulesController } from './presentation/notification-schedules.controller';
import { NotificationRoutingRepository } from './infrastructure/notification-routing.repository';
import { NotificationRoutingController } from './presentation/notification-routing.controller';
import { NotificationPreferencesService } from './application/notification-preferences.service';
import { NotificationPreferencesRepository } from './infrastructure/repositories/notification-preferences.repository';
import { NotificationSchemaService } from './infrastructure/notification-schema.service';
import { NotificationSchemaRepository } from './infrastructure/notification-schema.repository';

const commandHandlers = [MarkNotificationReadHandler, CreateNotificationHandler];
const eventHandlers = [
  MroMachineStoppedNotificationListener,
  // Wave 4 (pilot) — canonical @EventsHandler(EventClass) replacements for the
  // legacy ErpEventsListener @OnEvent handlers (now deprecated).
  DealWonNotificationListener,
  OrderCreatedNotificationListener,
  QcFailedNotificationListener,
  LmsCertExpiredNotificationListener,
  // Orphan @OnEvent handlers — kanban, absence-block, access/IoT events.
  OrphanEventsListener,
  // HR LeaveApprovedEvent (EventEmitter2 bus) -> in-app notification for the requester.
  LeaveApprovedNotificationListener,
];
const queryHandlers = [GetNotificationsHandler];

// Port → adapter wiring. Consumers depend on the port tokens
// (SMS_SENDER / EMAIL_SENDER / TELEGRAM_SENDER) and the DI container
// resolves them to the adapter singletons via useExisting.
const senders = [
  EskizSmsAdapter,
  SmtpEmailAdapter,
  TelegramBotAdapter,
  { provide: SMS_SENDER,      useExisting: EskizSmsAdapter },
  { provide: EMAIL_SENDER,    useExisting: SmtpEmailAdapter },
  { provide: TELEGRAM_SENDER, useExisting: TelegramBotAdapter },
];

const repositories = [
  {
    provide: NOTIFICATION_REPO,
    useClass: DrizzleNotificationRepository,
  },
];

@Module({
  imports: [CqrsModule, HttpModule],
  controllers: [NotificationsController, NotificationSchedulesController, NotificationRoutingController],
  providers: [...commandHandlers, ...eventHandlers, ...queryHandlers, ...senders, ...repositories, NotificationPreferencesRepository, NotificationPreferencesService, NotificationSchemaRepository, NotificationSchemaService, NotificationScheduleCron, NotificationSchedulesRepository, NotificationRoutingRepository],
  exports: [
    EskizSmsAdapter,
    SmtpEmailAdapter,
    TelegramBotAdapter,
    SMS_SENDER,
    EMAIL_SENDER,
    TELEGRAM_SENDER,
    NOTIFICATION_REPO,
    NotificationPreferencesService,
    NotificationRoutingRepository,
  ],
})
export class NotificationsModule {}
