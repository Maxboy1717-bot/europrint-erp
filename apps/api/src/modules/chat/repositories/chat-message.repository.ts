/**
 * @module chat-message.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * Poll/reaction/star methods are mixed in via ChatMessagePollsRepository (inheritance).
 */

import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { chatMessages, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { ChatMessagePollsRepository } from './chat-message-polls.repository';


@Injectable()
export class ChatMessageRepository extends ChatMessagePollsRepository {
  async insertForwardedMessage(
    targetRoomIdStr: string, senderIdStr: string,
    orig: Record<string, unknown>, msgIdStr: string,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          roomId: targetRoomIdStr,
          senderId: senderIdStr,
          content: orig.msg_content as string | null,
          fileUrl: (orig.file_url as string) ?? null,
          fileName: (orig.file_name as string) ?? null,
          fileType: (orig.file_type as string) ?? null,
          messageType: orig.message_type as string,
          forwardFromId: msgIdStr,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findThreadMessages(rootMsgIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: chatMessages.id,
          roomId: chatMessages.roomId,
          senderId: chatMessages.senderId,
          content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          messageType: sql<string>`LOWER(${chatMessages.messageType})`,
          isDeleted: chatMessages.isDeleted,
          isEdited: chatMessages.isEdited,
          threadRootId: chatMessages.threadRootId,
          createdAt: chatMessages.createdAt,
          senderName: appUsers.full_name,
          senderAvatar: appUsers.profile_image_url,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(and(eq(chatMessages.threadRootId, rootMsgIdStr), eq(chatMessages.isDeleted, false)))
        .orderBy(chatMessages.createdAt);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findRootMessageRoomId(rootMsgIdStr: string, requireNotDeleted = false): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const cond = requireNotDeleted
        ? and(eq(chatMessages.id, rootMsgIdStr), eq(chatMessages.isDeleted, false))
        : eq(chatMessages.id, rootMsgIdStr);
      const [row] = await db
        .select({ room_id: chatMessages.roomId })
        .from(chatMessages)
        .where(cond)
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async insertThreadMessage(roomId: unknown, senderIdStr: string, content: string, rootMsgIdStr: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          roomId: roomId as string,
          senderId: senderIdStr,
          content,
          messageType: 'TEXT',
          threadRootId: rootMsgIdStr,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async incrementThreadCount(rootMsgIdStr: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ threadCount: sql`COALESCE(${chatMessages.threadCount}, 0) + 1` })
      .where(eq(chatMessages.id, rootMsgIdStr));
  }

  async countThreadMessages(rootMsgIdStr: string): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(chatMessages)
        .where(and(eq(chatMessages.threadRootId, rootMsgIdStr), eq(chatMessages.isDeleted, false)));
      return Number(row?.count ?? 0);
      }, 'DB_ERROR');
  }

  async insertFileMessage(
    roomIdStr: string, senderIdStr: string, fileName: string,
    fileUrl: string, fileType: string, messageType: string,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          roomId: roomIdStr,
          senderId: senderIdStr,
          content: fileName,
          fileUrl: fileUrl,
          fileName: fileName,
          fileType: fileType,
          messageType: messageType,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }
}
