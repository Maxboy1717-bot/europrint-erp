/**
 * @module chat.controller
 * @description Rooms, messages, members, and read/mute endpoints. The reactions/polls/
 * edit/delete handlers were extracted to `chat-reactions.controller.ts` per Rule 16
 * (≤ 300 lines). Push/upload/video-token endpoints already live in
 * `chat-uploads.controller.ts`. All four controllers share the `/chat` prefix and
 * are registered in chat.module.ts; route paths and DI tokens are preserved.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Patch, Post, Body, Param, Query,
  UseGuards, Logger, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
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
  ChatStartDirectSchema, ChatStartDirectDto,
  ChatCreateGroupSchema, ChatCreateGroupDto,
  ChatSendMessageSchema, ChatSendMessageDto,
  ChatMuteRoomSchema, ChatMuteRoomDto,
} from './dto/chat.dto';
import { unwrapOrInternal } from '@common/http-result';

export { ChatUploadsController } from './chat-uploads.controller';
export { ChatReactionsController } from './chat-reactions.controller';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: 'Get chat info' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getChatInfo(@CurrentUser() user: AuthenticatedUser) {
    const rooms = await this.chatService.getRoomsForUser(user.id);
    const roomList = Array.isArray(rooms) ? rooms : [];
    return { total_rooms: roomList.length, user_id: user.id };
  }

  @ApiOperation({ summary: 'Get rooms' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms')
  async getRooms(@CurrentUser() user: AuthenticatedUser) {
    await this.chatService.getOrCreateDepartmentRooms(user.id);
    return unwrapOrInternal(await this.chatService.getRoomsForUser(user.id));
  }

  @ApiOperation({ summary: 'Start direct' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/direct')
  @HttpCode(HttpStatus.CREATED)
  async startDirect(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChatStartDirectSchema)) body: ChatStartDirectDto,
  ) {
    return unwrapOrInternal(await this.chatService.getOrCreateDirectRoom(user.id, body.targetUserId));
  }

  @ApiOperation({ summary: 'Create group' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/group')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChatCreateGroupSchema)) body: ChatCreateGroupDto,
  ) {
    return unwrapOrInternal(await this.chatService.createGroupRoom(body.name, body.memberIds, user.id, body.type ?? 'GROUP'));
  }

  @ApiOperation({ summary: 'Get messages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomId/messages')
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return unwrapOrInternal(await this.chatService.getMessages(roomId, user.id, Number(limit) || 50, before));
  }

  @ApiOperation({ summary: 'Send message' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(ChatSendMessageSchema)) body: ChatSendMessageDto,
  ) {
    return unwrapOrInternal(await this.chatService.sendMessage(roomId, user.id, body.content, {
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileType: body.fileType,
      replyToId: body.replyToId,
    }));
  }

  @ApiOperation({ summary: 'Mark read' })
  @ApiResponse({ status: 204, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.markRoomAsRead(roomId, user.id);
  }

  @ApiOperation({ summary: 'Get members' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomId/members')
  async getMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    return unwrapOrInternal(await this.chatService.getRoomMembers(roomId));
  }

  @ApiOperation({ summary: 'Get employees' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employees')
  async getEmployees(@Query('search') search?: string) {
    return unwrapOrInternal(await this.chatService.getAllEmployees(search));
  }

  @ApiOperation({ summary: 'Get today birthdays' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('birthdays/today')
  async getTodayBirthdays() {
    return unwrapOrInternal(await this.chatService.getTodayBirthdays());
  }

  @ApiOperation({ summary: 'Get unread count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('unread')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.chatService.getTotalUnreadCount(user.id);
    return { count };
  }

  @ApiOperation({ summary: 'Get room by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomId')
  async getRoomById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    const rooms = await this.chatService.getRoomsForUser(user.id);
    const roomsArr = Array.isArray(rooms) ? (rooms as Array<{ id: string | number }>) : [];
    return (Array.isArray(roomsArr) ? roomsArr : []).find((r) => String(r.id) === roomId) ?? null;
  }

  @ApiOperation({ summary: 'Get pinned messages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomId/pinned-messages')
  async getPinnedMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const pinned = await this.chatService.getPinnedMessage(roomId);
    return pinned ? [pinned] : [];
  }

  @ApiOperation({ summary: 'Get mute status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomId/mute')
  async getMuteStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    const members = await this.chatService.getRoomMembers(roomId);
    const me = (members as Array<{ userId: string | number; isMuted?: boolean }>)
      .find((m) => String(m.userId) === String(user.id));
    return { muted: me?.isMuted ?? false };
  }

  @ApiOperation({ summary: 'Update room' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('rooms/:roomId')
  @HttpCode(HttpStatus.OK)
  async updateRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body() body: unknown,
  ) {
    const dto = (body ?? {}) as Record<string, unknown>;
    await this.chatService.assertRoomMember(roomId, user.id);
    const r = await db.execute(sql`
      UPDATE chat_rooms SET
        name        = COALESCE(${dto['name']        ?? null}::text,    name),
        description = COALESCE(${dto['description'] ?? null}::text,    description),
        avatar_url  = COALESCE(${dto['avatar_url']  ?? null}::text,    avatar_url),
        updated_at  = NOW()
      WHERE id = ${parseInt(roomId, 10)}
      RETURNING id, name, description
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? { id: roomId };
    return row;
  }

  @ApiOperation({ summary: 'Mute room' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomId/mute')
  @HttpCode(HttpStatus.OK)
  async muteRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(ChatMuteRoomSchema)) body: ChatMuteRoomDto,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const muted = body.muted ?? true;
    await this.chatService.toggleMemberMute(roomId, String(user.id), muted);
    return { muted };
  }
}
