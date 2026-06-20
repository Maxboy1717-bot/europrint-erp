/**
 * @module chat-room.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 *   User-lookup helpers are now in chat-room-users.repository.ts to keep this file <300 lines.
 *   This class delegates to ChatRoomUsersRepository via composition (preserves public API).
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { chatRooms, chatMembers, appUsers } from '@shared/db';
import { ensureChatTables as _ensureChatTables, runChatMigrations as _runChatMigrations, ensureChatTrigger as _ensureChatTrigger } from '@common/database/ddl-migrations';
import { safeCall, Result } from '@common/result';
import { ChatRoomUsersRepository } from './chat-room-users.repository';

@Injectable()
export class ChatRoomRepository {
  private readonly logger = new Logger(ChatRoomRepository.name);
  private readonly users = new ChatRoomUsersRepository();

  async ensureChatTables(): Promise<void> {
    await _ensureChatTables();
  }

  async runChatMigrations(migrations: string[]): Promise<void> {
    await _runChatMigrations(migrations);
  }

  async ensureChatTrigger(): Promise<void> {
    await _ensureChatTrigger();
  }

  async findDirectRoom(userAStr: string, userBStr: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: chatRooms.type,
          created_at: chatRooms.createdAt,
        })
        .from(chatRooms)
        .where(
          and(
            eq(chatRooms.type, 'DIRECT'),
            sql`EXISTS (SELECT 1 FROM chat_members WHERE room_id = ${chatRooms.id} AND user_id = ${userAStr})`,
            sql`EXISTS (SELECT 1 FROM chat_members WHERE room_id = ${chatRooms.id} AND user_id = ${userBStr})`,
            sql`(SELECT COUNT(*) FROM chat_members WHERE room_id = ${chatRooms.id}) = 2`,
          ),
        )
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async createDirectRoom(userAStr: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatRooms)
        .values({ type: 'DIRECT', createdBy: userAStr })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async insertMember(roomId: string, userId: string, role?: string): Promise<void> {
    await db
      .insert(chatMembers)
      .values({ roomId: roomId, userId: userId, ...(role ? { role } : {}) })
      .onConflictDoNothing();
  }

  async findDepartmentRoom(departmentId: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: chatRooms.type,
          created_at: chatRooms.createdAt,
        })
        .from(chatRooms)
        .where(
          and(
            eq(chatRooms.type, 'CONTEXT'),
            eq(chatRooms.contextType, 'department'),
            eq(chatRooms.contextId, departmentId),
          ),
        )
        .limit(1);
      return (castTo<Record<string, unknown>>(row)) ?? null;
      }, 'DB_ERROR');
  }

  async createDepartmentRoom(
    departmentName: string, departmentId: string, createdBy: string,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatRooms)
        .values({
          name: departmentName,
          type: 'CONTEXT',
          contextType: 'department',
          contextId: departmentId,
          createdBy: createdBy,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findUserDepartments(userId: number) { return this.users.findUserDepartments(userId); }

  async findRoomsForUser(userIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: sql<string>`CASE WHEN ${chatRooms.type} = 'CONTEXT' AND ${chatRooms.contextType} = 'department' THEN 'department' ELSE LOWER(${chatRooms.type}) END`,
          contextType: chatRooms.contextType,
          contextId: chatRooms.contextId,
          createdAt: chatRooms.createdAt,
          lastReadAt: chatMembers.lastReadAt,
          memberRole: chatMembers.role,
          unreadCount: sql<number>`COALESCE(${chatMembers.unreadCount}, 0)`,
          lastMessage: sql<unknown>`(SELECT json_build_object('id', m.id, 'content', COALESCE(m.content, m.text), 'senderName', (u.first_name || ' ' || u.last_name), 'createdAt', m.created_at, 'messageType', LOWER(m.message_type)) FROM chat_messages m LEFT JOIN users u ON u.id = m.sender_id::int WHERE m.room_id = ${chatRooms.id} AND m.is_deleted = false ORDER BY m.created_at DESC LIMIT 1)`,
          displayName: sql<string>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT (u.first_name || ' ' || u.last_name) FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE ${chatRooms.name} END`,
          avatarUrl: sql<string>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT u.profile_image_url FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE NULL END`,
          otherUserId: sql<unknown>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT u.id FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE NULL END`,
        })
        .from(chatRooms)
        .innerJoin(chatMembers, and(eq(chatMembers.roomId, chatRooms.id), eq(chatMembers.userId, userIdStr)))
        .orderBy(
          sql`(SELECT created_at FROM chat_messages WHERE room_id = ${chatRooms.id} AND is_deleted = false ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST`,
          sql`${chatRooms.createdAt} DESC`,
        );
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findRoomById(roomIdStr: string): Promise<Result<Record<string, unknown> | undefined>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: chatRooms.type,
          contextType: chatRooms.contextType,
          contextId: chatRooms.contextId,
          createdBy: chatRooms.createdBy,
          createdAt: chatRooms.createdAt,
        })
        .from(chatRooms)
        .where(eq(chatRooms.id, roomIdStr))
        .limit(1);
      return castTo<Record<string, unknown> | undefined>(row);
      }, 'DB_ERROR');
  }

  async findRoomMembers(roomIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          userId: chatMembers.userId,
          fullName: appUsers.full_name,
          avatarUrl: appUsers.profile_image_url,
          employeeId: appUsers.employee_id,
          role: chatMembers.role,
          joinedAt: chatMembers.joinedAt,
        })
        .from(chatMembers)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMembers.userId}::int`)
        .where(eq(chatMembers.roomId, roomIdStr))
        .orderBy(chatMembers.joinedAt);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async createGroupRoom(name: string, createdByStr: string, type: 'GROUP' | 'CHANNEL' = 'GROUP'): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatRooms)
        .values({ name, type, createdBy: createdByStr })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async updateRoomReadAt(roomIdStr: string, userIdStr: string): Promise<void> {
    await db
      .update(chatMembers)
      .set({ lastReadAt: sql`NOW()`, unreadCount: 0 })
      .where(and(eq(chatMembers.roomId, roomIdStr), eq(chatMembers.userId, userIdStr)));
  }

  async checkMembership(roomId: string, userId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db
        .select({ found: sql<number>`1` })
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.roomId, roomId),
            sql`${chatMembers.userId} = ${userId}::text`,
          ),
        )
        .limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async getTotalUnread(userIdStr: string): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ total: sql<number>`COALESCE(SUM(COALESCE(${chatMembers.unreadCount}, 0)), 0)::int` })
        .from(chatMembers)
        .where(eq(chatMembers.userId, userIdStr));
      return Number(row?.total ?? 0);
      }, 'DB_ERROR');
  }

  /**
   * Bulk unread counts for multiple users — 1 SQL instead of N.
   * Uses raw parameterised sql (no sql.raw variable) per Qoida B.
   */
  async getBulkUnreadCounts(userIds: number[]): Promise<Result<Record<number, number>>> {
    return safeCall(async () => {
      if (!userIds.length) return {} as Record<number, number>;
      const rows = await db.execute<{ user_id: number; total: number }>(
        sql`SELECT user_id::int, COALESCE(SUM(unread_count), 0)::int AS total
            FROM chat_members
            WHERE user_id::int = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}])
            GROUP BY user_id`,
      );
      const map: Record<number, number> = {};
      for (const row of (Array.isArray(rows) ? rows : (rows as { rows?: { user_id: number; total: number }[] }).rows ?? [])) {
        map[Number(row.user_id)] = Number(row.total);
      }
      return map;
    }, 'DB_ERROR');
  }

  async findAllEmployees(search?: string) { return this.users.findAllEmployees(search); }
  async findUserByAdminId(rawId: string) { return this.users.findUserByAdminId(rawId); }
  async findUserIdByUsername(username: string) { return this.users.findUserIdByUsername(username); }
  async findUserById(rawId: string) { return this.users.findUserById(rawId); }

  async updateMemberMute(roomIdStr: string, userIdStr: string, muted: boolean): Promise<void> {
    await db
      .update(chatMembers)
      .set({ isMuted: muted, mutedUntil: null })
      .where(and(eq(chatMembers.roomId, roomIdStr), eq(chatMembers.userId, userIdStr)));
  }

  async findTodayBirthdays() { return this.users.findTodayBirthdays(); }
}
