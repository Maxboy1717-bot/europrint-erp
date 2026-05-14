/**
 * @module chat-advanced.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertFound, assertRequired, assertValidated, assertDefined } from '@common/assertions';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import {Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { safeCall } from '@common/result';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/user.types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  ChatEmojiSchema, ChatEmojiDto,
  ChatPinMessageSchema, ChatPinMessageDto,
  ChatAdvancedCreatePollSchema, ChatAdvancedCreatePollDto,
  ChatAdvancedVotePollSchema, ChatAdvancedVotePollDto,
  ChatThreadMessageSchema, ChatThreadMessageDto,
  ChatForwardMessageSchema, ChatForwardMessageDto,
  ChatRequestUploadUrlSchema, ChatRequestUploadUrlDto,
  ChatCompleteUploadSchema, ChatCompleteUploadDto,
} from './dto/chat.dto';

@ApiTags('Chat Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('hr-v2/chat')
export class ChatAdvancedController {
  private readonly logger = new Logger(ChatAdvancedController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── ROOMS ──────────────────────────────────────────────────────────────────

  @Get('rooms/:roomId/pinned')
  async getPinnedMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const pinned = await this.chatService.getPinnedMessage(roomId);
    return pinned ? {
      id: String(pinned.id),
      content: pinned.content,
      sender_name: pinned.senderName,
      created_at: pinned.createdAt,
    } : null;
  }

  // ── REACTIONS ──────────────────────────────────────────────────────────────

  @Post('messages/:id/reactions')
  @UsePipes(new ZodValidationPipe(ChatEmojiSchema))
  async toggleReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatEmojiDto,
  ) {
    assertRequired(body.emoji, 'emoji is required');

    const reactions = await this.chatService.toggleReaction(messageId, user.id, body.emoji);

    this.chatGateway.server?.emit('reaction:updated', {
      messageId,
      reactions,
    });

    return { reactions };
  }

  // ── PIN ────────────────────────────────────────────────────────────────────

  @Patch('messages/:id/pin')
  @UsePipes(new ZodValidationPipe(ChatPinMessageSchema))
  async pinMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatPinMessageDto,
  ) {
    const msg = await this.chatService.pinMessage(messageId, user.id, body.pin ?? true);
    assertFound(msg, 'Message not found');

    const roomId = String(msg.roomId);
    const pinned = msg.isPinned ? await this.chatService.getPinnedMessage(roomId) : null;
    this.chatGateway.server?.to(`room:${roomId}`).emit(
      msg.isPinned ? 'message:pinned' : 'message:unpinned',
      msg.isPinned
        ? { roomId, messageId, content: pinned?.content, senderName: pinned?.senderName }
        : { roomId, messageId },
    );

    return msg;
  }

  // ── POLLS ──────────────────────────────────────────────────────────────────

  @Post('polls')
  @UsePipes(new ZodValidationPipe(ChatAdvancedCreatePollSchema))
  async createPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatAdvancedCreatePollDto,
  ) {
    assertRequired(body.roomId, 'roomId and question are required');
    assertRequired(body.question?.trim(), 'roomId and question are required');
    assertValidated(
      Boolean(body.options && body.options.length >= 2 && body.options.length <= 10),
      '2-10 ta variant kerak',
    );

    const roomId = String(body.roomId);
    const message = await this.chatService.createPoll(
      roomId,
      user.id,
      body.question.trim(),
      (Array.isArray(body?.options) ? body?.options : []).filter((o) => o.trim()),
      body.isMultiple ?? false,
      body.isAnonymous ?? false,
    );

    this.chatGateway.server?.to(`room:${roomId}`).emit('new_message', message);

    const members = await this.chatService.getRoomMembers(roomId);
    for (const member of (Array.isArray(members) ? members : []).filter((m) => m.userId !== user.id)) {
      const unread = await this.chatService.getTotalUnreadCount(Number(member.userId));
      this.chatGateway.emitToUser(Number(member.userId), 'unread_count', { count: unread });
      this.chatGateway.emitToUser(Number(member.userId), 'room_updated', { roomId });
    }

    return message;
  }

  @Post('polls/:pollId/vote')
  @UsePipes(new ZodValidationPipe(ChatAdvancedVotePollSchema))
  async votePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pollId') pollId: string,
    @Body() body: ChatAdvancedVotePollDto,
  ) {
    assertDefined(body.optionIndex, 'optionIndex is required');

    const indices = Array.isArray(body.optionIndex) ? body.optionIndex : [body.optionIndex];
    const voteData = await this.chatService.votePoll(pollId, user.id, indices);

    this.chatGateway.server?.to(`room:${voteData.roomId}`).emit('poll:updated', voteData);

    return voteData;
  }

  // ── THREADS ────────────────────────────────────────────────────────────────

  @Get('messages/:id/thread')
  async getThreadMessages(@CurrentUser() user: AuthenticatedUser, @Param('id') messageId: string) {
    return unwrapOrInternal(await this.chatService.getThreadMessages(messageId, user.id));
  }

  @Post('messages/:id/thread')
  @UsePipes(new ZodValidationPipe(ChatThreadMessageSchema))
  async sendThreadMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatThreadMessageDto,
  ) {
    assertRequired(body.content?.trim(), 'content is required');

    const result = await this.chatService.sendThreadMessage(
      messageId,
      user.id,
      body.content.trim(),
    );

    this.chatGateway.server?.to(`room:${result.roomId}`).emit('thread:new_reply', result.msg);
    this.chatGateway.server?.to(`room:${result.roomId}`).emit('thread:count_updated', {
      messageId,
      threadCount: result.threadCount,
    });

    return result.msg;
  }

  // ── FORWARD ────────────────────────────────────────────────────────────────

  @Post('messages/:id/forward')
  @UsePipes(new ZodValidationPipe(ChatForwardMessageSchema))
  async forwardMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatForwardMessageDto,
  ) {
    const targetRoomId = String(body.targetRoomId);

    const message = await this.chatService.forwardMessage(
      messageId,
      targetRoomId,
      user.id,
    );

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

  @Post('upload/complete')
  @UsePipes(new ZodValidationPipe(ChatCompleteUploadSchema))
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatCompleteUploadDto,
  ) {
    const roomId = String(body.roomId);

    const message = await this.chatService.uploadFileAndSendMessage(
      roomId,
      user.id,
      body.fileUrl,
      body.fileName,
      body.fileType,
      body.fileSize,
    );

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
