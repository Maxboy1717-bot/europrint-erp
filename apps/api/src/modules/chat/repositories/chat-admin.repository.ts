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
        created_at:   chatRooms.created_at,
        is_archived:  sql<boolean>`COALESCE(${chatRooms.is_archived}, false)`,
        member_count: sql<number>`CAST(COUNT(${chatMembers.id}) AS integer)`,
      })
        .from(chatRooms)
        .leftJoin(chatMembers, eq(chatMembers.room_id, chatRooms.id))
        .groupBy(chatRooms.id)
        .orderBy(sql`${chatRooms.created_at} DESC`)
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
        user_id:   chatMembers.user_id,
        full_name: appUsers.full_name,
        role:      chatMembers.role,
        joined_at: chatMembers.joined_at,
      })
        .from(chatMembers)
        .innerJoin(appUsers, sql`${appUsers.id}::text = ${chatMembers.user_id}`)
        .where(eq(chatMembers.room_id, roomId))
        .orderBy(sql`${chatMembers.joined_at} DESC`);
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
      await db.update(chatRooms).set({ is_archived: true })
        .where(eq(chatRooms.id, roomId));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async deleteMember(roomId: string, userId: string): Promise<Result<void>> {
    try {
      await db.delete(chatMembers)
        .where(and(eq(chatMembers.room_id, roomId), eq(chatMembers.user_id, userId)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async memberExists(roomId: string, userId: string): Promise<Result<boolean>> {
    try {
      const r = await db.select({ id: chatMembers.id }).from(chatMembers)
        .where(and(eq(chatMembers.room_id, roomId), eq(chatMembers.user_id, userId))).limit(1);
      return Ok(r.length > 0);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async setMemberRole(roomId: string, userId: string, role: string): Promise<Result<void>> {
    try {
      await db.update(chatMembers).set({ role })
        .where(and(eq(chatMembers.room_id, roomId), eq(chatMembers.user_id, userId)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findAuditLogs(limit: number): Promise<Result<unknown[]>> {
    try {
      const rows = await db.select({
        event_type:  sql<string>`'message'`,
        event_id:    chatMessages.id,
        user_id:     chatMessages.sender_id,
        user_name:   appUsers.full_name,
        room_id:     chatMessages.room_id,
        room_name:   chatRooms.name,
        event_at:    chatMessages.created_at,
        detail:      sql<string>`COALESCE(${chatMessages.content}, ${chatMessages.text}, '')`,
      })
        .from(chatMessages)
        .leftJoin(appUsers, sql`${appUsers.id}::text = ${chatMessages.sender_id}`)
        .leftJoin(chatRooms, eq(chatRooms.id, chatMessages.room_id))
        .where(eq(chatMessages.is_deleted, false))
        .orderBy(desc(chatMessages.created_at))
        .limit(limit);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error).message);
    }
  }
}
