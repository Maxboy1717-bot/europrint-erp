/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Signed-sum ledger aggregation: SUM(CASE WHEN entry_type='DEBIT' THEN qty
 *     ELSE -qty END) AS balance + parallel SUM(CASE...) AS total_value over
 *     quantity::numeric * unit_price::numeric — Drizzle has no native
 *     CASE-inside-SUM helper that preserves the ::numeric cast needed so the
 *     driver returns numbers instead of pg's default text-for-numeric.
 *   - HAVING SUM(CASE WHEN entry_type='DEBIT' THEN qty ELSE -qty END) > 0
 *     filter on the same expression as the SELECT, with no Drizzle alias
 *     re-use in HAVING (would have to be duplicated as sql template anyway).
 *   - UNION of material_cards.barcode and pos_batches.batch_number lookups
 *     for barcodeExists() — Drizzle's union() requires identical column
 *     shapes from select() builders rather than the trivial SELECT 1 pattern.
 *   - GREATEST(0, COALESCE(reserved_qty, 0) - ${qty}) clamp in releaseStock()
 *     UPDATE — Drizzle has no greatest()/least() helpers.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module pos-employee-balance.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';

export interface EmployeeInventoryItem {
  materialCardId: number;
  materialName?:  string;
  unitOfMeasure?: string;
  given:          number;
  returned:       number;
  balance:        number;
  totalValue:     number;
}

const LEDGER_BALANCE_SQL = (userId: number) => sql`
  SELECT
    eil.material_card_id,
    mc.xom_ashyo         AS material_name,
    mc.unit_of_measure,
    SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN eil.quantity::numeric ELSE 0 END)  AS given,
    SUM(CASE WHEN eil.entry_type = 'CREDIT' THEN eil.quantity::numeric ELSE 0 END)  AS returned,
    SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN  eil.quantity::numeric
             ELSE -eil.quantity::numeric END)                                        AS balance,
    SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN  eil.quantity::numeric * eil.unit_price::numeric
             ELSE -eil.quantity::numeric * eil.unit_price::numeric END)              AS total_value
  FROM employee_inventory_ledger eil
  LEFT JOIN material_cards mc ON mc.id = eil.material_card_id
  WHERE eil.user_id = ${userId}
  GROUP BY eil.material_card_id, mc.xom_ashyo, mc.unit_of_measure
  HAVING SUM(CASE WHEN eil.entry_type = 'DEBIT'  THEN  eil.quantity::numeric
                  ELSE -eil.quantity::numeric END) > 0
  ORDER BY mc.xom_ashyo
`;

function mapRows(rows: Record<string, unknown>[]): EmployeeInventoryItem[] {
  return rows.map(r => ({
    materialCardId: Number(r['material_card_id']),
    materialName:   r['material_name']  as string | undefined,
    unitOfMeasure:  r['unit_of_measure'] as string | undefined,
    given:          Number(r['given']       ?? 0),
    returned:       Number(r['returned']    ?? 0),
    balance:        Number(r['balance']     ?? 0),
    totalValue:     Number(r['total_value'] ?? 0),
  }));
}

@Injectable()
export class PosEmployeeBalanceRepository {
  async getInventory(userId: number): Promise<Result<EmployeeInventoryItem[]>> {
    try {
      const r = await db.execute(LEDGER_BALANCE_SQL(userId));
      return Ok(mapRows(r.rows as Record<string, unknown>[]));
    } catch (e) {
      return Err(`pos_employee_balance.getInventory: ${String(e)}`);
    }
  }

  /** Same query as getInventory — no HAVING filter difference at this level */
  async getChecklist(userId: number): Promise<Result<EmployeeInventoryItem[]>> {
    return this.getInventory(userId);
  }

  async reserveStock(warehouseId: string, materialCardId: number, qty: number): Promise<Result<void>> {
    try {
      await db.execute(sql`
        UPDATE pos_stock_balances
           SET reserved_qty = COALESCE(reserved_qty, 0) + ${qty}
         WHERE warehouse_id     = ${warehouseId}
           AND material_card_id = ${materialCardId}
      `);
      return Ok();
    } catch (e) {
      return Err(`pos_employee_balance.reserveStock: ${String(e)}`);
    }
  }

  async releaseStock(warehouseId: string, materialCardId: number, qty: number): Promise<Result<void>> {
    try {
      await db.execute(sql`
        UPDATE pos_stock_balances
           SET reserved_qty = GREATEST(0, COALESCE(reserved_qty, 0) - ${qty})
         WHERE warehouse_id     = ${warehouseId}
           AND material_card_id = ${materialCardId}
      `);
      return Ok();
    } catch (e) {
      return Err(`pos_employee_balance.releaseStock: ${String(e)}`);
    }
  }

  async barcodeExists(barcode: string): Promise<Result<boolean>> {
    try {
      const r = await db.execute(sql`
        SELECT 1 FROM material_cards mc WHERE mc.barcode = ${barcode}
        UNION
        SELECT 1 FROM pos_batches pb WHERE pb.batch_number = ${barcode}
        LIMIT 1
      `);
      return Ok((r.rows ?? []).length > 0);
    } catch (e) {
      return Err(`pos_employee_balance.barcodeExists: ${String(e)}`);
    }
  }
}
