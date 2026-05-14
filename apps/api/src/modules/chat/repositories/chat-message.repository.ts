/**
 * @module chat-message.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { ChatMessageBaseRepository } from './chat-message-base.repository';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { chatMessages, chatMembers, chatReactions, chatPolls, chatPollVotes, chatStarredMessages, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';


@Injectable()
export class ChatMessageRepository extends ChatMessageBaseRepository {
  async insertForwardedMessage(
    targetRoomIdStr: string, senderIdStr: string,
    orig: Record<string, unknown>, msgIdStr: string,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          room_id: targetRoomIdStr,
          sender_id: senderIdStr,
          content: orig.msg_content as string | null,
          file_url: (orig.file_url as string) ?? null,
          file_name: (orig.file_name as string) ?? null,
          file_type: (orig.file_type as string) ?? null,
          message_type: orig.message_type as string,
          forward_from_id: msgIdStr,
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
          roomId: chatMessages.room_id,
          senderId: chatMessages.sender_id,
          content: sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          messageType: sql<string>`LOWER(${chatMessages.message_type})`,
          isDeleted: chatMessages.is_deleted,
          isEdited: chatMessages.is_edited,
          threadRootId: chatMessages.thread_root_id,
          createdAt: chatMessages.created_at,
          senderName: appUsers.full_name,
          senderAvatar: appUsers.profile_image_url,
        })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.sender_id}::int`)
        .where(and(eq(chatMessages.thread_root_id, rootMsgIdStr), eq(chatMessages.is_deleted, false)))
        .orderBy(chatMessages.created_at);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findRootMessageRoomId(rootMsgIdStr: string, requireNotDeleted = false): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const cond = requireNotDeleted
        ? and(eq(chatMessages.id, rootMsgIdStr), eq(chatMessages.is_deleted, false))
        : eq(chatMessages.id, rootMsgIdStr);
      const [row] = await db
        .select({ room_id: chatMessages.room_id })
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
          room_id: roomId as string,
          sender_id: senderIdStr,
          content,
          message_type: 'TEXT',
          thread_root_id: rootMsgIdStr,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async incrementThreadCount(rootMsgIdStr: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ thread_count: sql`COALESCE(${chatMessages.thread_count}, 0) + 1` })
      .where(eq(chatMessages.id, rootMsgIdStr));
  }

  async countThreadMessages(rootMsgIdStr: string): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(chatMessages)
        .where(and(eq(chatMessages.thread_root_id, rootMsgIdStr), eq(chatMessages.is_deleted, false)));
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
          room_id: roomIdStr,
          sender_id: senderIdStr,
          content: fileName,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          message_type: messageType,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findMessageRoomForReaction(msgIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ room_id: chatMessages.room_id })
        .from(chatMessages)
        .where(and(eq(chatMessages.id, msgIdStr), eq(chatMessages.is_deleted, false)))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async findReaction(msgIdStr: string, userIdStr: string, emoji: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db
        .select({ found: sql<number>`1` })
        .from(chatReactions)
        .where(
          and(
            eq(chatReactions.message_id, msgIdStr),
            eq(chatReactions.user_id, userIdStr),
            eq(chatReactions.emoji, emoji),
          ),
        )
        .limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async deleteReaction(msgIdStr: string, userIdStr: string, emoji: string): Promise<void> {
    await db
      .delete(chatReactions)
      .where(
        and(
          eq(chatReactions.message_id, msgIdStr),
          eq(chatReactions.user_id, userIdStr),
          eq(chatReactions.emoji, emoji),
        ),
      );
  }

  async insertReaction(msgIdStr: string, userIdStr: string, emoji: string): Promise<void> {
    await db
      .insert(chatReactions)
      .values({ message_id: msgIdStr, user_id: userIdStr, emoji })
      .onConflictDoNothing();
  }

  async findReactions(msgIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          emoji: chatReactions.emoji,
          count: sql<number>`COUNT(*)::int`,
          users: sql<unknown>`json_agg(${appUsers.full_name})`,
          userIds: sql<unknown>`json_agg(${chatReactions.user_id})`,
        })
        .from(chatReactions)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatReactions.user_id}::int`)
        .where(eq(chatReactions.message_id, msgIdStr))
        .groupBy(chatReactions.emoji);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async insertPollMessage(roomIdStr: string, senderIdStr: string, question: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          room_id: roomIdStr,
          sender_id: senderIdStr,
          content: question,
          message_type: 'POLL',
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async insertPoll(
    msgIdStr: string, question: string, optionsJson: string,
    isMultiple: boolean, isAnonymous: boolean,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatPolls)
        .values({
          message_id: msgIdStr,
          question,
          options: sql`${optionsJson}::jsonb`,
          is_multiple: isMultiple,
          is_anonymous: isAnonymous,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findPollWithRoom(pollIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatPolls.id,
          message_id: chatPolls.message_id,
          is_multiple: chatPolls.is_multiple,
          is_anonymous: chatPolls.is_anonymous,
          room_id: chatMessages.room_id,
        })
        .from(chatPolls)
        .innerJoin(chatMessages, eq(chatMessages.id, chatPolls.message_id))
        .where(eq(chatPolls.id, pollIdStr))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async deletePollVotes(pollIdStr: string, userIdStr: string): Promise<void> {
    await db
      .delete(chatPollVotes)
      .where(and(eq(chatPollVotes.poll_id, pollIdStr), eq(chatPollVotes.user_id, userIdStr)));
  }

  async insertPollVote(pollIdStr: string, userIdStr: string, idx: number): Promise<void> {
    await db
      .insert(chatPollVotes)
      .values({ poll_id: pollIdStr, user_id: userIdStr, option_index: idx })
      .onConflictDoNothing();
  }

  async findPollVotes(pollIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          option_index: chatPollVotes.option_index,
          user_id: chatPollVotes.user_id,
          full_name: appUsers.full_name,
        })
        .from(chatPollVotes)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatPollVotes.user_id}::int`)
        .where(eq(chatPollVotes.poll_id, pollIdStr));
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findMessageRoomForStar(messageId: string): Promise<Result<{ room_id: string } | null>> {
    return safeCall(async () => {
      const [row] = await db.select({ room_id: chatMessages.room_id })
        .from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
      return row ?? null;
      }, 'DB_ERROR');
  }

  async checkMembershipByRoom(roomId: string, userId: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const [row] = await db.select({ id: chatMembers.id })
        .from(chatMembers)
        .where(and(eq(chatMembers.room_id, roomId), eq(chatMembers.user_id, userId)))
        .limit(1);
      return !!row;
      }, 'DB_ERROR');
  }

  async starMessage(messageId: string, userId: string): Promise<void> {
    await db.insert(chatStarredMessages)
      .values({ message_id: messageId, user_id: userId })
      .onConflictDoNothing();
  }

  async unstarMessage(messageId: string, userId: string): Promise<void> {
    await db.delete(chatStarredMessages)
      .where(and(eq(chatStarredMessages.message_id, messageId), eq(chatStarredMessages.user_id, userId)));
  }
}
