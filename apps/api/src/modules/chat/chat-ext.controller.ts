/**
 * @module chat-ext.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertOk, unwrapOrInternal } from '@common/http-result';
import {
  Body, Controller, Delete, Get,
  HttpCode, HttpStatus, Param, Patch, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { castTo } from '@common/db-rows';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ChatNotificationsService } from './chat-notifications.service';
import { ChatAdminService } from './chat-admin.service';
import { ChatService } from './chat.service';
import { ChatMessageService } from './chat-message.service';
import { parseCreateMessageTask } from './dto/create-message-task.dto';
import { parseContextRoom, parseUpdateMemberRole } from './dto/chat-ext.dto';

@ApiTags('Chat Extended')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatExtController {
  constructor(
    private readonly chatNotifSvc: ChatNotificationsService,
    private readonly chatAdminSvc: ChatAdminService,
    private readonly chatService: ChatService,
    private readonly chatMessageSvc: ChatMessageService,
  ) {}

  @Get('notifications')
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.getNotifications(user.id);
    assertOk(result);
    return result.data;
  }

  @Post('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllReadPost(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.markAllRead(user.id);
    assertOk(result);
    return result.data;
  }

  @Patch('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllReadPatch(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.markAllRead(user.id);
    assertOk(result);
    return result.data;
  }

  @Patch('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  async markOneRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.chatNotifSvc.markOneRead(user.id, id);
    assertOk(result);
    return result.data;
  }

  @Get('search')
  async searchMessages(@CurrentUser() user: AuthenticatedUser, @Query('q') q: string) {
    const result = await this.chatNotifSvc.searchMessages(user.id, q ?? '');
    assertOk(result);
    return result.data;
  }

  @Get('message-tasks')
  async getMessageTasks(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.getMessageTasks(user.id);
    assertOk(result);
    return result.data;
  }

  @Post('message-tasks')
  @HttpCode(HttpStatus.CREATED)
  async createMessageTask(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseCreateMessageTask(body);
    const result = await this.chatNotifSvc.createMessageTask(
      user.id, dto.roomId, dto.messageId, dto.title,
      dto.assignedTo ?? null, dto.dueDate ?? null, dto.priority,
    );
    assertOk(result);
    return result.data;
  }

  @Post('context-room')
  @HttpCode(HttpStatus.OK)
  async getOrCreateContextRoom(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseContextRoom(body);
    const result = await this.chatNotifSvc.getOrCreateContextRoom(user.id, dto.contextType, dto.contextId);
    assertOk(result);
    return result.data;
  }

  @Get('admin/rooms')
  @Roles('admin', 'director')
  async getAdminRooms() {
    const result = await this.chatAdminSvc.getAdminRooms();
    assertOk(result);
    return result.data;
  }

  @Get('admin/rooms/:roomId/members')
  @Roles('admin', 'director')
  async getAdminRoomMembers(@Param('roomId') roomId: string) {
    const result = await this.chatAdminSvc.getRoomMembers(roomId);
    assertOk(result);
    return result.data;
  }

  @Post('admin/rooms/:roomId/archive')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async archiveRoom(@Param('roomId') roomId: string) {
    const result = await this.chatAdminSvc.archiveRoom(roomId);
    assertOk(result);
    return result.data;
  }

  @Delete('admin/rooms/:roomId/members/:userId')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async removeRoomMember(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const result = await this.chatAdminSvc.removeMember(roomId, userId);
    assertOk(result);
    return result.data;
  }

  @Patch('admin/rooms/:roomId/members/:userId/role')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(@Param('roomId') roomId: string, @Param('userId') userId: string, @Body() body: unknown) {
    const dto = parseUpdateMemberRole(body);
    const result = await this.chatAdminSvc.updateMemberRole(roomId, userId, dto.role);
    assertOk(result);
    return result.data;
  }

  @Get('admin/audit-logs')
  @Roles('admin', 'director')
  async getAdminAuditLogs(@Query('limit') limit?: string) {
    const result = await this.chatAdminSvc.getAuditLogs(Number(limit) || 100);
    assertOk(result);
    return result.data;
  }

  @Post('messages/:id/pin')
  @HttpCode(HttpStatus.OK)
  async pinMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { pin?: boolean },
  ) {
    const result = await this.chatService.pinMessage(id, user.id, body.pin ?? true);
    const isPinned = (result as Record<string, unknown> | null)?.isPinned ?? false;
    return { pinned: isPinned };
  }

  @Post('messages/:id/star')
  @HttpCode(HttpStatus.OK)
  async starMessage(
    @Param('id') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { starred?: boolean },
  ) {
    const starred = body?.starred !== false;
    return unwrapOrInternal(await this.chatMessageSvc.starMessage(messageId, String(user.id), starred));
  }

  @Get('admin/rooms/:roomId/members/:userId')
  @Roles('admin', 'director')
  async getAdminRoomMember(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const result = await this.chatAdminSvc.getRoomMembers(roomId);
    assertOk(result);
    const members = castTo<{ members: Array<{ userId: string }> }>(result.data).members ?? [];
    return (Array.isArray(members) ? members : []).find((m) => m.userId === userId) ?? null;
  }
}
