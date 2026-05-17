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
import { ChatController, ChatUploadsController, ChatReactionsController } from './chat.controller';
import { ChatAdvancedController, ChatAdvancedUploadsController } from './chat-advanced.controller';
import { ChatExtController } from './chat-ext.controller';
import { PushService } from './push.service';
import { UploadService } from './upload.service';
import { VideoTokenService } from './video-token.service';
import { TelegramBotsModule } from '../hr/telegram-bots/telegram-bots.module';

@Module({
  imports: [
    TelegramBotsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: (cfg.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '24h') as SignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [
    ChatController,
    ChatUploadsController,
    ChatReactionsController,
    ChatAdvancedController,
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
    UploadService,
    VideoTokenService,
  ],
  exports: [ChatService, ChatGateway, PushService, UploadService],
})
export class ChatModule {}
