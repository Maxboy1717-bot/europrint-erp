/**
 * @module chat-admin.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { chatRooms, chatMembers, appUsers, chatMessages } from '@shared/db';
import { AdminRoom, AdminRoomMember } from '../chat-admin.service';

@Injectable()
export class ChatAdminRepository {
  private readonly logger = new Logger(ChatAdminRepository.name);

  async findAllRooms(): Promise<Result<AdminRoom[]>> {
    try {
      const rows = await db.select({
        id:           chatRooms.id,
        name:         chatRooms.name,
        type:         chatRooms.type,
        created_at:   chatRooms.createdAt,
        is_archived:  sql<boolean>`COALESCE(${chatRooms.isArchived}, false)`,
        member_count: sql<number>`CAST(COUNT(${chatMembers.id}) AS integer)`,
      })
        .from(chatRooms)
        .leftJoin(chatMembers, eq(chatMembers.roomId, chatRooms.id))
        .groupBy(chatRooms.id)
        .orderBy(sql`${chatRooms.createdAt} DESC`)
        .limit(100);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => ({
        id:          String(r.id),
        name:        String(r.name ?? ''),
        type:        String(r.type ?? ''),
        memberCount: Number(r.member_count ?? 0),
        isArchived:  Boolean(r.is_archived),
        createdAt:   String(r.created_at),
      })));
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findRoomMembers(roomId: string): Promise<Result<AdminRoomMember[]>> {
    try {
      const rows = await db.select({
        user_id:   chatMembers.userId,
        full_name: appUsers.full_name,
        role:      chatMembers.role,
        joined_at: chatMembers.joinedAt,
      })
        .from(chatMembers)
        .innerJoin(appUsers, sql`${appUsers.id}::text = ${chatMembers.userId}`)
        .where(eq(chatMembers.roomId, roomId))
        .orderBy(sql`${chatMembers.joinedAt} DESC`);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => ({
        userId:   String(r.user_id),
        fullName: String(r.full_name ?? ''),
        role:     String(r.role ?? 'member'),
        joinedAt: String(r.joined_at),
      })));
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async roomExistsById(roomId: string): Promise<Result<boolean>> {
    try {
      const r = await db.select({ id: chatRooms.id }).from(chatRooms)
        .where(eq(chatRooms.id, roomId)).limit(1);
      return Ok(r.length > 0);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async setRoomArchived(roomId: string): Promise<Result<void>> {
    try {
      await db.update(chatRooms).set({ isArchived: true })
        .where(eq(chatRooms.id, roomId));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async deleteMember(roomId: string, userId: string): Promise<Result<void>> {
    try {
      await db.delete(chatMembers)
        .where(and(eq(chatMembers.roomId, roomId), eq(chatMembers.userId, userId)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async memberExists(roomId: string, userId: string): Promise<Result<boolean>> {
    try {
      const r = await db.select({ id: chatMembers.id }).from(chatMembers)
        .where(and(eq(chatMembers.roomId, roomId), eq(chatMembers.userId, userId))).limit(1);
      return Ok(r.length > 0);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async setMemberRole(roomId: string, userId: string, role: string): Promise<Result<void>> {
    try {
      await db.update(chatMembers).set({ role })
        .where(and(eq(chatMembers.roomId, roomId), eq(chatMembers.userId, userId)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findAuditLogs(limit: number): Promise<Result<unknown[]>> {
    try {
      const rows = await db.select({
        event_type:  sql<string>`'message'`,
        event_id:    chatMessages.id,
        user_id:     chatMessages.senderId,
        user_name:   appUsers.full_name,
        room_id:     chatMessages.roomId,
        room_name:   chatRooms.name,
        event_at:    chatMessages.createdAt,
        detail:      sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text}, '')`,
      })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${chatMessages.senderId}`)
        .leftJoin(chatRooms, eq(chatRooms.id, chatMessages.roomId))
        .where(eq(chatMessages.isDeleted, false))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error).message);
    }
  }
}
