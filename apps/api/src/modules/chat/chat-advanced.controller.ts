/**
 * @module chat-advanced.controller
 * @description Rooms/reactions/pin/polls endpoints. Thread/forward/upload endpoints
 * were extracted to `chat-advanced-uploads.controller.ts` per Rule 16 (≤ 300 lines).
 * Both controllers share the `/hr-v2/chat` prefix so consumers see no route change.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { assertFound, assertRequired, assertValidated, assertDefined } from '@common/assertions';
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
} from './dto/chat.dto';

export { ChatAdvancedUploadsController } from './chat-advanced-uploads.controller';

@ApiTags('Chat Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('hr-v2/chat')
export class ChatAdvancedController {
  private readonly logger = new Logger(ChatAdvancedController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly i18n: I18nService,
  ) {}

  // ── ROOMS ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get pinned message' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Toggle reaction' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('messages/:id/reactions')
  @UsePipes(new ZodValidationPipe(ChatEmojiSchema))
  async toggleReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatEmojiDto,
  ) {
    assertRequired(body.emoji, await this.i18n.t('validation.emojiRequired'));

    const reactions = unwrapOrThrow(await this.chatService.toggleReaction(messageId, user.id, body.emoji));

    this.chatGateway.server?.emit('reaction:updated', {
      messageId,
      reactions,
    });

    return { reactions };
  }

  // ── PIN ────────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Pin message' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('messages/:id/pin')
  @UsePipes(new ZodValidationPipe(ChatPinMessageSchema))
  async pinMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') messageId: string,
    @Body() body: ChatPinMessageDto,
  ) {
    const msg = await this.chatService.pinMessage(messageId, user.id, body.pin ?? true);
    assertFound(msg, await this.i18n.t('errors.messageNotFound'));

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

  @ApiOperation({ summary: 'Create poll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('polls')
  @UsePipes(new ZodValidationPipe(ChatAdvancedCreatePollSchema))
  async createPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChatAdvancedCreatePollDto,
  ) {
    const roomIdAndQuestionMsg = await this.i18n.t('validation.roomIdAndQuestionRequired');
    assertRequired(body.roomId, roomIdAndQuestionMsg);
    assertRequired(body.question?.trim(), roomIdAndQuestionMsg);
    assertValidated(
      Boolean(body.options && body.options.length >= 2 && body.options.length <= 10),
      await this.i18n.t('validation.pollOptionsCountRange'),
    );

    const roomId = String(body.roomId);
    const message = unwrapOrThrow(await this.chatService.createPoll(
      roomId,
      user.id,
      body.question.trim(),
      (Array.isArray(body?.options) ? body?.options : []).filter((o) => o.trim()),
      body.isMultiple ?? false,
      body.isAnonymous ?? false,
    ));

    this.chatGateway.server?.to(`room:${roomId}`).emit('new_message', message);

    const members = await this.chatService.getRoomMembers(roomId);
    const others = (Array.isArray(members) ? members : []).filter((m) => m.userId !== user.id);
    const otherIds = others.map((m) => Number(m.userId));
    const unreadMap = await this.chatService.getBulkUnreadCounts(otherIds);
    for (const member of others) {
      const uid = Number(member.userId);
      this.chatGateway.emitToUser(uid, 'unread_count', { count: unreadMap[uid] ?? 0 });
      this.chatGateway.emitToUser(uid, 'room_updated', { roomId });
    }

    return message;
  }

  @ApiOperation({ summary: 'Vote poll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('polls/:pollId/vote')
  @UsePipes(new ZodValidationPipe(ChatAdvancedVotePollSchema))
  async votePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pollId') pollId: string,
    @Body() body: ChatAdvancedVotePollDto,
  ) {
    assertDefined(body.optionIndex, await this.i18n.t('validation.optionIndexRequired'));

    const indices = Array.isArray(body.optionIndex) ? body.optionIndex : [body.optionIndex];
    const voteData = unwrapOrThrow(await this.chatService.votePoll(pollId, user.id, indices));

    this.chatGateway.server?.to(`room:${(voteData as Record<string, unknown>)['roomId']}`).emit('poll:updated', voteData);

    return voteData;
  }
}
