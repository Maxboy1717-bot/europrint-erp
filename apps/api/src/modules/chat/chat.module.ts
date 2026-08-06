/**
 * @module chat.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { ChatGateway } from './chat.gateway';
import { ChatGatewayHelperService } from './chat-gateway-helper.service';
import { ChatService } from './chat.service';
import { ChatRoomService } from './chat-room.service';
import { ChatMessageService } from './chat-message.service';
import { ChatMessageExtService } from './chat-message-ext.service';
import { ChatNotificationsService } from './chat-notifications.service';
import { ChatAdminService } from './chat-admin.service';
import { ChatNotificationRepository } from './repositories/chat-notification.repository';
import { ChatAdminRepository } from './repositories/chat-admin.repository';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { PushNotificationRepository } from './repositories/push-notification.repository';
import { ChatPresenceRepository } from './repositories/chat-presence.repository';
import { ChatController, ChatUploadsController, ChatReactionsController } from './chat.controller';
import { ChatAdvancedUploadsController } from './chat-advanced-uploads.controller';
import { ChatExtController } from './chat-ext.controller';
import { PushService } from './push.service';
import { UploadService } from './upload.service';
import { VideoTokenService } from './video-token.service';
import { ChatPresenceCleanupCron } from './chat-presence-cleanup.cron';
import { TelegramBotsModule } from '../hr/telegram-bots/telegram-bots.module';

@Module({
  imports: [
    TelegramBotsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        // C7.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): fallback aligned with auth.module.ts
        // (was '24h' here vs '15m' there) — same env var, same token, must agree on lifetime
        // when JWT_ACCESS_TOKEN_TTL is unset so a chat-issued token doesn't outlive the main
        // API's notion of "expired".
        signOptions: { expiresIn: (cfg.get<string>('JWT_ACCESS_TOKEN_TTL') ?? cfg.get<string>('JWT_EXPIRES_IN') ?? '15m') as SignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [
    ChatController,
    ChatUploadsController,
    ChatReactionsController,
    ChatAdvancedUploadsController,
    ChatExtController,
  ],
  providers: [
    ChatGateway, ChatGatewayHelperService,
    ChatService, ChatRoomService, ChatMessageService, ChatMessageExtService,
    ChatNotificationsService, ChatAdminService,
    ChatNotificationRepository, ChatAdminRepository,
    ChatRoomRepository, ChatMessageRepository,
    PushService,
    PushNotificationRepository,
    ChatPresenceRepository,
    ChatPresenceCleanupCron,
    UploadService,
    VideoTokenService,
  ],
  exports: [ChatService, ChatGateway, PushService, UploadService],
})
export class ChatModule {}
