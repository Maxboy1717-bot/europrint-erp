/**
 * POS → WMS Sync Service
 *
 * POS harakatlar yakunlanganda WMS jadvallarini (warehouse_stock,
 * warehouse_transactions) sinxronlashtiradi.  Bu service asosiy
 * business logikaga ta'sir qilmaydi — faqat side-effect tinglaydi.
 *
 * Eventlar: 'pos.movement.data.completed', 'pos.movement.data.created'
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
import { broadcastPosEvent } from '../../presentation/pos.gateway';
import {
  MOVEMENT_TYPE_MAP,
  PosMovementCompletedEvent,
  PosMovementCreatedEvent,
  MovementRow,
  MovementLineRow,
  upsertWarehouseStock,
} from './pos-wms-sync.helpers';

@Injectable()
export class PosWmsSyncService {
  private readonly logger = new Logger(PosWmsSyncService.name);

  // =========================================================================
  // COMPLETED — warehouse_stock upsert + warehouse_transactions insert
  //
  // Wave 4 round-4 (PA2-18): the legacy @OnEvent('pos.movement.data.completed')
  // wrapper was removed — the canonical CQRS handler now lives in
  // `pos-wms-sync-completed.listener.ts` and delegates back into this method.
  // The method body is unchanged so the WMS sync semantics are preserved.
  // =========================================================================
  async onMovementCompleted(event: PosMovementCompletedEvent): Promise<void> {
    try {
      const movId = event.movementId;

      // 1. Fetch movement header
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
      if (!movement) {
        this.logger.warn(`[PosWmsSync] Movement not found: id=${movId}`);
        return;
      }

      const movementType  = movement.movement_type ?? '';
      const transType     = MOVEMENT_TYPE_MAP[movementType] ?? 'adjustment';
      const isIn          = transType === 'kirim';
      const isTransfer    = transType === 'transfer';
      const fromWh        = movement.from_warehouse_id;
      const toWh          = movement.to_warehouse_id;
      const docNumber     = movement.movement_number ?? String(movId);
      const bulim         = movement.bulim;

      // 2. Fetch movement lines
      const lines = await runQuery<MovementLineRow>(sql`
        SELECT
          material_card_id,
          quantity,
          unit_of_measure
        FROM pos_movement_lines
        WHERE movement_id = ${movId}
      `);

      if (!lines.length) {
        this.logger.warn(`[PosWmsSync] No lines for movement id=${movId}`);
        return;
      }

      for (const line of lines) {
        const matId = line.material_card_id;
        const qty   = parseFloat(line.quantity ?? '0');
        const uom   = line.unit_of_measure ?? 'dona';

        if (!matId || qty <= 0) continue;

        // warehouse_stock — upsert (delta: +qty for 'in', -qty for 'out')
        if (isIn && toWh) {
          await upsertWarehouseStock(toWh, matId, qty);
        } else if (!isIn && !isTransfer && fromWh) {
          await upsertWarehouseStock(fromWh, matId, -qty);
        } else if (isTransfer) {
          if (fromWh) await upsertWarehouseStock(fromWh, matId, -qty);
          if (toWh)   await upsertWarehouseStock(toWh,   matId, +qty);
        }

        // warehouse_transactions — insert
        const txDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        try {
          await runQuery(sql`
            INSERT INTO warehouse_transactions
              (material_card_id, transaction_date, transaction_type,
               quantity, unit_of_measure, bulim, document_number, created_at)
            VALUES
              (${matId}, ${txDate}, ${transType},
               ${qty}, ${uom}, ${bulim ?? null}, ${docNumber}, NOW())
          `);
        } catch (txErr) {
          this.logger.error(
            `[PosWmsSync] warehouse_transactions insert failed (movId=${movId}, matId=${matId}): ${String(txErr)}`,
          );
        }

        // Emit Socket.IO — 'warehouse.stock.updated'
        const targetWarehouseId = (isIn ? toWh : fromWh) ?? null;
        if (targetWarehouseId) {
          try {
            const newQtyRows = await runQuery<{ qty: string }>(sql`
              SELECT available_quantity::text AS qty
              FROM warehouse_stock
              WHERE warehouse_id = ${targetWarehouseId}
                AND material_card_id = ${String(matId)}
              LIMIT 1
            `);
            const newQty = parseFloat(newQtyRows[0]?.qty ?? '0');
            broadcastPosEvent('warehouse.stock.updated', {
              warehouseId:    targetWarehouseId,
              materialCardId: matId,
              newQty,
            });
          } catch (emitErr) {
            this.logger.warn(`[PosWmsSync] Socket emit failed: ${String(emitErr)}`);
          }
        }
      }

      this.logger.log(
        `[PosWmsSync] Synced completed movement id=${movId} (${movementType}) — ${lines.length} line(s)`,
      );
    } catch (err) {
      // Never throw from an event listener — just log
      this.logger.error(`[PosWmsSync] onMovementCompleted failed: ${String(err)}`);
    }
  }

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
        SELECT material_card_id, quantity, unit_of_measure
        FROM pos_movement_lines
        WHERE movement_id = ${movId}
      `);

      const txDate   = new Date().toISOString().slice(0, 10);
      const docNumber = movement.movement_number ?? String(movId);
      const bulim     = movement.bulim;

      for (const line of lines) {
        const matId = line.material_card_id;
        const qty   = parseFloat(line.quantity ?? '0');
        const uom   = line.unit_of_measure ?? 'dona';

        if (!matId || qty <= 0) continue;

        try {
          await runQuery(sql`
            INSERT INTO warehouse_transactions
              (material_card_id, transaction_date, transaction_type,
               quantity, unit_of_measure, bulim, document_number, created_at)
            VALUES
              (${matId}, ${txDate}, 'kirim',
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
