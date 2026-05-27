/**
 * @module chat-advanced-uploads.controller
 * @description Thread, forward, and file-upload endpoints split from
 * chat-advanced.controller.ts per Rule 16 (≤ 300 lines). Same `/hr-v2/chat` prefix
 * and guards as the sibling controller so consumers see no route change.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertRequired } from '@common/assertions';
import { assertOk, unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { safeCall } from '@common/result';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/user.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  ChatThreadMessageSchema, ChatThreadMessageDto,
  ChatForwardMessageSchema, ChatForwardMessageDto,
  ChatRequestUploadUrlSchema, ChatRequestUploadUrlDto,
  ChatCompleteUploadSchema, ChatCompleteUploadDto,
} from './dto/chat.dto';

@ApiTags('Chat Advanced Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('hr-v2/chat')
export class ChatAdvancedUploadsController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── THREADS ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get thread messages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('messages/:id/thread')
  async getThreadMessages(@CurrentUser() user: AuthenticatedUser, @Param('id') messageId: string) {
    return unwrapOrInternal(await this.chatService.getThreadMessages(messageId, user.id));
  }

  @ApiOperation({ summary: 'Send thread message' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('messages/:id/thread')
  @UsePipes(new ZodValidationPipe(ChatThreadMessageSchema))
  async sendThreadMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatThreadMessageDto,
  ) {
    assertRequired(body.content?.trim(), 'content is required');

    const result = unwrapOrThrow(await this.chatService.sendThreadMessage(
      messageId,
      user.id,
      body.content.trim(),
    ));

    this.chatGateway.server?.to(`room:${result['roomId']}`).emit('thread:new_reply', result['msg']);
    this.chatGateway.server?.to(`room:${result['roomId']}`).emit('thread:count_updated', {
      messageId,
      threadCount: result['threadCount'],
    });

    return result['msg'];
  }

  // ── FORWARD ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Forward message' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('messages/:id/forward')
  @UsePipes(new ZodValidationPipe(ChatForwardMessageSchema))
  async forwardMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatForwardMessageDto,
  ) {
    const targetRoomId = String(body.targetRoomId);

    const message = unwrapOrThrow(await this.chatService.forwardMessage(
      messageId,
      targetRoomId,
      user.id,
    ));

    this.chatGateway.server?.to(`room:${targetRoomId}`).emit('new_message', message);

    const members = await this.chatService.getRoomMembers(targetRoomId);
    for (const member of (Array.isArray(members) ? members : []).filter((m) => m.userId !== user.id)) {
      const unread = await this.chatService.getTotalUnreadCount(Number(member.userId));
      this.chatGateway.emitToUser(Number(member.userId), 'unread_count', { count: unread });
      this.chatGateway.emitToUser(Number(member.userId), 'room_updated', { roomId: targetRoomId });
    }

    return message;
  }

  // ── FILE UPLOAD ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Request upload url' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('upload/request-url')
  @UsePipes(new ZodValidationPipe(ChatRequestUploadUrlSchema))
  async requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatRequestUploadUrlDto,
  ) {
    const roomId = String(body.roomId);

    const members = await this.chatService.getRoomMembers(roomId);
    assertRequired((Array.isArray(members) ? members : []).find((m) => m.userId === user.id), 'Not a member of this room');

    const storageResult = await safeCall(async () => {
      const { ObjectStorageService } = await import('../../lib/objectStorage');
      const objStorage = new ObjectStorageService();
      const uploadURL = await objStorage.getObjectEntityUploadURL();
      const path = uploadURL.split('?')[0];
      const normalizedPath = path.includes('/objects/')
        ? path.substring(path.indexOf('/objects/'))
        : path;
      const fileUrl = `/api/storage/objects${normalizedPath.replace(/^\/objects/, '')}`;
      return { uploadURL, fileUrl };
    }, 'EXTERNAL_SERVICE');
    assertOk(storageResult);
    return storageResult.data;
  }

  @ApiOperation({ summary: 'Complete upload' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('upload/complete')
  @UsePipes(new ZodValidationPipe(ChatCompleteUploadSchema))
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatCompleteUploadDto,
  ) {
    const roomId = String(body.roomId);

    const message = unwrapOrThrow(await this.chatService.uploadFileAndSendMessage(
      roomId,
      user.id,
      body.fileUrl,
      body.fileName,
      body.fileType,
      body.fileSize,
    ));

    this.chatGateway.server?.to(`room:${roomId}`).emit('new_message', message);

    const members = await this.chatService.getRoomMembers(roomId);
    for (const member of (Array.isArray(members) ? members : []).filter((m) => m.userId !== user.id)) {
      const unread = await this.chatService.getTotalUnreadCount(Number(member.userId));
      this.chatGateway.emitToUser(Number(member.userId), 'unread_count', { count: unread });
      this.chatGateway.emitToUser(Number(member.userId), 'room_updated', { roomId });
    }

    return message;
  }
}
