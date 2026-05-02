import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, eq, sql, and, gte } from '@workspace/db';
import { posOfflineQueue, posMovements } from '@workspace/db';

type MovementDeltaRow = {
  id: number;
  movementNumber: string;
  status: string;
  movementType: string | null;
  updatedAt: Date | null;
};

type QueueRow = typeof posOfflineQueue.$inferSelect;

@Injectable()
export class PosSyncRepository {
  async findByClientUuid(clientUuid: string): Promise<Result<QueueRow | null>> {
    try {
      const [row] = await db
        .select()
        .from(posOfflineQueue)
        .where(sql`${posOfflineQueue.payload}->>'clientUuid' = ${clientUuid}`)
        .limit(1);
      return Ok(row ?? null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async insertOfflineEntry(data: typeof posOfflineQueue.$inferInsert): Promise<Result<QueueRow>> {
    try {
      const [row] = await db.insert(posOfflineQueue).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async markSynced(id: number, movementId: number): Promise<Result<QueueRow>> {
    try {
      const [row] = await db
        .update(posOfflineQueue)
        .set({ syncStatus: 'SYNCED', syncedAt: new Date(), syncedMovementId: movementId })
        .where(eq(posOfflineQueue.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getPendingForTerminal(
    terminalId: string,
    userId: number,
    since?: Date,
  ): Promise<Result<QueueRow[]>> {
    try {
      const conditions = [
        eq(posOfflineQueue.terminalId, terminalId),
        eq(posOfflineQueue.userId, userId),
      ];
      if (since) conditions.push(gte(posOfflineQueue.createdAt, since));
      const rows = await db
        .select()
        .from(posOfflineQueue)
        .where(and(...conditions));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Server delta pull: returns movements confirmed/completed on the server
   * since the client's last `since` timestamp.
   * This is the authoritative list of changes the client should apply locally.
   */
  async getServerDelta(since?: Date, userId?: number): Promise<Result<MovementDeltaRow[]>> {
    try {
      const statusFilter = sql`${posMovements.status} IN ('completed','approved','qc_approved','cancelled')`;
      const conditions = [statusFilter, ...(since ? [gte(posMovements.updatedAt, since)] : []), ...(userId ? [sql`created_by = ${userId}`] : [])];
      const rows: MovementDeltaRow[] = (await db
        .select({
          id:             posMovements.id,
          movementNumber: posMovements.movementNumber,
          status:         sql<string>`${posMovements.status}::text`,
          movementType:   posMovements.movementType,
          updatedAt:      posMovements.updatedAt,
        })
        .from(posMovements)
        .where(and(...conditions))
        .orderBy(posMovements.updatedAt)
        .limit(200));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getSyncStatus(): Promise<Result<{ total: number; pending: number; synced: number; conflict: number }>> {
    try {
      const rows = await db
        .select({
          syncStatus: posOfflineQueue.syncStatus,
          cnt:        sql<number>`count(*)::int`,
        })
        .from(posOfflineQueue)
        .groupBy(posOfflineQueue.syncStatus);

      const map: Record<string, number> = {};
      (rows ?? []).forEach(r => { map[r.syncStatus] = r.cnt; });
      return Ok({
        total:    Object.values(map).reduce((s, v) => s + v, 0),
        pending:  map['PENDING'] ?? 0,
        synced:   map['SYNCED'] ?? 0,
        conflict: map['CONFLICT'] ?? 0,
      });
    } catch (e) {
      return Err(String(e));
    }
  }
}
