/**
 * @module stock-ledger.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, eq, sql, desc, and, lte, isNotNull, inArray } from '@workspace/db';
import { posStockLedger as stockLedger, stockAlerts, movementConfirmations, posMovementLines } from '@workspace/db';

type LedgerRow  = typeof stockLedger.$inferSelect;
type AlertRow   = typeof stockAlerts.$inferSelect;
type ConfirmRow = typeof movementConfirmations.$inferSelect;

type StockSummary = { materialCardId: number; warehouseId: string; balance: number };

/** Deduplicate rows keeping the first occurrence (assumes DESC order by ts). */
function dedupByKey<T>(rows: T[], keyFn: (r: T) => string): T[] {
  const seen = new Set<string>();
  return (Array.isArray(rows) ? rows : []).filter(r => {
    const k = keyFn(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

@Injectable()
export class StockLedgerRepository {
  async insertLedgerEntry(data: typeof stockLedger.$inferInsert): Promise<Result<LedgerRow>> {
    try {
      const [row] = await db.insert(stockLedger).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getBalance(materialCardId: number, warehouseId: string): Promise<Result<{ balance: number } | null>> {
    try {
      const [row] = await db
        .select({ balance: stockLedger.balanceAfter })
        .from(stockLedger)
        .where(and(
          eq(stockLedger.materialCardId, materialCardId),
          eq(stockLedger.warehouseId, warehouseId),
        ))
        .orderBy(desc(stockLedger.ts))
        .limit(1);
      return Ok(row ? { balance: Number(row.balance) } : null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getLedgerHistory(materialCardId: number, warehouseId: string, limit: number = 50): Promise<Result<LedgerRow[]>> {
    try {
      const rows = await db
        .select()
        .from(stockLedger)
        .where(and(
          eq(stockLedger.materialCardId, materialCardId),
          eq(stockLedger.warehouseId, warehouseId),
        ))
        .orderBy(desc(stockLedger.ts))
        .limit(limit);
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  /** General stock-movement journal (all materials): only actual ledger entries (ts set),
   *  newest first, optional warehouse filter + pagination. Powers GET /pos/stock/movements. */
  async getMovements(limit = 50, offset = 0, warehouseId?: string): Promise<Result<LedgerRow[]>> {
    try {
      const filters = [isNotNull(stockLedger.ts)];
      if (warehouseId) filters.push(eq(stockLedger.warehouseId, warehouseId));
      const rows = await db
        .select()
        .from(stockLedger)
        .where(and(...filters))
        .orderBy(desc(stockLedger.ts))
        .limit(limit)
        .offset(offset);
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async insertStockAlert(data: typeof stockAlerts.$inferInsert): Promise<Result<AlertRow>> {
    try {
      const [row] = await db.insert(stockAlerts).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getUnresolvedAlerts(warehouseId?: string, types?: string[]): Promise<Result<AlertRow[]>> {
    try {
      const filters = [eq(stockAlerts.resolved, false)];
      if (warehouseId) filters.push(eq(stockAlerts.warehouseId, warehouseId));
      if (types?.length) {
        const alertTypes = types as (typeof stockAlerts.alertType.enumValues[number])[];
        filters.push(inArray(stockAlerts.alertType, alertTypes));
      }
      const rows = await db.select().from(stockAlerts).where(and(...filters));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async acknowledgeAlert(id: number, userId: number): Promise<Result<AlertRow>> {
    try {
      const [row] = await db
        .update(stockAlerts)
        .set({ acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() })
        .where(eq(stockAlerts.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getAllStockSummary(): Promise<Result<StockSummary[]>> {
    try {
      const rows = await db
        .select({
          materialCardId: stockLedger.materialCardId,
          warehouseId:    stockLedger.warehouseId,
          balanceAfter:   stockLedger.balanceAfter,
        })
        .from(stockLedger)
        .orderBy(stockLedger.materialCardId, stockLedger.warehouseId, desc(stockLedger.ts));

      const distinct = dedupByKey(rows, r => `${r.materialCardId}:${r.warehouseId}`);
      return Ok((Array.isArray(distinct) ? distinct : []).map(r => ({
        materialCardId: r.materialCardId,
        warehouseId:    r.warehouseId,
        balance:        Number(r.balanceAfter ?? 0),
      })));
    } catch (e) {
      return Err(String(e));
    }
  }

  async getExpiryAlerts(daysAhead: number): Promise<Result<StockSummary[]>> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);

      const rows = await db
        .select({
          materialCardId: stockLedger.materialCardId,
          warehouseId:    stockLedger.warehouseId,
          balanceAfter:   stockLedger.balanceAfter,
        })
        .from(stockLedger)
        .innerJoin(posMovementLines, and(
          eq(posMovementLines.movementId, stockLedger.movementId),
          eq(posMovementLines.materialCardId, stockLedger.materialCardId),
        ))
        .where(and(
          isNotNull(posMovementLines.expiryDate),
          lte(posMovementLines.expiryDate, cutoff),
          sql`${stockLedger.balanceAfter} > 0`,
        ))
        .orderBy(stockLedger.materialCardId, stockLedger.warehouseId, desc(stockLedger.ts));

      const distinct = dedupByKey(rows, r => `${r.materialCardId}:${r.warehouseId}`);
      return Ok((Array.isArray(distinct) ? distinct : []).map(r => ({
        materialCardId: r.materialCardId,
        warehouseId:    r.warehouseId,
        balance:        Number(r.balanceAfter ?? 0),
      })));
    } catch (e) {
      return Err(String(e));
    }
  }

  async insertConfirmation(data: typeof movementConfirmations.$inferInsert): Promise<Result<ConfirmRow>> {
    try {
      const [row] = await db.insert(movementConfirmations).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getMovementConfirmations(movementId: number): Promise<Result<ConfirmRow[]>> {
    try {
      const rows = await db
        .select()
        .from(movementConfirmations)
        .where(eq(movementConfirmations.movementId, movementId))
        .orderBy(desc(movementConfirmations.signedAt));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }
}
