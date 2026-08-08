/**
 * @module chat-uploads.controller
 * @description Push/upload/video-token endpoints split from chat.controller.ts (Rule 16).
 * Mounted at /chat alongside ChatController.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Post, Delete, Body,
  UseGuards, Logger, UseInterceptors, HttpCode, HttpStatus,
  BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PushService } from './push.service';
import { UploadService } from './upload.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/user.types';
import { VideoTokenService } from './video-token.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { db } from '@shared/db';
import { chatVideoCalls } from '@shared/db/schema-chat';

const RegisterPushSchema = z.object({
  channel:    z.enum(['WEB_PUSH', 'FCM', 'APNS']),
  endpoint:   z.string().url().nullable().optional(),
  p256dh:     z.string().nullable().optional(),
  auth:       z.string().nullable().optional(),
  fcmToken:   z.string().nullable().optional(),
  apnsToken:  z.string().nullable().optional(),
  deviceInfo: z.record(z.unknown()).nullable().optional(),
});
type RegisterPushDto = z.infer<typeof RegisterPushSchema>;

const RequestUploadUrlSchema = z.object({
  fileName:    z.string().min(1).max(255).optional(),
  name:        z.string().min(1).max(255).optional(),
  fileMime:    z.string().min(1).max(128).optional(),
  contentType: z.string().min(1).max(128).optional(),
  fileSize:    z.number().int().positive().max(100 * 1024 * 1024).optional(),
  size:        z.number().int().positive().max(100 * 1024 * 1024).optional(),
  purpose:     z.enum(['file', 'image', 'voice', 'video']).default('file'),
  roomId:      z.string().optional(),
});
type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlSchema>;

const CompleteUploadSchema = z.object({
  roomId:   z.string().min(1),
  fileUrl:  z.string().min(1),
  fileName: z.string().min(1).max(255).optional(),
  fileType: z.string().min(1).max(128).optional(),
  fileSize: z.number().int().positive().optional(),
});
type CompleteUploadDto = z.infer<typeof CompleteUploadSchema>;

const VideoTokenSchema = z.object({
  roomId: z.string().min(1).max(255),
});
type VideoTokenDto = z.infer<typeof VideoTokenSchema>;

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatUploadsController {
  private readonly logger = new Logger(ChatUploadsController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway,
    private readonly pushService: PushService,
    private readonly uploadService: UploadService,
    private readonly videoToken: VideoTokenService,
  ) {}

  @ApiOperation({ summary: 'Register push' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('push/subscribe')
  @HttpCode(HttpStatus.OK)
  async registerPush(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RegisterPushSchema)) dto: RegisterPushDto,
  ): Promise<{ ok: true }> {
    const result = await this.pushService.register(String(user.id), {
      channel:    dto.channel,
      endpoint:   dto.endpoint ?? null,
      p256dh:     dto.p256dh ?? null,
      auth:       dto.auth ?? null,
      fcmToken:   dto.fcmToken ?? null,
      apnsToken:  dto.apnsToken ?? null,
      deviceInfo: dto.deviceInfo ?? null,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Unregister push' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unregisterPush(@CurrentUser() user: AuthenticatedUser): Promise<{ ok: true }> {
    const result = await this.pushService.unregister(String(user.id));
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Request upload url' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('upload/request-url')
  @HttpCode(HttpStatus.OK)
  async requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RequestUploadUrlSchema)) dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; publicUrl: string; fileKey: string; expiresAt: string; thumbnailUrl: string | null }> {
    const fileName = dto.fileName ?? dto.name ?? 'upload';
    const fileMime = dto.fileMime ?? dto.contentType ?? 'application/octet-stream';
    const fileSize = dto.fileSize ?? dto.size ?? 0;
    const result = await this.uploadService.requestUrl(String(user.id), {
      fileName,
      fileMime,
      fileSize,
      purpose: dto.purpose,
    });
    if (!result.ok) throw new InternalServerErrorException(result.error.message);
    return {
      uploadUrl:    result.data.uploadUrl,
      publicUrl:    result.data.publicUrl,
      fileKey:      result.data.fileKey,
      expiresAt:    result.data.expiresAt,
      thumbnailUrl: result.data.thumbnailUrl,
    };
  }

  @ApiOperation({ summary: 'Complete upload' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('upload/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CompleteUploadSchema)) dto: CompleteUploadDto,
  ): Promise<{ ok: true }> {
    const sendResult = await this.chatService.sendMessage(dto.roomId, user.id, dto.fileUrl ?? '', {
      fileUrl:  dto.fileUrl,
      fileName: dto.fileName ?? 'fayl',
      fileType: dto.fileType ?? 'application/octet-stream',
      replyToId: undefined,
    });
    if (!sendResult.ok) {
      this.logger.error(`completeUpload xato: ${sendResult.error.message}`);
      throw new InternalServerErrorException(sendResult.error.message);
    }
    const sentMessage: Record<string, unknown> = sendResult.data;
    // Item #8 (audit :259): FE faqat 'new_message' eventini tinglaydi
    // (ChatSocketProvider.tsx:152) — boshqa 4 ta emit joyi (chat-advanced*.ts,
    // chat-gateway-helper.service.ts) to'g'ri, faqat shu joy 'message:new' deb
    // xato yozilgan edi -> upload orqali yuborilgan xabar real-time yetib bormasdi.
    this.gateway.emitToRoom(dto.roomId, 'new_message', sentMessage);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Get video token' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('video/token')
  @HttpCode(HttpStatus.OK)
  async getVideoToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(VideoTokenSchema)) body: VideoTokenDto,
  ) {
    const u = user as unknown as Record<string, unknown>;
    const result = this.videoToken.generate(
      { id: user.id, fullName: u['fullName'] as string, email: u['email'] as string },
      body.roomId,
    );

    // Fire-and-forget: log video call initiation to chat_video_calls
    db.insert(chatVideoCalls).values({
      roomId:      body.roomId,
      initiatorId: String(user.id),
      status:      'RINGING',
      participants: [String(user.id)],
    }).onConflictDoNothing().catch((err: unknown) => {
      this.logger.error(`chat_video_calls INSERT xatosi: ${String(err)}`);
    });

    return result;
  }
}
