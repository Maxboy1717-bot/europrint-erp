/**
 * @module chat-admin.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { chatMembers, appUsers } from '@shared/db';
import { AdminRoom, AdminRoomMember } from '../chat-admin.service';

@Injectable()
export class ChatAdminRepository {
  private readonly logger = new Logger(ChatAdminRepository.name);

  async findAllRooms(): Promise<Result<AdminRoom[]>> {
    try {
      // Raw SQL: live DB has integer id/created_by — Drizzle schema declares varchar (drift).
      // Subqueries for message_count and member_count avoid N+1.
      const result = await db.execute(sql`
        SELECT
          cr.id::text                                                            AS id,
          COALESCE(cr.name, '')                                                  AS name,
          COALESCE(cr.type, 'GROUP')                                             AS type,
          COALESCE(cr.description, '')                                           AS description,
          COALESCE(cr.is_archived, false)                                        AS is_archived,
          cr.created_at,
          cr.last_message_at,
          COALESCE(u.full_name, '')                                              AS created_by_name,
          (SELECT COUNT(*)::integer FROM chat_members cm WHERE cm.room_id = cr.id) AS member_count,
          (SELECT COUNT(*)::integer FROM chat_messages msg WHERE msg.room_id = cr.id AND msg.is_deleted = false) AS message_count
        FROM chat_rooms cr
        LEFT JOIN users u ON u.id = cr.created_by
        ORDER BY cr.created_at DESC
        LIMIT 100
      `);
      const rows = Array.isArray(result.rows) ? result.rows : [];
      // FE AdminRoom interface uses snake_case keys (created_by_name, message_count, etc.)
      return Ok(rows.map((r: Record<string, unknown>) => ({
        id:               String(r['id'] ?? ''),
        name:             String(r['name'] ?? ''),
        type:             String(r['type'] ?? ''),
        description:      String(r['description'] ?? ''),
        member_count:     Number(r['member_count'] ?? 0),
        message_count:    Number(r['message_count'] ?? 0),
        is_archived:      Boolean(r['is_archived']),
        created_at:       r['created_at'] ? String(r['created_at']) : '',
        last_message_at:  r['last_message_at'] ? String(r['last_message_at']) : '',
        created_by_name:  String(r['created_by_name'] ?? ''),
        // camelCase aliases for AdminRoom used in service layer
        memberCount:      Number(r['member_count'] ?? 0),
        isArchived:       Boolean(r['is_archived']),
        createdAt:        r['created_at'] ? String(r['created_at']) : '',
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
      // Use raw SQL: live DB id=integer but incoming roomId may be string
      const r = await db.execute(sql`SELECT id FROM chat_rooms WHERE id::text = ${roomId} LIMIT 1`);
      return Ok(Array.isArray(r.rows) && r.rows.length > 0);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async setRoomArchived(roomId: string): Promise<Result<void>> {
    try {
      await db.execute(sql`UPDATE chat_rooms SET is_archived = true WHERE id::text = ${roomId}`);
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

  async findAuditLogs(page: number, limit: number): Promise<Result<{ logs: unknown[]; total: number }>> {
    try {
      const offset = (page - 1) * limit;
      // Use the real audit_logs table (9756 rows, table_name='chat' for chat events).
      // Join users for actor_name; join chat_rooms for room_name via entity_id.
      const [dataResult, countResult] = await Promise.all([
        db.execute(sql`
          SELECT
            al.id,
            al.action,
            al.user_id                                AS actor_id,
            COALESCE(u.full_name, al.user_full_name, al.user_id) AS actor_name,
            al.entity_id                              AS room_id,
            COALESCE(cr.name, al.entity_id, '')       AS room_name,
            NULL::text                                AS target_user_id,
            NULL::text                                AS target_name,
            al.created_at
          FROM audit_logs al
          LEFT JOIN users u   ON u.id::text = al.user_id
          LEFT JOIN chat_rooms cr ON cr.id::text = al.entity_id
          WHERE al.table_name = 'chat'
          ORDER BY al.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `),
        db.execute(sql`SELECT COUNT(*)::integer AS total FROM audit_logs WHERE table_name = 'chat'`),
      ]);
      const logs = Array.isArray(dataResult.rows) ? dataResult.rows : [];
      const totalRow = Array.isArray(countResult.rows) ? countResult.rows[0] : null;
      const total = Number((totalRow as Record<string, unknown> | null)?.['total'] ?? 0);
      return Ok({ logs, total });
    } catch (e: unknown) {
      return Err((e as Error).message);
    }
  }
}
