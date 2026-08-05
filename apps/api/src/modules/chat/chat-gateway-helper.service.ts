/**
 * @module chat-gateway-helper.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import type { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationBotService } from '../hr/telegram-bots/notification-bot.service';

@Injectable()
export class ChatGatewayHelperService {
  private readonly logger = new Logger(ChatGatewayHelperService.name);
  private server: Server | null = null;
  private userSockets: Map<number, Set<string>> | null = null;

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationBot: NotificationBotService,
  ) {}

  setContext(server: Server, userSockets: Map<number, Set<string>>) {
    this.server = server;
    this.userSockets = userSockets;
  }

  async handleGetRooms(client: Socket): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const userId = client.data?.userId;
      if (!userId) return;
      const rooms = await this.chatService.getRoomsForUser(userId);
      for (const room of rooms) {
        client.join(`room:${room.id}`);
      }
      client.emit('rooms_list', rooms);
    });
  }

  async handleJoinRoom(client: Socket, data: { roomId: number | string }) {
    const userId = client.data?.userId;
    if (!userId) return;
    const roomId = Number(data.roomId);

    const isMember = await this.chatService.isRoomMember(roomId, userId);
    if (!isMember) {
      client.emit('error', { message: 'Bu xonaga kirish huquqingiz yo\'q' });
      return;
    }

    client.join(`room:${roomId}`);
    client.emit('room_joined', { roomId });
  }

  async handleGetMessages(client: Socket, data: { roomId: number | string; before?: string; limit?: number }) {
    const userId = client.data?.userId;
    if (!userId) return;
    const roomId = Number(data.roomId);
    const result = await this.chatService.getMessages(roomId, userId, data.limit || 50, data.before);
    // getMessages returns Result<object> — unwrap it before emitting so the
    // frontend receives a plain array, not { ok, data }.
    const messages = (result as { ok: boolean; data?: unknown }).ok
      ? ((result as { ok: boolean; data?: unknown }).data ?? [])
      : [];
    client.emit('messages_list', { roomId, messages });
  }

  async handleSendMessage(
    client: Socket,
    data: { roomId: number | string; content: string; replyToId?: string; fileUrl?: string; fileName?: string; fileType?: string; clientMsgId?: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;
    const roomId = Number(data.roomId);

    try {
      const sendResult = await this.chatService.sendMessage(
        roomId,
        userId,
        data.content,
        { fileUrl: data.fileUrl, fileName: data.fileName, fileType: data.fileType, replyToId: data.replyToId ? Number(data.replyToId) : undefined, clientMsgId: data.clientMsgId },
      );
      if (!sendResult.ok) { client.emit('error', { message: sendResult.error.message, clientMsgId: data.clientMsgId }); return; }
      const message = sendResult.data;

      this.server?.to(`room:${roomId}`).emit('new_message', message);

      const members = await this.chatService.getRoomMembers(roomId);
      for (const member of members) {
        if (String(member.userId) === String(userId)) continue;
        const unread = await this.chatService.getTotalUnreadCount(Number(member.userId));
        this.emitToUser(Number(member.userId), 'unread_count', { count: unread });
        this.emitToUser(Number(member.userId), 'room_updated', { roomId });
      }

      await this.sendTelegramNotification(roomId, userId, data.content, members);
    } catch (err) {
      client.emit('error', { message: String(err), clientMsgId: data.clientMsgId });
    }
  }

  async handleMarkRead(client: Socket, data: { roomId: number | string }) {
    const userId = client.data?.userId;
    if (!userId) return;
    const roomId = Number(data.roomId);

    await this.chatService.markRoomAsRead(roomId, userId);
    const unread = await this.chatService.getTotalUnreadCount(userId);
    client.emit('unread_count', { count: unread });

    this.server?.to(`room:${roomId}`).emit('message:read', { roomId, userId });
  }

  async handleStartDirect(client: Socket, data: { targetUserId: number }) {
    const userId = client.data?.userId;
    if (!userId) return;

    const roomR = await this.chatService.getOrCreateDirectRoom(userId, data.targetUserId);
    if (!roomR.ok) return;
    const room = roomR.data as { id: number };
    client.join(`room:${room.id}`);

    const targetSockets = this.userSockets?.get(data.targetUserId);
    if (targetSockets) {
      for (const socketId of targetSockets) {
        const targetSocket = this.server?.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.join(`room:${room.id}`);
        }
      }
    }

    client.emit('direct_room', room);
  }

  async handleTyping(client: Socket, data: { roomId: number | string; isTyping: boolean }) {
    const userId = client.data?.userId;
    if (!userId) return;
    const roomId = Number(data.roomId);

    const isMember = await this.chatService.isRoomMember(roomId, userId);
    if (!isMember) return;

    const user = client.data.user;
    const userName = user?.full_name || user?.fullName || user?.name || user?.username || 'Xodim';

    client.to(`room:${roomId}`).emit('user_typing', {
      userId,
      roomId,
      isTyping: data.isTyping,
      userName,
    });
  }

  async handleEditMessage(client: Socket, data: { messageId: number | string; content: string }) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      const updated = await this.chatService.editMessage(Number(data.messageId), userId, data.content);
      if (updated) {
        this.server?.to(`room:${updated.roomId}`).emit('message:edited', {
          id: updated.id,
          roomId: updated.roomId,
          content: updated.content,
          isEdited: updated.isEdited,
        });
      }
    } catch (err) {
      client.emit('error', { message: String(err) });
    }
  }

  async handleDeleteMessage(client: Socket, data: { messageId: number | string; scope?: 'me' | 'everyone' }) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      // "Delete for me": hide from this user's view only; the row survives
      // (audit channel). Echo only to the requesting client's sockets.
      if (data.scope === 'me') {
        const hidden = await this.chatService.hideMessageForUser(Number(data.messageId), userId);
        if (hidden) {
          this.emitToUser(Number(userId), 'message:hidden', { id: String(data.messageId), roomId: String(hidden.roomId) });
        }
        return;
      }
      // "Delete for everyone": soft-delete (is_deleted=true, sender-only) + broadcast.
      const deleted = await this.chatService.deleteMessage(Number(data.messageId), userId);
      if (deleted) {
        this.server?.to(`room:${deleted.roomId}`).emit('message:deleted', {
          id: deleted.id,
          roomId: deleted.roomId,
        });
      }
    } catch (err) {
      client.emit('error', { message: String(err) });
    }
  }

  emitToUser(userId: number, event: string, data: Record<string, unknown>) {
    const sockets = this.userSockets?.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server?.to(socketId).emit(event, data);
    }
  }

  private async sendTelegramNotification(roomId: number, senderId: number, content: string, members: Record<string, unknown>[]) {
    try {
      const room = await this.chatService.getRoomById(roomId);
      const senderName = (Array.isArray(members) ? members : []).find(m => m.userId === senderId)?.fullName || 'Xodim';
      const preview = content ? (content.length > 100 ? content.slice(0, 100) + '...' : content) : '📎 Fayl';

      for (const member of members) {
        if (member.userId === senderId) continue;
        await this.notificationBot.handleErpEvent({
          event: 'chat.new_message',
          employeeId: Number(member.userId),
          data: { senderName, roomName: room?.name || 'Shaxsiy chat', preview },
        });
      }
    } catch (err) {
      this.logger.warn(`Telegram notification failed: ${err}`);
    }
  }
}
