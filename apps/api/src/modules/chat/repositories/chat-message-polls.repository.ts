/**
 * @module chat-message-polls.repository
 * @description Repository layer for chat polls, reactions, stars (split from chat-message.repository).
 */

import { ChatMessageBaseRepository } from './chat-message-base.repository';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { chatMessages, chatMembers, chatReactions, chatPolls, chatPollVotes, chatStarredMessages, chatRooms, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

@Injectable()
export class ChatMessagePollsRepository extends ChatMessageBaseRepository {
  async findMessageRoomForReaction(msgIdStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ room_id: chatMessages.roomId })
        .from(chatMessages)
        .where(and(eq(chatMessages.id, msgIdStr), eq(chatMessages.isDeleted, false)))
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
            eq(chatReactions.messageId, msgIdStr),
            eq(chatReactions.userId, userIdStr),
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
          eq(chatReactions.messageId, msgIdStr),
          eq(chatReactions.userId, userIdStr),
          eq(chatReactions.emoji, emoji),
        ),
      );
  }

  async insertReaction(msgIdStr: string, userIdStr: string, emoji: string): Promise<void> {
    await db
      .insert(chatReactions)
      .values({ messageId: msgIdStr, userId: userIdStr, emoji })
      .onConflictDoNothing();
  }

  async findReactions(msgIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          emoji: chatReactions.emoji,
          count: sql<number>`COUNT(*)::int`,
          users: sql<unknown>`json_agg(${appUsers.full_name})`,
          userIds: sql<unknown>`json_agg(${chatReactions.userId})`,
        })
        .from(chatReactions)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatReactions.userId}::int`)
        .where(eq(chatReactions.messageId, msgIdStr))
        .groupBy(chatReactions.emoji);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async insertPollMessage(roomIdStr: string, senderIdStr: string, question: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatMessages)
        .values({
          roomId: roomIdStr,
          senderId: senderIdStr,
          content: question,
          messageType: 'POLL',
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
          messageId: msgIdStr,
          question,
          options: sql`${optionsJson}::jsonb`,
          isMultiple: isMultiple,
          isAnonymous: isAnonymous,
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
          message_id: chatPolls.messageId,
          is_multiple: chatPolls.isMultiple,
          is_anonymous: chatPolls.isAnonymous,
          room_id: chatMessages.roomId,
        })
        .from(chatPolls)
        .innerJoin(chatMessages, eq(chatMessages.id, chatPolls.messageId))
        .where(eq(chatPolls.id, pollIdStr))
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async deletePollVotes(pollIdStr: string, userIdStr: string): Promise<void> {
    await db
      .delete(chatPollVotes)
      .where(and(eq(chatPollVotes.pollId, pollIdStr), eq(chatPollVotes.userId, userIdStr)));
  }

  async insertPollVote(pollIdStr: string, userIdStr: string, idx: number): Promise<void> {
    await db
      .insert(chatPollVotes)
      .values({ pollId: pollIdStr, userId: userIdStr, optionIndex: idx })
      .onConflictDoNothing();
  }

  async findPollVotes(pollIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          option_index: chatPollVotes.optionIndex,
          user_id: chatPollVotes.userId,
          full_name: appUsers.full_name,
        })
        .from(chatPollVotes)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatPollVotes.userId}::int`)
        .where(eq(chatPollVotes.pollId, pollIdStr));
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findMessageRoomForStar(messageId: string): Promise<Result<{ room_id: string } | null>> {
    return safeCall(async () => {
      const [row] = await db.select({ room_id: chatMessages.roomId })
        .from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
      return row ?? null;
      }, 'DB_ERROR');
  }

  async checkMembershipByRoom(roomId: string, userId: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const [row] = await db.select({ id: chatMembers.id })
        .from(chatMembers)
        .where(and(eq(chatMembers.roomId, roomId), eq(chatMembers.userId, userId)))
        .limit(1);
      return !!row;
      }, 'DB_ERROR');
  }

  async starMessage(messageId: string, userId: string): Promise<void> {
    await db.insert(chatStarredMessages)
      .values({ messageId: messageId, userId: userId })
      .onConflictDoNothing();
  }

  async unstarMessage(messageId: string, userId: string): Promise<void> {
    await db.delete(chatStarredMessages)
      .where(and(eq(chatStarredMessages.messageId, messageId), eq(chatStarredMessages.userId, userId)));
  }

  async findStarredForUser(userId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          message_id:  chatStarredMessages.messageId,
          starred_at:  chatStarredMessages.createdAt,
          content:     sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text})`,
          sender_name: appUsers.full_name,
          room_id:     sql<string>`${chatMessages.roomId}::text`,
          room_name:   chatRooms.name,
        })
        .from(chatStarredMessages)
        .innerJoin(
          chatMessages,
          sql`${chatMessages.id}::text = ${chatStarredMessages.messageId} AND ${chatMessages.isDeleted} = false`,
        )
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMessages.senderId}::int`)
        .leftJoin(chatRooms, sql`${chatRooms.id}::text = ${chatMessages.roomId}::text`)
        .where(eq(chatStarredMessages.userId, userId))
        .orderBy(sql`${chatStarredMessages.createdAt} DESC`);
      return castTo<Record<string, unknown>[]>(rows);
    }, 'DB_ERROR');
  }
}
