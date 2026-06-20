/**
 * @module chat.gateway
 * @description NestJS WebSocket gateway. Socket.IO handlers.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { NotificationBotService } from '../hr/telegram-bots/notification-bot.service';
import { ChatGatewayHelperService } from './chat-gateway-helper.service';
import { ChatPresenceRepository } from './repositories/chat-presence.repository';
import {
  setChatServer,
  getChatServer as _getChatServer,
  broadcastToRoom as _broadcastToRoom,
  configureChatWsCors,
  chatWsCorsAllowed,
} from './chat-gateway.cors';

// Re-export for back-compat
export { _getChatServer as getChatServer, _broadcastToRoom as broadcastToRoom };

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (chatWsCorsAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS: origin '${origin}' ruxsat etilmagan`));
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationBot: NotificationBotService,
    private readonly jwtService: JwtService,
    private readonly helper: ChatGatewayHelperService,
    private readonly presenceRepo: ChatPresenceRepository,
    cfg: ConfigService,
  ) {
    configureChatWsCors(cfg.get<string>('ALLOWED_ORIGINS') ?? '', cfg.get<string>('NODE_ENV'));
  }

  afterInit(server: Server) {
    setChatServer(server);
    this.helper.setContext(server, this.userSockets);
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token) as Record<string, unknown>;
      const rawUserId = decoded['sub'] || decoded['id'] || decoded['userId'];
      const userId: number = typeof rawUserId === 'number'
        ? rawUserId
        : await this.chatService.resolveUserId(rawUserId as string);
      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.user = decoded;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      await this.chatService.getOrCreateDepartmentRooms(userId);

      const rooms = await this.chatService.getRoomsForUser(userId);
      for (const room of rooms) {
        client.join(`room:${room.id}`);
      }

      client.emit('connected', { userId, rooms, onlineUserIds: Array.from(this.userSockets.keys()) });

      const unread = await this.chatService.getTotalUnreadCount(userId);
      client.emit('unread_count', { count: unread });

      // Persist ONLINE status to DB so presence survives server restarts
      this.presenceRepo.upsertPresence(String(userId), 'ONLINE').catch((e: unknown) => {
        this.logger.warn(`Failed to persist ONLINE presence for user ${userId}: ${String(e)}`);
      });

      this.server.emit('user:online', { userId });
      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          // Persist OFFLINE status to DB — all sockets for this user are gone
          this.presenceRepo.upsertPresence(String(userId), 'OFFLINE').catch((e: unknown) => {
            this.logger.warn(`Failed to persist OFFLINE presence for user ${userId}: ${String(e)}`);
          });
          this.server.emit('user:offline', { userId });
        }
      }
    }
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('rooms:list')
  async handleGetRoomsNew(@ConnectedSocket() client: Socket) {
    return this.helper.handleGetRooms(client);
  }

  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: Socket) {
    return this.helper.handleGetRooms(client);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoomNew(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    return this.helper.handleJoinRoom(client, data);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    return this.helper.handleJoinRoom(client, data);
  }

  @SubscribeMessage('messages:list')
  async handleGetMessagesNew(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string; before?: string; limit?: number },
  ) {
    return this.helper.handleGetMessages(client, data);
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string; before?: string; limit?: number },
  ) {
    return this.helper.handleGetMessages(client, data);
  }

  @SubscribeMessage('message:send')
  async handleSendMessageNew(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string; content: string; replyToId?: string; fileUrl?: string; fileName?: string; fileType?: string },
  ) {
    return this.helper.handleSendMessage(client, data);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string; content: string; replyToId?: string; fileUrl?: string; fileName?: string; fileType?: string },
  ) {
    return this.helper.handleSendMessage(client, data);
  }

  @SubscribeMessage('mark:read')
  async handleMarkReadNew(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    return this.helper.handleMarkRead(client, data);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    return this.helper.handleMarkRead(client, data);
  }

  @SubscribeMessage('direct:start')
  async handleStartDirectNew(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: number },
  ) {
    return this.helper.handleStartDirect(client, data);
  }

  @SubscribeMessage('start_direct')
  async handleStartDirect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: number },
  ) {
    return this.helper.handleStartDirect(client, data);
  }

  @SubscribeMessage('reaction:toggle')
  async handleReactionToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string | number; emoji: string; roomId: string | number },
  ) {
    const userId = client.data.userId as number;
    if (!userId) return;
    try {
      const toggleResult = await this.chatService.toggleReaction(data.messageId, userId, data.emoji);
      const reactions = (toggleResult && typeof toggleResult === 'object' && 'ok' in toggleResult && toggleResult.ok) ? (toggleResult as { ok: true; data: unknown }).data : toggleResult;
      this.server.to(`room:${data.roomId}`).emit('reaction:updated', {
        messageId: String(data.messageId),
        roomId: String(data.roomId),
        userId,
        emoji: data.emoji,
        reactions,
      });
    } catch (err) {
      this.logger.warn(`reaction:toggle xato: ${err}`);
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    await this.helper.handleTyping(client, { roomId: data.roomId, isTyping: true });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string },
  ) {
    await this.helper.handleTyping(client, { roomId: data.roomId, isTyping: false });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number | string; isTyping: boolean },
  ) {
    await this.helper.handleTyping(client, data);
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number | string; content: string },
  ) {
    return this.helper.handleEditMessage(client, data);
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number | string },
  ) {
    return this.helper.handleDeleteMessage(client, data);
  }

  emitToUser(userId: number, event: string, data: Record<string, unknown>) {
    this.helper.emitToUser(userId, event, data);
  }

  emitToRoom(roomId: string | number, event: string, data: Record<string, unknown>) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }
}
