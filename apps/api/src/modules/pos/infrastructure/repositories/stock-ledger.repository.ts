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

  /** Monthly inventory report: aggregate pos_stock_ledger movements by month (kirim/chiqim/count).
   *  Raw SQL: Drizzle has no clean date_trunc GROUP BY helper. Powers GET /pos/inventory/monthly-report. */
  async getMonthlyReport(warehouseId?: string): Promise<Result<Array<{ month: string; inQty: number; outQty: number; movements: number }>>> {
    try {
      const base = sql`
        SELECT to_char(date_trunc('month', ts), 'YYYY-MM') AS month,
               COALESCE(SUM(CASE WHEN qty_change > 0 THEN qty_change ELSE 0 END), 0) AS in_qty,
               COALESCE(SUM(CASE WHEN qty_change < 0 THEN -qty_change ELSE 0 END), 0) AS out_qty,
               COUNT(*) AS movements
        FROM pos_stock_ledger
        WHERE ts IS NOT NULL`;
      const q = warehouseId
        ? sql`${base} AND warehouse_id = ${Number(warehouseId)} GROUP BY 1 ORDER BY 1 DESC LIMIT 24`
        : sql`${base} GROUP BY 1 ORDER BY 1 DESC LIMIT 24`;
      const res = await db.execute(q);
      const rows = ((res as { rows?: Record<string, unknown>[] }).rows) ?? [];
      return Ok(rows.map((x) => ({
        month: String(x.month),
        inQty: Number(x.in_qty),
        outQty: Number(x.out_qty),
        movements: Number(x.movements),
      })));
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Dedup-aware alert yozish (G9-2 flood-fix): bitta (material, ombor, tur) uchun faqat
   * BITTA ochiq (resolved=false) alert bo'ladi. Ochiq alert bor bo'lsa — yangi qator
   * YOZILMAYDI, mavjudining current_value/updated_at yangilanadi (`created=false`).
   * DB darajasida ham UNIQUE partial index (uq_pos_stock_alerts_open) himoya qiladi
   * (migration: pos-stock-alerts-dedup-2026-07-02.sql).
   */
  async insertStockAlert(
    data: typeof stockAlerts.$inferInsert,
  ): Promise<Result<{ row: AlertRow; created: boolean }>> {
    try {
      const [existing] = await db
        .select()
        .from(stockAlerts)
        .where(and(
          eq(stockAlerts.materialCardId, data.materialCardId),
          eq(stockAlerts.warehouseId, data.warehouseId),
          eq(stockAlerts.alertType, data.alertType),
          eq(stockAlerts.resolved, false),
        ))
        .limit(1);

      if (existing) {
        const patch: Partial<typeof stockAlerts.$inferInsert> = { updatedAt: new Date() };
        if (data.currentValue !== undefined) patch.currentValue = data.currentValue;
        if (data.thresholdValue !== undefined) patch.thresholdValue = data.thresholdValue;
        if (data.severity !== undefined) patch.severity = data.severity;
        const [row] = await db
          .update(stockAlerts)
          .set(patch)
          .where(eq(stockAlerts.id, existing.id))
          .returning();
        return Ok({ row, created: false });
      }

      const [row] = await db.insert(stockAlerts).values(data).returning();
      return Ok({ row, created: true });
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
      // ADR: warehouse_stock is the canonical stock table (37 rows) vs pos_stock_ledger (1 row).
      // Query warehouse_stock directly for real inventory data.
      const res = await db.execute(sql`
        SELECT warehouse_id, material_id, available_quantity AS balance
        FROM warehouse_stock
        WHERE available_quantity > 0
        ORDER BY warehouse_id, material_id
      `);
      const rows = ((res as { rows?: Record<string, unknown>[] }).rows) ?? [];
      return Ok((Array.isArray(rows) ? rows : []).map(r => ({
        materialCardId: Number(r.material_id),
        warehouseId:    String(r.warehouse_id),
        balance:        Number(r.balance ?? 0),
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
