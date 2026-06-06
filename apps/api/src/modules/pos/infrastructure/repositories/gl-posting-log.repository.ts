/**
 * @module gl-posting-log.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, eq, desc, and } from '@workspace/db';
import { glPostingLog } from '@workspace/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

@Injectable()
export class GlPostingLogRepository {
  async insertLog(data: typeof glPostingLog.$inferInsert): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db.insert(glPostingLog).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getByMovement(movementId: number): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(eq(glPostingLog.movementId, movementId))
        .orderBy(desc(glPostingLog.processedAt));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getPendingEntries(): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(eq(glPostingLog.status, 'AWAITING_REVIEW'))
        .orderBy(desc(glPostingLog.processedAt));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approveEntry(id: number, approvedBy: number): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db
        .update(glPostingLog)
        .set({ status: 'POSTED', approvedBy, approvedAt: new Date() })
        .where(eq(glPostingLog.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async rejectEntry(id: number, approvedBy: number): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db
        .update(glPostingLog)
        .set({ status: 'REJECTED', approvedBy, approvedAt: new Date() })
        .where(eq(glPostingLog.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approveByMovement(movementId: number, approvedBy: number): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .update(glPostingLog)
        .set({ status: 'POSTED', approvedBy, approvedAt: new Date() })
        .where(and(eq(glPostingLog.movementId, movementId), eq(glPostingLog.status, 'AWAITING_REVIEW')))
        .returning();
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getJournal(limit: number = 100): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(and(eq(glPostingLog.status, 'POSTED')))
        .orderBy(desc(glPostingLog.processedAt))
        .limit(limit);
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * BOSQICH 2 — post an APPROVED POS movement's GL to the canonical `entries` ledger.
   * Data-driven & accounting-safe: resolves debit/credit accounts from `gl_account_mappings`
   * (keyed by the movement's transaction_type) -> `accounts.id`. If no mapping or no matching CoA
   * account exists, it SKIPS and posts NOTHING (returns posted:false + reason) — the account mapping
   * is an owner/accountant decision, never invented (Q-40). Idempotent: one ledger entry per movement
   * (document_type='pos_movement', document_id=movementId). amount = SUM(qty*unit_price) of the movement.
   */
  async postMovementToLedger(movementId: number, postedBy?: number): Promise<Result<{ posted: boolean; reason?: string }>> {
    try {
      const movRows = await typedExecute<{ movementType: string; total: string }>(sql`
        SELECT m.movement_type AS "movementType",
               COALESCE(SUM(l.quantity * l.unit_price), 0)::numeric AS total
        FROM pos_movements m
        LEFT JOIN pos_movement_lines l ON l.movement_id = m.id
        WHERE m.id = ${movementId}
        GROUP BY m.movement_type`);
      const mov = movRows[0];
      if (!mov) return Ok({ posted: false, reason: 'movement not found' });

      // Idempotency — one ledger entry per movement.
      const existing = await typedExecute<{ id: number }>(sql`
        SELECT id FROM entries WHERE document_type = 'pos_movement' AND document_id = ${movementId} LIMIT 1`);
      if (existing[0]) return Ok({ posted: false, reason: 'already posted' });

      // Account mapping (owner/accountant-owned data; empty by default).
      const mapRows = await typedExecute<{ debitAccount: string | null; creditAccount: string | null }>(sql`
        SELECT debit_account AS "debitAccount", credit_account AS "creditAccount"
        FROM gl_account_mappings WHERE transaction_type = ${mov.movementType} LIMIT 1`);
      const map = mapRows[0];
      if (!map || !map.debitAccount || !map.creditAccount) {
        return Ok({ posted: false, reason: `no GL mapping for '${mov.movementType}' — populate gl_account_mappings` });
      }

      const accRows = await typedExecute<{ code: string; id: number }>(sql`
        SELECT account_code AS code, id FROM accounts WHERE account_code IN (${map.debitAccount}, ${map.creditAccount})`);
      const debitId = accRows.find((a) => a.code === map.debitAccount)?.id ?? null;
      const creditId = accRows.find((a) => a.code === map.creditAccount)?.id ?? null;
      if (debitId == null || creditId == null) {
        return Ok({ posted: false, reason: `account code(s) not in CoA: ${map.debitAccount}/${map.creditAccount}` });
      }

      const entryDate = new Date().toISOString().slice(0, 10);
      await db.execute(sql`
        INSERT INTO entries
          (entry_number, entry_date, document_type, document_id, debit_account_id, credit_account_id,
           debit_account, credit_account, amount, description, created_by, created_at)
        VALUES
          (${`POS-GL-${movementId}`}, ${entryDate}, 'pos_movement', ${movementId}, ${debitId}, ${creditId},
           ${map.debitAccount}, ${map.creditAccount}, ${mov.total},
           ${`POS harakat #${movementId} (${mov.movementType})`}, ${postedBy ?? null}, NOW())`);
      return Ok({ posted: true });
    } catch (e) {
      return Err(String(e));
    }
  }
}
