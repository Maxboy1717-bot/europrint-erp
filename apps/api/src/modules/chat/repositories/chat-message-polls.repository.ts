/**
 * @module chat-message-polls.repository
 * @description Repository layer for chat polls, reactions, stars (split from chat-message.repository).
 */

import { ChatMessageBaseRepository } from './chat-message-base.repository';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { chatMessages, chatMembers, chatReactions, chatPolls, chatPollVotes, chatStarredMessages, appUsers } from '@shared/db';
import { safeCall, Result } from '@common/result';

@Injectable()
export class ChatMessagePollsRepository extends ChatMessageBaseRepository {
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
