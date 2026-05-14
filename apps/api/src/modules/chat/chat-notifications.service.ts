/**
 * @module chat-notifications.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, isErr } from '@common/result';
import { ChatNotificationRepository } from './repositories/chat-notification.repository';

export interface ChatNotificationItem {
  id: string;
  type: 'MENTION' | 'REPLY' | 'MESSAGE' | 'SYSTEM';
  roomId: string;
  messageId: string;
  roomName: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageTask {
  id: string;
  roomId: string;
  messageId: string;
  title: string;
  assignedTo: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
}

@Injectable()
export class ChatNotificationsService {
  private readonly logger = new Logger(ChatNotificationsService.name);

  constructor(private readonly repo: ChatNotificationRepository) {}

  async getNotifications(userId: number): Promise<Result<{ notifications: ChatNotificationItem[]; unreadCount: number }>> {
    const result = await this.repo.findUnreadForUser(userId);
    if (isErr(result)) return Err(result.error);
    return Ok({ notifications: result.data, unreadCount: result.data.length });
  }

  async markAllRead(userId: number): Promise<Result<{ updated: number }>> {
    return this.repo.markAllReadForUser(userId);
  }

  async markOneRead(userId: number, notificationId: string): Promise<Result<{ id: string; isRead: boolean }>> {
    const msgResult = await this.repo.findMessageRoomAndTime(notificationId);
    if (isErr(msgResult)) return Err(msgResult.error);
    if (!msgResult.data) return Err(AppErr('NOT_FOUND', 'Xabar topilmadi'));
    const { roomId, createdAt } = msgResult.data;
    const memberResult = await this.repo.isMember(roomId, userId);
    if (isErr(memberResult)) return Err(memberResult.error);
    if (!memberResult.data) return Err(AppErr('FORBIDDEN', "Bu xona a'zosi emassiz"));
    const updateResult = await this.repo.markReadUpToTimestamp(roomId, userId, createdAt);
    if (isErr(updateResult)) return Err(updateResult.error);
    return Ok({ id: notificationId, isRead: true });
  }

  async searchMessages(userId: number, query: string): Promise<Result<{ messages: unknown[] }>> {
    if (!query || query.trim().length < 2) return Ok({ messages: [] });
    const result = await this.repo.searchMessages(userId, query);
    if (isErr(result)) return Err(result.error);
    return Ok({ messages: result.data });
  }

  async getMessageTasks(userId: number): Promise<Result<{ tasks: MessageTask[] }>> {
    const result = await this.repo.findTasksForUser(userId);
    if (isErr(result)) return Ok({ tasks: [] });
    return Ok({ tasks: result.data });
  }

  async createMessageTask(
    callerId: number, roomId: string | number, messageId: string | number, title: string,
    assignedTo: string | number | null, dueDate: string | null, priority: string,
  ): Promise<Result<MessageTask>> {
    const roomIdStr = String(roomId);
    const messageIdStr = String(messageId);
    const memberCheck = await this.repo.checkMemberForRoom(callerId, roomIdStr);
    if (isErr(memberCheck)) return Err(memberCheck.error);
    if (!memberCheck.data) return Err(AppErr('FORBIDDEN', "Bu xona a'zosi emassiz"));
    const msgCheck = await this.repo.messageInRoom(messageIdStr, roomIdStr);
    if (isErr(msgCheck)) return Err(msgCheck.error);
    if (!msgCheck.data) return Err(AppErr('NOT_FOUND', 'Xabar topilmadi yoki boshqa xonaga tegishli'));
    const result = await this.repo.insertTask(messageIdStr, title, assignedTo !== null ? String(assignedTo) : null, dueDate, priority);
    if (isErr(result)) return Err(result.error);
    const r = result.data;
    return Ok<MessageTask>({
      id: String(r['id']), roomId: roomIdStr, messageId: String(r['message_id']),
      title: String(r['title']), assignedTo: r['assigned_to'] ? String(r['assigned_to']) : null,
      dueDate: r['due_date'] ? String(r['due_date']) : null,
      priority: String(r['priority']), status: String(r['status']), createdAt: String(r['created_at']),
    });
  }

  async getOrCreateContextRoom(userId: number, contextType: string, contextId: string): Promise<Result<{ roomId: string; roomName: string }>> {
    return this.repo.findOrCreateContextRoom(userId, contextType, contextId);
  }
}
