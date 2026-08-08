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
import { GlPostingService, type JournalLine } from '@modules/finance/domain/services/gl-posting.service';

@Injectable()
export class GlPostingLogRepository {
  constructor(private readonly glPostingService: GlPostingService) {}

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

      // A65 — balanced-GL guard. The ledger row is a BALANCED PAIR (one amount, debit+credit both set),
      // so ΣDr == ΣCr == amount by construction; but a zero/negative amount or a same-account pair
      // produces NO real GL value. Skip both rather than write a meaningless wash row (Q-40):
      //   - amount <= 0  → nothing happened (empty/zero-priced movement) — no ledger entry.
      //   - debitId === creditId (e.g. INTERNAL_TRANSFER 1010↔1010, same-class warehouse move) →
      //     Dr X / Cr X nets to zero, no GL impact — no ledger entry (the seed comment's own intent).
      const amount = Number(mov.total);
      if (!Number.isFinite(amount) || amount <= 0) {
        return Ok({ posted: false, reason: `amount <= 0 (${mov.total}) — no GL value to post` });
      }
      if (debitId === creditId) {
        return Ok({ posted: false, reason: `same debit/credit account ${map.debitAccount} — zero net GL impact (wash), skipped` });
      }

      // F3 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): route the actual write through the ONE engine
      // (GlPostingService.postJournal) instead of a bespoke raw INSERT INTO entries — gains
      // period-lock (EP-FIN-064), the F2 data-quality gate, and reference-based idempotency, on top
      // of the movement/account checks already done above (all of which are UNCHANGED — this only
      // replaces the final write). The idempotency pre-check a few lines above (document_type=
      // 'pos_movement' AND document_id=movementId) remains the authoritative guard for THIS method —
      // it is format-independent, unlike the engine's own entry_number-prefix LIKE check.
      const description = `POS harakat #${movementId} (${mov.movementType})`;
      const lines: JournalLine[] = [
        { accountCode: map.debitAccount, accountName: description, debit: amount, credit: 0 },
        { accountCode: map.creditAccount, accountName: description, debit: 0, credit: amount },
      ];
      const glResult = await this.glPostingService.postJournal(lines, `POS-GL-${movementId}`, postedBy);
      if (!glResult.ok) return Err(glResult.error.message);
      return Ok({ posted: true });
    } catch (e) {
      return Err(String(e));
    }
  }
}
