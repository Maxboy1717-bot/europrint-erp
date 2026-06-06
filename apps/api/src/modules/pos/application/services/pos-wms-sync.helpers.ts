/**
 * @module pos-wms-sync.helpers
 * @description Constants, types and the warehouse_stock upsert helper extracted
 *   from pos-wms-sync.service.ts to keep that file <300 lines (Rule 16).
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   INSERT ... ON CONFLICT (warehouse_id, material_id) DO UPDATE with
 *   per-column arithmetic (quantity = warehouse_stock.quantity + ${delta},
 *   GREATEST(0, quantity - delta)) for stock upsert. Drizzle's onConflictDoUpdate
 *   does not support referencing the target table's own columns in SET
 *   expressions with arithmetic operators reliably.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

// ---------------------------------------------------------------------------
// POS movement_type → WMS transaction_type xaritalash
// ---------------------------------------------------------------------------
export const MOVEMENT_TYPE_MAP: Record<string, string> = {
  EXTERNAL_IN:       'kirim',
  INTERNAL_RETURN:   'kirim',
  EXTERNAL_OUT:      'chiqim',
  INTERNAL_ISSUE:    'chiqim',
  DAMAGE:            'chiqim',
  INTERNAL_TRANSFER: 'transfer',
  INVENTORY_ADJUST:  'adjustment',
  INVENTORY_ADJ_PLUS:  'kirim',
  INVENTORY_ADJ_MINUS: 'chiqim',
};

// ---------------------------------------------------------------------------
// Incoming event shapes
// ---------------------------------------------------------------------------
// PosMovementCompletedEvent removed 2026-06-06: 0 publish() sites, listeners
// deleted, inline path in PosMovementStatusService._processCompletedMovement() canonical.

export interface PosMovementCreatedEvent {
  movementId:     number | string;
  movementNumber: string | null;
  oldStatus:      string;
  newStatus:      string;
  updatedById:    number;
}

// ---------------------------------------------------------------------------
// Internal row shapes
// ---------------------------------------------------------------------------
export interface MovementRow {
  id:               string | number;
  movement_type:    string | null;
  from_warehouse_id: string | null;
  to_warehouse_id:  string | null;
  movement_number:  string | null;
  bulim:            string | null;
}

export interface MovementLineRow {
  material_card_id: string | number | null;
  quantity:         string | null;
  unit_of_measure:  string | null;
}

export interface StockUpdateRow {
  warehouse_id:    string;
  material_card_id: string | number;
  new_qty:         string | null;
}

/**
 * Upserts warehouse_stock.  delta > 0 → stock in, delta < 0 → stock out.
 * Uses ON CONFLICT to increment/decrement in place.
 */
export async function upsertWarehouseStock(
  warehouseId: string,
  materialCardId: string | number,
  delta: number,
): Promise<void> {
  const matIdStr = String(materialCardId);
  const absDelta = Math.abs(delta);

  if (delta >= 0) {
    // Stock IN — add to quantities
    await runQuery<StockUpdateRow>(sql`
      INSERT INTO warehouse_stock
        (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at)
      VALUES
        (${warehouseId}, ${matIdStr}, ${absDelta}, 0, ${absDelta}, NOW(), NOW())
      ON CONFLICT (warehouse_id, material_id)
      DO UPDATE SET
        quantity           = warehouse_stock.quantity + ${absDelta},
        available_quantity = warehouse_stock.available_quantity + ${absDelta},
        last_updated_at    = NOW()
    `);
  } else {
    // Stock OUT — subtract, floor at 0
    await runQuery<StockUpdateRow>(sql`
      INSERT INTO warehouse_stock
        (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at)
      VALUES
        (${warehouseId}, ${matIdStr}, 0, 0, 0, NOW(), NOW())
      ON CONFLICT (warehouse_id, material_id)
      DO UPDATE SET
        quantity           = GREATEST(0, warehouse_stock.quantity - ${absDelta}),
        available_quantity = GREATEST(0, warehouse_stock.available_quantity - ${absDelta}),
        last_updated_at    = NOW()
    `);
  }
}
