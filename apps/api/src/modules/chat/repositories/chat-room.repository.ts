/**
 * @module chat-room.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, or, isNull, sql } from 'drizzle-orm';
import { chatRooms, chatMembers, chatMessages, orgDepartments, employeeOrgDepartments, appUsers, adminsTable } from '@shared/db';
import { ensureChatTables as _ensureChatTables, runChatMigrations as _runChatMigrations, ensureChatTrigger as _ensureChatTrigger } from '@common/database/ddl-migrations';
import { safeCall, Result } from '@common/result';

@Injectable()
export class ChatRoomRepository {
  private readonly logger = new Logger(ChatRoomRepository.name);

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
          created_at: chatRooms.created_at,
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
        .values({ type: 'DIRECT', created_by: userAStr })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async insertMember(roomId: string, userId: string, role?: string): Promise<void> {
    await db
      .insert(chatMembers)
      .values({ room_id: roomId, user_id: userId, ...(role ? { role } : {}) })
      .onConflictDoNothing();
  }

  async findDepartmentRoom(departmentId: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: chatRooms.type,
          created_at: chatRooms.created_at,
        })
        .from(chatRooms)
        .where(
          and(
            eq(chatRooms.type, 'CONTEXT'),
            eq(chatRooms.context_type, 'department'),
            eq(chatRooms.context_id, departmentId),
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
          context_type: 'department',
          context_id: departmentId,
          created_by: createdBy,
        })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async findUserDepartments(userId: number): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({ id: orgDepartments.id, name: orgDepartments.name })
        .from(orgDepartments)
        .innerJoin(employeeOrgDepartments, eq(employeeOrgDepartments.org_department_id, orgDepartments.id))
        .where(and(eq(employeeOrgDepartments.user_id, userId), eq(orgDepartments.is_active, true)));
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findRoomsForUser(userIdStr: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          type: sql<string>`CASE WHEN ${chatRooms.type} = 'CONTEXT' AND ${chatRooms.context_type} = 'department' THEN 'department' ELSE LOWER(${chatRooms.type}) END`,
          contextType: chatRooms.context_type,
          contextId: chatRooms.context_id,
          createdAt: chatRooms.created_at,
          lastReadAt: chatMembers.last_read_at,
          memberRole: chatMembers.role,
          unreadCount: sql<number>`COALESCE(${chatMembers.unread_count}, 0)`,
          lastMessage: sql<unknown>`(SELECT json_build_object('id', m.id, 'content', COALESCE(m.content, m.text), 'senderName', (u.first_name || ' ' || u.last_name), 'createdAt', m.created_at, 'messageType', LOWER(m.message_type)) FROM chat_messages m LEFT JOIN users u ON u.id = m.sender_id::int WHERE m.room_id = ${chatRooms.id} AND m.is_deleted = false ORDER BY m.created_at DESC LIMIT 1)`,
          displayName: sql<string>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT (u.first_name || ' ' || u.last_name) FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE ${chatRooms.name} END`,
          avatarUrl: sql<string>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT u.profile_image_url FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE NULL END`,
          otherUserId: sql<unknown>`CASE WHEN ${chatRooms.type} = 'DIRECT' THEN (SELECT u.id FROM chat_members ocm LEFT JOIN users u ON u.id = ocm.user_id::int WHERE ocm.room_id = ${chatRooms.id} AND ocm.user_id != ${userIdStr} LIMIT 1) ELSE NULL END`,
        })
        .from(chatRooms)
        .innerJoin(chatMembers, and(eq(chatMembers.room_id, chatRooms.id), eq(chatMembers.user_id, userIdStr)))
        .orderBy(
          sql`(SELECT created_at FROM chat_messages WHERE room_id = ${chatRooms.id} AND is_deleted = false ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST`,
          sql`${chatRooms.created_at} DESC`,
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
          contextType: chatRooms.context_type,
          contextId: chatRooms.context_id,
          createdBy: chatRooms.created_by,
          createdAt: chatRooms.created_at,
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
          userId: chatMembers.user_id,
          fullName: appUsers.full_name,
          avatarUrl: appUsers.profile_image_url,
          employeeId: appUsers.employee_id,
          role: chatMembers.role,
          joinedAt: chatMembers.joined_at,
        })
        .from(chatMembers)
        .leftJoin(appUsers, sql`${appUsers.id} = ${chatMembers.user_id}::int`)
        .where(eq(chatMembers.room_id, roomIdStr))
        .orderBy(chatMembers.joined_at);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async createGroupRoom(name: string, createdByStr: string, type: 'GROUP' | 'CHANNEL' = 'GROUP'): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db
        .insert(chatRooms)
        .values({ name, type, created_by: createdByStr })
        .returning();
      return castTo<Record<string, unknown>>(row);
      }, 'DB_ERROR');
  }

  async updateRoomReadAt(roomIdStr: string, userIdStr: string): Promise<void> {
    await db
      .update(chatMembers)
      .set({ last_read_at: sql`NOW()`, unread_count: 0 })
      .where(and(eq(chatMembers.room_id, roomIdStr), eq(chatMembers.user_id, userIdStr)));
  }

  async checkMembership(roomId: string, userId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db
        .select({ found: sql<number>`1` })
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.room_id, roomId),
            sql`${chatMembers.user_id} = ${userId}::text`,
          ),
        )
        .limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async getTotalUnread(userIdStr: string): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ total: sql<number>`COALESCE(SUM(COALESCE(${chatMembers.unread_count}, 0)), 0)::int` })
        .from(chatMembers)
        .where(eq(chatMembers.user_id, userIdStr));
      return Number(row?.total ?? 0);
      }, 'DB_ERROR');
  }

  async findAllEmployees(search?: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: appUsers.id,
          fullName: appUsers.full_name,
          employeeId: appUsers.employee_id,
          avatarUrl: appUsers.profile_image_url,
          departmentName: sql<string>`(
            SELECT d.name FROM org_departments d
            JOIN employee_org_departments eod ON eod.org_department_id = d.id
            WHERE eod.user_id = users.id LIMIT 1
          )`,
        })
        .from(appUsers)
        .where(
          and(
            isNull(appUsers.deleted_at),
            // Accept active users OR users with no status set (NULL)
            or(
              eq(appUsers.status, 'active'),
              isNull(appUsers.status),
            ),
            search ? sql`${appUsers.full_name} ILIKE ${'%' + search + '%'}` : undefined,
          ),
        )
        .orderBy(appUsers.full_name)
        .limit(100);
      return castTo<Record<string, unknown>[]>(rows);
      }, 'DB_ERROR');
  }

  async findUserByAdminId(rawId: string): Promise<Result<string | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ username: adminsTable.username })
        .from(adminsTable)
        .where(sql`${adminsTable.id}::text = ${rawId}`)
        .limit(1);
      return row ? row.username as string : null;
      }, 'DB_ERROR');
  }

  async findUserIdByUsername(username: string): Promise<Result<number | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.username, username))
        .limit(1);
      return row ? Number(row.id) : null;
      }, 'DB_ERROR');
  }

  async findUserById(rawId: string): Promise<Result<number | null>> {
    return safeCall(async () => {
      const [row] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(sql`${appUsers.id}::text = ${rawId}`)
        .limit(1);
      return row ? Number(row.id) : null;
      }, 'DB_ERROR');
  }

  async updateMemberMute(roomIdStr: string, userIdStr: string, muted: boolean): Promise<void> {
    await db
      .update(chatMembers)
      .set({ is_muted: muted, muted_until: null })
      .where(and(eq(chatMembers.room_id, roomIdStr), eq(chatMembers.user_id, userIdStr)));
  }

  async findTodayBirthdays(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id: appUsers.id,
          fullName: appUsers.full_name,
          avatarUrl: appUsers.profile_image_url,
          birthDate: sql<string>`${appUsers.birth_date}`,
        })
        .from(appUsers)
        .where(
          and(
            isNull(appUsers.deleted_at),
            sql`TO_CHAR(${appUsers.birth_date}::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')`,
            sql`${appUsers.birth_date} IS NOT NULL`,
          ),
        )
        .limit(50);
      return castTo<Record<string, unknown>[]>(rows);
    }, 'DB_ERROR');
  }
}
