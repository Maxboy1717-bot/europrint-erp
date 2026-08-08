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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatExtController {
  constructor(
    private readonly chatNotifSvc: ChatNotificationsService,
    private readonly chatAdminSvc: ChatAdminService,
    private readonly chatService: ChatService,
    private readonly chatMessageSvc: ChatMessageService,
  ) {}

  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('notifications')
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.getNotifications(user.id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Mark all read post' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllReadPost(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.markAllRead(user.id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Mark all read patch' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  async markAllReadPatch(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.markAllRead(user.id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Mark one read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  async markOneRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.chatNotifSvc.markOneRead(user.id, id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Search messages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('search')
  async searchMessages(@CurrentUser() user: AuthenticatedUser, @Query('q') q: string) {
    const result = await this.chatNotifSvc.searchMessages(user.id, q ?? '');
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get message tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('message-tasks')
  async getMessageTasks(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatNotifSvc.getMessageTasks(user.id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Create message task' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('message-tasks')
  @HttpCode(HttpStatus.CREATED)
  async createMessageTask(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseCreateMessageTask(body);
    const result = await this.chatNotifSvc.createMessageTask(
      user.id, dto.roomId, dto.messageId, dto.title,
      dto.assignedTo ?? null, dto.dueDate ?? null, dto.priority,
      dto.kanbanCardId ?? null,
    );
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get or create context room' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('context-room')
  @HttpCode(HttpStatus.OK)
  async getOrCreateContextRoom(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = parseContextRoom(body);
    const result = await this.chatNotifSvc.getOrCreateContextRoom(user.id, dto.contextType, dto.contextId);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get admin rooms' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/rooms')
  @Roles('admin', 'director')
  async getAdminRooms() {
    const result = await this.chatAdminSvc.getAdminRooms();
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get admin room members' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/rooms/:roomId/members')
  @Roles('admin', 'director')
  async getAdminRoomMembers(@Param('roomId') roomId: string) {
    const result = await this.chatAdminSvc.getRoomMembers(roomId);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Archive room' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('admin/rooms/:roomId/archive')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async archiveRoom(@Param('roomId') roomId: string) {
    const result = await this.chatAdminSvc.archiveRoom(roomId);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Remove room member' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('admin/rooms/:roomId/members/:userId')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async removeRoomMember(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const result = await this.chatAdminSvc.removeMember(roomId, userId);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('admin/rooms/:roomId/members/:userId/role')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(@Param('roomId') roomId: string, @Param('userId') userId: string, @Body() body: unknown) {
    const dto = parseUpdateMemberRole(body);
    const result = await this.chatAdminSvc.updateMemberRole(roomId, userId, dto.role);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get admin audit logs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/audit-logs')
  @Roles('admin', 'director')
  async getAdminAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.chatAdminSvc.getAuditLogs(
      Number(page) || 1,
      Number(limit) || 50,
    );
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Archive admin room (PATCH alias)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('admin/rooms/:roomId/archive')
  @Roles('admin', 'director')
  @HttpCode(HttpStatus.OK)
  async archiveRoomPatch(@Param('roomId') roomId: string) {
    const result = await this.chatAdminSvc.archiveRoom(roomId);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Unpin message (DELETE)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete('messages/:id/pin')
  @HttpCode(HttpStatus.OK)
  async unpinMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const result = await this.chatService.pinMessage(id, user.id, false);
    return { pinned: false, id, result };
  }

  @ApiOperation({ summary: 'Pin message' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get starred messages for current user' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('starred-messages')
  async getStarredMessages(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.chatMessageSvc.getStarredMessages(String(user.id));
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Star message' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get admin room member' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/rooms/:roomId/members/:userId')
  @Roles('admin', 'director')
  async getAdminRoomMember(@Param('roomId') roomId: string, @Param('userId') userId: string) {
    const result = await this.chatAdminSvc.getRoomMembers(roomId);
    assertOk(result);
    const members = castTo<{ members: Array<{ userId: string }> }>(result.data).members ?? [];
    return (Array.isArray(members) ? members : []).find((m) => m.userId === userId) ?? null;
  }
}
