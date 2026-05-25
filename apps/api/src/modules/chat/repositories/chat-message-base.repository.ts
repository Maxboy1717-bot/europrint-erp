/**
 * @module chat-message-base.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { db } from '@shared/db';
import { castTo } from '@common/db-rows';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { chatMessages, chatMembers, chatReactions, chatPolls, chatPollVotes, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';


export class ChatMessageBaseRepository {
  async checkMembership(roomId: string, userId: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db
        .select({ found: sql<number>`1` })
        .from(chatMembers)
        .where(and(eq(chatMembers.roomId, roomId), eq(chatMembers.userId, userId)))
        .limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async fetchMessages(
    roomIdStr: string, userIdStr: string, limit: number, before?: string,
  ): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: chatMessages.id,
          roomId: chatMessages.roomId,
          senderId: chatMessages.senderId,
          content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          fileUrl: chatMessages.fileUrl,
          fileName: chatMessages.fileName,
          fileType: chatMessages.fileType,
          messageType: sql<string>`LOWER(${chatMessages.messageType})`,
          isDeleted: chatMessages.isDeleted,
          isEdited: chatMessages.isEdited,
          isPinned: chatMessages.isPinned,
          replyToId: chatMessages.replyToId,
          threadRootId: chatMessages.threadRootId,
          forwardFromId: chatMessages.forwardFromId,
          threadCount: chatMessages.threadCount,
          createdAt: chatMessages.createdAt,
          senderName: appUsers.full_name,
          senderAvatar: appUsers.profile_image_url,
          senderEmployeeId: appUsers.employee_id,
          replyToMessage: sql<unknown>`CASE WHEN ${chatMessages.replyToId} IS NOT NULL THEN (SELECT json_build_object('id', rm.id, 'content', CASE WHEN rm.is_deleted THEN NULL ELSE COALESCE(rm.content, rm.text) END, 'senderName', (ru.first_name || ' ' || ru.last_name), 'messageType', LOWER(rm.message_type)) FROM chat_messages rm LEFT JOIN users ru ON ru.id = rm.sender_id::int WHERE rm.id = ${chatMessages.replyToId}) ELSE NULL END`,
          forwardFrom: sql<unknown>`CASE WHEN ${chatMessages.forwardFromId} IS NOT NULL THEN (SELECT json_build_object('id', fm.id, 'content', CASE WHEN fm.is_deleted THEN NULL ELSE COALESCE(fm.content, fm.text) END, 'senderName', (fu.first_name || ' ' || fu.last_name)) FROM chat_messages fm LEFT JOIN users fu ON fu.id = fm.sender_id::int WHERE fm.id = ${chatMessages.forwardFromId}) ELSE NULL END`,
          reactions: sql<unknown>`(SELECT json_agg(json_build_object('emoji', cr.emoji, 'count', cr.cnt, 'users', cr.user_names, 'userIds', cr.user_ids)) FROM (SELECT r.emoji, COUNT(*)::int AS cnt, json_agg(u2.first_name || ' ' || u2.last_name) AS user_names, json_agg(r.user_id) AS user_ids FROM chat_reactions r LEFT JOIN users u2 ON u2.id = r.user_id::int WHERE r.message_id = ${chatMessages.id} GROUP BY r.emoji) cr)`,
          poll: sql<unknown>`CASE WHEN ${chatMessages.messageType} = 'POLL' THEN (SELECT json_build_object('id', cp.id, 'question', cp.question, 'options', cp.options, 'isMultiple', cp.is_multiple, 'isAnonymous', cp.is_anonymous, 'totalVotes', (SELECT COUNT(*) FROM chat_poll_votes WHERE poll_id = cp.id), 'myVotes', (SELECT json_agg(option_index ORDER BY option_index) FROM chat_poll_votes WHERE poll_id = cp.id AND user_id = ${userIdStr}), 'votes', (SELECT json_object_agg(option_index::text, json_build_object('count', cnt, 'users', CASE WHEN cp.is_anonymous THEN '[]'::json ELSE user_names END)) FROM (SELECT option_index, COUNT(*)::int AS cnt, json_agg(u3.first_name || ' ' || u3.last_name) AS user_names FROM chat_poll_votes cpv LEFT JOIN users u3 ON u3.id = cpv.user_id::int WHERE poll_id = cp.id GROUP BY option_index) v)) FROM chat_polls cp WHERE cp.message_id = ${chatMessages.id} LIMIT 1) ELSE NULL END`,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(
          and(
            eq(chatMessages.roomId, roomIdStr),
            eq(chatMessages.isDeleted, false),
            isNull(chatMessages.threadRootId),
            before ? sql`${chatMessages.createdAt} < ${before}::timestamptz` : undefined,
          ),
        )
        .orderBy(sql`${chatMessages.createdAt} DESC`)
        .limit(limit);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async insertMessage(
    roomIdStr: string, senderIdStr: string, content: string | null,
    fileUrl: string | null, fileName: string | null, fileType: string | null,
    messageType: string, replyToIdStr: string | null,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          roomId: roomIdStr,
          senderId: senderIdStr,
          content,
          fileUrl: fileUrl,
          fileName: fileName,
          fileType: fileType,
          messageType: messageType,
          replyToId: replyToIdStr,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findUserInfo(userId: number): Promise<Result<Record<string, unknown> | undefined>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          full_name: appUsers.full_name,
          profile_image_url: appUsers.profile_image_url,
          employee_id: appUsers.employee_id,
        })
        .from(appUsers)
        .where(eq(appUsers.id, userId))
        .limit(1);
      return castTo<Record<string, unknown> | undefined>(row);
      }, 'DB_ERROR');
  }

  async findReplyMessage(replyToIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatMessages.id,
          content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          message_type: sql<string>`LOWER(${chatMessages.messageType})`,
          senderName: appUsers.full_name,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(eq(chatMessages.id, replyToIdStr))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async updateMessageContent(messageId: string | number, userId: number, content: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .update(chatMessages)
        .set({ content })
        .where(
          and(
            sql`${chatMessages.id} = ${messageId}::text`,
            sql`${chatMessages.senderId} = ${userId}::text`,
            eq(chatMessages.isDeleted, false),
          ),
        )
        .returning({
          id: chatMessages.id,
          roomId: chatMessages.roomId,
          content: chatMessages.content,
        });
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async softDeleteMessage(messageId: string | number, userId: number): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .update(chatMessages)
        .set({ isDeleted: true })
        .where(
          and(
            sql`${chatMessages.id} = ${messageId}::text`,
            sql`${chatMessages.senderId} = ${userId}::text`,
          ),
        )
        .returning({ id: chatMessages.id, roomId: chatMessages.roomId });
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async findMessageRoomId(msgIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ roomId: chatMessages.roomId })
        .from(chatMessages)
        .where(and(eq(chatMessages.id, msgIdStr), eq(chatMessages.isDeleted, false)))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async setPinned(msgIdStr: string, pin: boolean): Promise<void> {
    await db.update(chatMessages).set({ isPinned: pin }).where(eq(chatMessages.id, msgIdStr));
  }

  async findPinnedMessage(roomIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatMessages.id,
          content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          senderName: appUsers.full_name,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(
          and(
            eq(chatMessages.roomId, roomIdStr),
            eq(chatMessages.isPinned, true),
            eq(chatMessages.isDeleted, false),
          ),
        )
        .orderBy(sql`${chatMessages.createdAt} DESC`)
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async findMessageForForward(msgIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatMessages.id,
          room_id: chatMessages.roomId,
          sender_id: chatMessages.senderId,
          content: chatMessages.content,
          text: chatMessages.text,
          file_url: chatMessages.fileUrl,
          file_name: chatMessages.fileName,
          file_type: chatMessages.fileType,
          message_type: chatMessages.messageType,
          is_deleted: chatMessages.isDeleted,
          msg_content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          senderName: appUsers.full_name,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .where(and(eq(chatMessages.id, msgIdStr), eq(chatMessages.isDeleted, false)))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

}
