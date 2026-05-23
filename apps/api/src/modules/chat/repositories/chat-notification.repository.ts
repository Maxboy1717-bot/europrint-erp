/**
 * @module chat-notification.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, safeCall, isErr } from '@common/result';
import { db } from '@shared/db';
import { sql, eq, and } from 'drizzle-orm';
import { chatMessages, chatMembers, chatRooms, appUsers, chatMessageTasks } from '@shared/db';
import { ChatNotificationItem, MessageTask } from '../chat-notifications.service';

type Row = Record<string, unknown>;

@Injectable()
export class ChatNotificationRepository {
  private readonly logger = new Logger(ChatNotificationRepository.name);

  async findUnreadForUser(userId: number): Promise<Result<ChatNotificationItem[]>> {
    const res = await safeCall(async () => {
      return db.select({
        id:          chatMessages.id,
        room_id:     chatMessages.roomId,
        content:     chatMessages.content,
        created_at:  chatMessages.createdAt,
        room_name:   chatRooms.name,
        sender_name: appUsers.full_name,
        last_read_at: chatMembers.lastReadAt,
      })
        .from(chatMessages)
        .innerJoin(chatMembers, and(
          eq(chatMembers.roomId, chatMessages.roomId),
          sql`${chatMembers.userId}::int = ${userId}`,
        ))
        .innerJoin(chatRooms, sql`${chatRooms.id} = ${chatMessages.roomId}`)
        .innerJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(and(
          sql`${chatMessages.senderId}::int != ${userId}`,
          eq(chatMessages.isDeleted, false),
          sql`(${chatMembers.lastReadAt} IS NULL OR ${chatMessages.createdAt} > ${chatMembers.lastReadAt})`,
        ))
        .orderBy(sql`${chatMessages.createdAt} DESC`)
        .limit(50);
    });
    if (isErr(res)) return Err(res.error);
    const items: ChatNotificationItem[] = Array.isArray(res.data) ? (Array.isArray(res.data) ? res.data : []).map((r) => ({
      id:        String(r.id),
      type:      'MESSAGE' as const,
      roomId:    String(r.room_id),
      messageId: String(r.id),
      roomName:  String(r.room_name ?? ''),
      title:     String(r.sender_name ?? 'Xabar'),
      body:      String(r.content ?? '').slice(0, 100),
      isRead:    false,
      createdAt: String(r.created_at),
    })) : [];
    return Ok(items);
  }

  async markAllReadForUser(userId: number): Promise<Result<{ updated: number }>> {
    try {
      const result = await db.update(chatMembers)
        .set({ lastReadAt: _time.now() })
        .where(sql`${chatMembers.userId}::int = ${userId}`)
        .returning({ id: chatMembers.id });
      return Ok({ updated: result.length });
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findMessageRoomAndTime(messageId: string): Promise<Result<{ roomId: unknown; createdAt: string } | null>> {
    const res = await safeCall(async () =>
      db.select({ room_id: chatMessages.roomId, created_at: chatMessages.createdAt })
        .from(chatMessages)
        .where(sql`${chatMessages.id}::text = ${messageId}`)
        .limit(1)
    );
    if (isErr(res)) return Err(res.error);
    if (!Array.isArray(res.data) || res.data.length === 0) return Ok(null);
    const r = res.data[0];
    return Ok({ roomId: r.room_id, createdAt: String(r.created_at) });
  }

  async isMember(roomId: unknown, userId: number): Promise<Result<boolean>> {
    const res = await safeCall(async () =>
      db.select({ id: chatMembers.id }).from(chatMembers)
        .where(and(sql`${chatMembers.roomId} = ${roomId}`, sql`${chatMembers.userId}::int = ${userId}`))
        .limit(1)
    );
    if (isErr(res)) return Err(res.error);
    return Ok(Array.isArray(res.data) && res.data.length > 0);
  }

  async markReadUpToTimestamp(roomId: unknown, userId: number, upToTimestamp: string): Promise<Result<void>> {
    try {
      await db.update(chatMembers).set({
        lastReadAt: sql`GREATEST(COALESCE(${chatMembers.lastReadAt}, '1970-01-01'::timestamptz), ${upToTimestamp}::timestamptz)`,
      }).where(and(sql`${chatMembers.roomId} = ${roomId}`, sql`${chatMembers.userId}::int = ${userId}`));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async searchMessages(userId: number, query: string): Promise<Result<object[]>> {
    const res = await safeCall(async () => {
      return db.select({
        id:          chatMessages.id,
        room_id:     chatMessages.roomId,
        content:     chatMessages.content,
        created_at:  chatMessages.createdAt,
        room_name:   chatRooms.name,
        sender_name: appUsers.full_name,
      })
        .from(chatMessages)
        .innerJoin(chatMembers, and(
          eq(chatMembers.roomId, chatMessages.roomId),
          sql`${chatMembers.userId}::int = ${userId}`,
        ))
        .innerJoin(chatRooms, sql`${chatRooms.id} = ${chatMessages.roomId}`)
        .innerJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(and(
          eq(chatMessages.isDeleted, false),
          sql`${chatMessages.content} ILIKE ${'%' + query.trim() + '%'}`,
        ))
        .orderBy(sql`${chatMessages.createdAt} DESC`)
        .limit(30);
    });
    if (isErr(res)) return Err(res.error);
    return Ok(Array.isArray(res.data) ? res.data : []);
  }

  async findTasksForUser(userId: number): Promise<Result<MessageTask[]>> {
    const res = await safeCall(async () => {
      return db.select({
        id:          chatMessageTasks.id,
        room_id:     chatMessageTasks.roomId,
        message_id:  chatMessageTasks.messageId,
        title:       chatMessageTasks.title,
        assigned_to: chatMessageTasks.assignedTo,
        due_date:    chatMessageTasks.dueDate,
        priority:    chatMessageTasks.priority,
        status:      chatMessageTasks.status,
        created_at:  chatMessageTasks.createdAt,
      })
        .from(chatMessageTasks)
        .innerJoin(chatMessages, eq(chatMessages.id, chatMessageTasks.messageId))
        .innerJoin(chatMembers, and(
          eq(chatMembers.roomId, chatMessages.roomId),
          sql`${chatMembers.userId}::int = ${userId}`,
        ))
        .orderBy(sql`${chatMessageTasks.createdAt} DESC`)
        .limit(50);
    });
    if (isErr(res)) return Ok([]);
    const tasks: MessageTask[] = Array.isArray(res.data) ? (Array.isArray(res.data) ? res.data : []).map((r) => ({
      id:         String(r.id),
      roomId:     String(r.room_id ?? ''),
      messageId:  String(r.message_id ?? ''),
      title:      String(r.title ?? ''),
      assignedTo: r.assigned_to ? String(r.assigned_to) : null,
      dueDate:    r.due_date ? String(r.due_date) : null,
      priority:   String(r.priority ?? 'medium'),
      status:     String(r.status ?? 'open'),
      createdAt:  String(r.created_at),
    })) : [];
    return Ok(tasks);
  }

  async checkMemberForRoom(callerId: number, roomId: string): Promise<Result<boolean>> {
    const res = await safeCall(async () =>
      db.select({ id: chatMembers.id }).from(chatMembers)
        .where(and(eq(chatMembers.roomId, roomId), sql`${chatMembers.userId}::int = ${callerId}`))
        .limit(1)
    );
    if (isErr(res)) return Err(res.error);
    return Ok(Array.isArray(res.data) && res.data.length > 0);
  }

  async messageInRoom(messageId: string, roomId: string): Promise<Result<boolean>> {
    const res = await safeCall(async () =>
      db.select({ id: chatMessages.id }).from(chatMessages)
        .where(and(eq(chatMessages.id, messageId), eq(chatMessages.roomId, roomId)))
        .limit(1)
    );
    if (isErr(res)) return Err(res.error);
    return Ok(Array.isArray(res.data) && res.data.length > 0);
  }

  async insertTask(messageId: string, title: string, assignedTo: string | null, dueDate: string | null, priority: string): Promise<Result<Row>> {
    try {
      const rows = await db.insert(chatMessageTasks).values({
        messageId:  messageId,
        title,
        assignedTo: assignedTo ?? null,
        dueDate:    dueDate ?? null,
        priority,
      }).returning();
      return Ok((rows[0] ?? {}) as Row);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findOrCreateContextRoom(userId: number, contextType: string, contextId: string): Promise<Result<{ roomId: string; roomName: string }>> {
    const existing = await safeCall(async () =>
      db.select({ id: chatRooms.id, name: chatRooms.name }).from(chatRooms)
        .where(and(
          sql`${chatRooms.type} = ${contextType}`,
          sql`${chatRooms.name} LIKE ${'%' + contextId + '%'}`,
        ))
        .limit(1)
    );
    if (isErr(existing)) return Err(existing.error);
    if (Array.isArray(existing.data) && existing.data.length > 0) {
      const r = existing.data[0];
      return Ok({ roomId: String(r.id), roomName: String(r.name ?? '') });
    }
    try {
      const created = await db.insert(chatRooms).values({
        name:      contextType + ':' + contextId,
        type:      contextType,
        createdBy: String(userId),
      }).returning({ id: chatRooms.id, name: chatRooms.name });
      const r = created[0];
      await db.insert(chatMembers).values({
        roomId: String(r.id),
        userId: String(userId),
      }).onConflictDoNothing();
      return Ok({ roomId: String(r.id), roomName: String(r.name ?? '') });
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
