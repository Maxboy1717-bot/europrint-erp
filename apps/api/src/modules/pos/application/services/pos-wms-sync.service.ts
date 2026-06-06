/**
 * POS → WMS Sync Service
 *
 * POS harakatlar yakunlanganda WMS jadvallarini (warehouse_stock,
 * warehouse_transactions) sinxronlashtiradi.  Bu service asosiy
 * business logikaga ta'sir qilmaydi — faqat side-effect tinglaydi.
 *
 * Eventlar: 'pos.movement.data.created'  (completed path removed 2026-06-06 — inline)
 *
 *   Type definitions, constants and the warehouse_stock upsert helper live in
 *   pos-wms-sync.helpers.ts (Rule 16 — 300 line cap).
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Cross-module reads on `pos_movements` / `pos_movement_lines` and writes to
 *     `warehouse_transactions` / `warehouse_stock` (WMS schema), bridging POS↔WMS
 *     without coupling either module's Drizzle schema surface to the other
 *   - SELECT available_quantity::text AS qty cast for socket payload precision
 *   - INSERT into warehouse_transactions with mixed parameter types (uom/bulim
 *     nullable text, numeric qty, NOW() server timestamp) in a single statement
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import {
  MOVEMENT_TYPE_MAP,
  PosMovementCreatedEvent,
  MovementRow,
  MovementLineRow,
} from './pos-wms-sync.helpers';

@Injectable()
export class PosWmsSyncService {
  private readonly logger = new Logger(PosWmsSyncService.name);

  // onMovementCompleted REMOVED 2026-06-06:
  // Stock+transactions write is now done INLINE in PosMovementStatusService._processCompletedMovement().
  // The dead pos-wms-sync-completed.listener.ts (sole caller) was deleted — confirmed 0 publish() sites.
  // See: docs/deleted-routes.md (chore/pos: remove dead PosMovementCompletedEvent duplicate listeners)

  // =========================================================================
  // CREATED — draft warehouse_transaction insert
  //
  // Wave 4 round-4 (PA2-18): the legacy @OnEvent('pos.movement.data.created')
  // wrapper was removed — the canonical CQRS handler now lives in
  // `pos-wms-sync-created.listener.ts` and delegates back into this method.
  // The method body is unchanged so the warehouse_transactions draft insert
  // semantics are preserved.
  // =========================================================================
  async onMovementCreated(event: PosMovementCreatedEvent): Promise<void> {
    try {
      const movId = event.movementId;

      // Fetch movement header to get type & warehouse info
      const movRows = await runQuery<MovementRow>(sql`
        SELECT
          id,
          movement_type,
          from_warehouse_id,
          to_warehouse_id,
          movement_number,
          bulim
        FROM pos_movements
        WHERE id = ${movId}
        LIMIT 1
      `);

      const movement = movRows[0];
      if (!movement) return;

      const lines = await runQuery<MovementLineRow>(sql`
        SELECT material_id AS material_card_id, quantity, unit AS unit_of_measure
        FROM pos_movement_lines
        WHERE movement_id = ${movId}
      `);

      const txDate   = new Date().toISOString().slice(0, 10);
      const docNumber = movement.movement_number ?? String(movId);
      const bulim     = movement.bulim;
      const movementType = movement.movement_type ?? '';
      const transType    = MOVEMENT_TYPE_MAP[movementType] ?? 'adjustment';

      for (const line of lines) {
        const matId = line.material_card_id;
        const qty   = parseFloat(line.quantity ?? '0');
        const uom   = line.unit_of_measure ?? 'dona';

        if (!matId || qty <= 0) continue;

        try {
          await runQuery(sql`
            INSERT INTO warehouse_transactions
              (material_id, transaction_date, transaction_type,
               quantity, unit_of_measure, bulim, document_number, created_at)
            VALUES
              (${matId}, ${txDate}, ${transType},
               ${qty}, ${uom}, ${bulim ?? null}, ${docNumber}, NOW())
          `);
        } catch (txErr) {
          this.logger.error(
            `[PosWmsSync] Draft tx insert failed (movId=${movId}, matId=${matId}): ${String(txErr)}`,
          );
        }
      }

      this.logger.log(`[PosWmsSync] Recorded draft tx for movement id=${movId} — ${lines.length} line(s)`);
    } catch (err) {
      this.logger.error(`[PosWmsSync] onMovementCreated failed: ${String(err)}`);
    }
  }
}
