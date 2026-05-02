import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Logger, UseInterceptors, HttpCode, HttpStatus,
  BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PushService } from './push.service';
import { UploadService } from './upload.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
  ChatEditMessageSchema, ChatEditMessageDto,
  ChatEmojiSchema, ChatEmojiDto,
  ChatCreatePollSchema, ChatCreatePollDto,
  ChatVotePollSchema, ChatVotePollDto,
} from './dto/chat.dto';
import { z } from 'zod';
import { unwrapOrInternal } from '@common/http-result';

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

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway,
    private readonly pushService: PushService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  async getChatInfo(@CurrentUser() user: AuthenticatedUser) {
    const rooms = await this.chatService.getRoomsForUser(user.id);
    const roomList = Array.isArray(rooms) ? rooms : [];
    return { total_rooms: roomList.length, user_id: user.id };
  }

  @Get('rooms')
  async getRooms(@CurrentUser() user: AuthenticatedUser) {
    await this.chatService.getOrCreateDepartmentRooms(user.id);
    return unwrapOrInternal(await this.chatService.getRoomsForUser(user.id));
  }

  @Post('rooms/direct')
  @HttpCode(HttpStatus.CREATED)
  async startDirect(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChatStartDirectSchema)) body: ChatStartDirectDto,
  ) {
    return unwrapOrInternal(await this.chatService.getOrCreateDirectRoom(user.id, body.targetUserId));
  }

  @Post('rooms/group')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ChatCreateGroupSchema)) body: ChatCreateGroupDto,
  ) {
    return unwrapOrInternal(await this.chatService.createGroupRoom(body.name, body.memberIds, user.id));
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return unwrapOrInternal(await this.chatService.getMessages(roomId, user.id, Number(limit) || 50, before));
  }

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

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.markRoomAsRead(roomId, user.id);
  }

  @Get('rooms/:roomId/members')
  async getMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    return unwrapOrInternal(await this.chatService.getRoomMembers(roomId));
  }

  @Get('employees')
  async getEmployees(@Query('search') search?: string) {
    return unwrapOrInternal(await this.chatService.getAllEmployees(search));
  }

  @Get('unread')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.chatService.getTotalUnreadCount(user.id);
    return { count };
  }

  @Get('rooms/:roomId')
  async getRoomById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    const rooms = await this.chatService.getRoomsForUser(user.id);
    const roomsArr = Array.isArray(rooms) ? (rooms as Array<{ id: string | number }>) : [];
    return (Array.isArray(roomsArr) ? roomsArr : []).find((r) => String(r.id) === roomId) ?? null;
  }

  @Get('rooms/:roomId/pinned-messages')
  async getPinnedMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const pinned = await this.chatService.getPinnedMessage(roomId);
    return pinned ? [pinned] : [];
  }

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

  // ─── Xabarni tahrirlash ───────────────────────────────────────────────────
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
  @Delete('rooms/:roomId/messages/:msgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('msgId') msgId: string,
  ) {
    await this.chatService.deleteMessage(msgId, user.id);
  }

  // ─── Reaksiya qo'shish / o'chirish (toggle) ───────────────────────────────
  @Post('rooms/:roomId/messages/:msgId/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Param('msgId') msgId: string,
    @Body(new ZodValidationPipe(ChatEmojiSchema)) body: ChatEmojiDto,
  ) {
    await this.chatService.assertRoomMember(roomId, user.id);
    const reaction = await this.chatService.toggleReaction(msgId, user.id, body.emoji);
    this.gateway.emitToRoom(roomId, 'reaction:updated', { messageId: msgId, ...reaction });
    return reaction;
  }

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
  @Post('polls/:pollId/vote')
  @HttpCode(HttpStatus.OK)
  async votePoll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pollId') pollId: string,
    @Body(new ZodValidationPipe(ChatVotePollSchema)) body: ChatVotePollDto,
  ) {
    return unwrapOrInternal(await this.chatService.votePoll(pollId, user.id, body.optionIndices));
  }

  // ─── Web Push obuna ───────────────────────────────────────────────────────
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

  @Delete('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unregisterPush(@CurrentUser() user: AuthenticatedUser): Promise<{ ok: true }> {
    const result = await this.pushService.unregister(String(user.id));
    if (!result.ok) throw new BadRequestException(result.error.message);
    return { ok: true };
  }

  // ─── Fayl yuklash URL ─────────────────────────────────────────────────────
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

  // ─── Fayl yuklashni yakunlash ─────────────────────────────────────────────
  @Post('upload/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CompleteUploadSchema)) dto: CompleteUploadDto,
  ): Promise<{ ok: true }> {
    const result = await this.chatService.sendMessage(dto.roomId, user.id, dto.fileUrl, {
      fileUrl:  dto.fileUrl,
      fileName: dto.fileName ?? 'fayl',
      fileType: dto.fileType ?? 'application/octet-stream',
      replyToId: undefined,
    });
    if (!result.ok) throw new InternalServerErrorException('Xabar yuborilmadi');
    return { ok: true };
  }
}
