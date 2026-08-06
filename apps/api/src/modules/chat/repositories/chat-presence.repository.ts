/**
 * @module chat-presence.repository
 * @description Persists user online/offline status to chat_user_presence table.
 *              Called by ChatGateway on connect/disconnect so presence survives server restarts.
 *              Table columns: user_id(text PK), status(varchar), custom_status(text),
 *              last_seen_at(timestamp), active_room_id(varchar), updated_at(timestamp).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { chatUserPresence } from '@shared/db';
import { eq, sql } from 'drizzle-orm';

export type PresenceStatus = 'ONLINE' | 'OFFLINE';

export interface OnlineUser {
  userId: string;
  lastSeenAt: Date | null;
}

@Injectable()
export class ChatPresenceRepository {
  private readonly logger = new Logger(ChatPresenceRepository.name);

  /**
   * Upsert presence row. On conflict (user_id PK) update status + lastSeenAt + updatedAt.
   * activeRoomId is optional — null clears the field on OFFLINE.
   */
  async upsertPresence(
    userId: string,
    status: PresenceStatus,
    activeRoomId?: string,
  ): Promise<Result<void>> {
    try {
      const now = new Date();
      await db
        .insert(chatUserPresence)
        .values({
          userId,
          status,
          lastSeenAt: now,
          activeRoomId: activeRoomId ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: chatUserPresence.userId,
          set: {
            status,
            lastSeenAt: sql`NOW()`,
            activeRoomId: activeRoomId ?? null,
            updatedAt: sql`NOW()`,
          },
        });
      return Ok(undefined);
    } catch (e: unknown) {
      this.logger.warn(`upsertPresence error for user ${userId}: ${String(e)}`);
      return Err(String(e));
    }
  }

  /**
   * Return all users whose status = 'ONLINE'.
   */
  async findOnlineUsers(): Promise<Result<OnlineUser[]>> {
    try {
      const rows = await db
        .select({
          userId: chatUserPresence.userId,
          lastSeenAt: chatUserPresence.lastSeenAt,
        })
        .from(chatUserPresence)
        .where(eq(chatUserPresence.status, 'ONLINE'));

      const users: OnlineUser[] = (Array.isArray(rows) ? rows : []).map((r) => ({
        userId: String(r.userId),
        lastSeenAt: r.lastSeenAt ?? null,
      }));

      return Ok(users);
    } catch (e: unknown) {
      this.logger.warn(`findOnlineUsers error: ${String(e)}`);
      return Err(String(e));
    }
  }

  /**
   * audit 2026-08-06 T17: mark ONLINE rows stale-r than ttlMinutes as OFFLINE.
   * Covers lost disconnect events (server crash / Q-44 nest-watch kill) — live DB
   * showed a user stuck "ONLINE" for 3+ weeks. Returns number of rows swept.
   */
  async sweepStaleOnline(ttlMinutes: number): Promise<Result<number>> {
    try {
      const r = await db.execute(sql`
        UPDATE chat_user_presence
        SET status = 'OFFLINE', active_room_id = NULL, updated_at = NOW()
        WHERE status = 'ONLINE'
          AND last_seen_at < NOW() - make_interval(mins => ${ttlMinutes})
        RETURNING user_id
      `);
      const rows = (r as unknown as { rows?: unknown[] }).rows ?? [];
      return Ok(rows.length);
    } catch (e: unknown) {
      this.logger.warn(`sweepStaleOnline error: ${String(e)}`);
      return Err(String(e));
    }
  }

  // Bitta foydalanuvchining holati (status + ish-holati) — xodim-info paneli uchun.
  async findPresence(userId: string): Promise<Result<{ status: string | null; workStatus: string | null; lastSeenAt: Date | null } | null>> {
    try {
      const [row] = await db
        .select({
          status: chatUserPresence.status,
          workStatus: chatUserPresence.workStatus,
          lastSeenAt: chatUserPresence.lastSeenAt,
        })
        .from(chatUserPresence)
        .where(eq(chatUserPresence.userId, userId))
        .limit(1);
      return Ok(row ?? null);
    } catch (e: unknown) {
      this.logger.warn(`findPresence error: ${String(e)}`);
      return Err(String(e));
    }
  }
}
