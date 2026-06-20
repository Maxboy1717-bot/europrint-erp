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
}
