/**
 * @module chat-reactions.controller
 * @description Reactions + polls + message edit/delete endpoints split from
 * chat.controller.ts per Rule 16 (≤ 300 lines). Shares the `/chat` route prefix
 * and guards with the sibling controller so consumers see no change.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Post, Patch, Delete, Body, Param,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
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
  ChatEditMessageSchema, ChatEditMessageDto,
  ChatEmojiSchema, ChatEmojiDto,
  ChatCreatePollSchema, ChatCreatePollDto,
  ChatVotePollSchema, ChatVotePollDto,
} from './dto/chat.dto';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';

@ApiTags('Chat Reactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatReactionsController {
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  // ─── Xabarni tahrirlash ───────────────────────────────────────────────────
  @ApiOperation({ summary: 'Edit message' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('rooms/:roomId/messages/:msgId')
  @HttpCode(HttpStatus.OK)
  async editMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('msgId') msgId: string,
    @Body(new ZodValidationPipe(ChatEditMessageSchema)) body: ChatEditMessageDto,
  ) {
    return unwrapOrInternal(await this.chatService.editMessage(msgId, user.id, body.content));
  }

  // ─── Xabarni o'chirish ────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Delete message' })
  @ApiResponse({ status: 204, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('rooms/:roomId/messages/:msgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('msgId') msgId: string,
  ) {
    await this.chatService.deleteMessage(msgId, user.id);
  }

  // ─── Reaksiya qo'shish / o'chirish (toggle) ───────────────────────────────
  @ApiOperation({ summary: 'Toggle reaction' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomId/messages/:msgId/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Param('msgId') msgId: string,
    @Body(new ZodValidationPipe(ChatEmojiSchema)) body: ChatEmojiDto,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const reaction = unwrapOrThrow(await this.chatService.toggleReaction(msgId, user.id, body.emoji));
    this.gateway.emitToRoom(roomId, 'reaction:updated', { messageId: msgId, ...reaction });
    return reaction;
  }

  @ApiOperation({ summary: 'Remove reaction' })
  @ApiResponse({ status: 204, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('rooms/:roomId/messages/:msgId/reactions/:emoji')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Param('msgId') msgId: string,
    @Param('emoji') emoji: string,
  ) {
    await this.chatService.removeReaction(msgId, user.id, decodeURIComponent(emoji));
    this.gateway.emitToRoom(roomId, 'reaction:updated', { messageId: msgId, emoji, action: 'remove', userId: user.id });
  }

  // ─── So'rovnoma (Poll) yaratish ───────────────────────────────────────────
  @ApiOperation({ summary: 'Create poll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomId/polls')
  @HttpCode(HttpStatus.CREATED)
  async createPoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(ChatCreatePollSchema)) body: ChatCreatePollDto,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    return unwrapOrInternal(await this.chatService.createPoll(
      roomId, user.id, body.question, body.options,
      body.isMultiple ?? false, body.isAnonymous ?? false,
    ));
  }

  // ─── So'rovnomaga ovoz berish ─────────────────────────────────────────────
  @ApiOperation({ summary: 'Vote poll' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('polls/:pollId/vote')
  @HttpCode(HttpStatus.OK)
  async votePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pollId') pollId: string,
    @Body(new ZodValidationPipe(ChatVotePollSchema)) body: ChatVotePollDto,
  ) {
    return unwrapOrInternal(await this.chatService.votePoll(pollId, user.id, body.optionIndices));
  }
}
