/**
 * @module wms-goods-issued.listener
 * @description Golden thread HOP 5 (WMS → FIN): reacts to the WMS stock-movement
 *   domain events and posts the balanced inventory/COGS journal into the canonical
 *   `entries` ledger via GlPostingService. Before this listener existed the WMS
 *   events fired but NO finance handler consumed them, so inventory/COGS movements
 *   never reached the ledger (golden-thread break).
 *
 *   Two events, two balanced double-entries (both posted to `entries` only):
 *     WmsGoodsIssuedEvent  (materials leave stock → consumed in production)
 *         Dr COGS (9100)        +value
 *           Cr Inventory (1000)     -value
 *     WmsFgReceivedEvent   (finished goods arrive in the warehouse)
 *         Dr Inventory (1000)   +value
 *           Cr Accounts Payable (6000) -value   (mirrors GlPostingService.postGoodsReceipt)
 *
 *   value = issuedQty × unit cost. The WMS events carry QUANTITY only (payload.amount /
 *   event.amount), never a money value, so the unit cost is read at runtime from the
 *   canonical `material_cards` row (unit_price, falling back to last_purchase_price).
 *   If no positive unit cost exists for the material the GL post is SKIPPED and a warning
 *   is logged — the value is never invented (Q-40 "ishlaydi ≠ to'g'ri"; mirrors the
 *   EP_COST_RATIO guard in delivery-completed.listener).
 *
 *   Idempotent: reference `WGI-<ppId>-<materialId>-<ymd>` / `WFR-<warehouseId>-<materialId>-<ymd>`
 *   — GlPostingService.createJournalEntry de-dupes a re-fired event for the same day.
 *
 *   ⚠️ Canonical ledger is `entries` only. gl_journal_entries / gl_lines are NEVER touched (SAP#76).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { GL } from '../../domain/constants/gl-accounts.constants';
import { GlPostingService, JournalLine } from '../../domain/services/gl-posting.service';
import { WmsGoodsIssuedEvent } from '@modules/wms/application/events/wms-goods-issued.event';
import { WmsFgReceivedEvent } from '@modules/wms/application/events/wms-fg-received.event';

interface MovementValue {
  materialId: number;
  quantity: number;
  /** value = quantity × unit cost, or null when no positive unit cost is known. */
  value: number | null;
}

@Injectable()
@EventsHandler(WmsGoodsIssuedEvent)
export class WmsGoodsIssuedListener implements IEventHandler<WmsGoodsIssuedEvent> {
  private readonly logger = new Logger(WmsGoodsIssuedListener.name);

  constructor(private readonly glPostingService: GlPostingService) {}

  async handle(event: WmsGoodsIssuedEvent): Promise<void> {
    try {
      // Payload is the legacy string-keyed shape {materialId, amount, ppId, timestamp};
      // `amount` is the issued QUANTITY (not a money value). Read defensively.
      const payload = (event?.payload ?? {}) as Record<string, unknown>;
      const materialId = Number(payload['materialId']);
      const quantity = Number(payload['amount']);
      const ppId = Number(payload['ppId']);

      if (!Number.isFinite(materialId) || materialId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        this.logger.warn(
          `WmsGoodsIssuedListener: invalid payload (materialId=${payload['materialId']}, amount=${payload['amount']}) — GL skipped`,
        );
        return;
      }

      const valued = await this.resolveValue(materialId, quantity);
      if (valued.value == null || valued.value <= 0) {
        this.logger.warn(
          `WmsGoodsIssuedListener: no positive unit cost for material ${materialId} ` +
            `(qty=${quantity}) — COGS GL post SKIPPED. material_cards.unit_price KERAK.`,
        );
        return;
      }

      // Dr COGS (9100) / Cr Inventory (1000) — same legs as GlPostingService.postMaterialConsumption,
      // posted through the public postJournal so the reference stays unique per (pp, material, day).
      const ymd = new Date().toISOString().slice(0, 10);
      const reference = `WGI-${Number.isFinite(ppId) && ppId > 0 ? ppId : 'NA'}-${materialId}-${ymd}`;
      const lines: JournalLine[] = [
        { accountCode: GL.COGS, accountName: 'Tannarx (COGS) - Dr', debit: valued.value, credit: 0 },
        { accountCode: GL.INVENTORY, accountName: 'Materiallar (Inventory) - Cr', debit: 0, credit: valued.value },
      ];

      const result = await this.glPostingService.postJournal(lines, reference);
      if (!result.ok) {
        this.logger.error(
          `WmsGoodsIssuedListener: GL posting failed (ref=${reference}): ${String(result.error)}`,
        );
        return;
      }
      this.logger.log(
        `HOP 5 WMS→FIN: goods-issue GL posted to entries — material=${materialId}, qty=${quantity}, ` +
          `value=${valued.value}, entryId=${result.data}, ref=${reference}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Error processing WmsGoodsIssuedEvent: ${(error as Error).message}`);
    }
  }

  /**
   * Read the canonical unit cost for a material from `material_cards` and multiply by qty.
   * Parametrized raw SQL via runQuery (no sql.raw(variable)). Returns value=null when no
   * positive unit cost is known so the caller skips the post rather than inventing money.
   */
  private async resolveValue(materialId: number, quantity: number): Promise<MovementValue> {
    try {
      const res = await runQuery<{ unit_price: string | null; last_purchase_price: string | null }>(sql`
        SELECT unit_price, last_purchase_price FROM material_cards WHERE id = ${materialId} LIMIT 1
      `);
      const rows = Array.isArray(res?.rows) ? res.rows : [];
      const row = rows[0];
      if (!row) return { materialId, quantity, value: null };
      const unitPrice = Number(row.unit_price);
      const lastPurchase = Number(row.last_purchase_price);
      const unitCost =
        Number.isFinite(unitPrice) && unitPrice > 0
          ? unitPrice
          : Number.isFinite(lastPurchase) && lastPurchase > 0
            ? lastPurchase
            : null;
      if (unitCost == null) return { materialId, quantity, value: null };
      return { materialId, quantity, value: Math.round(quantity * unitCost * 100) / 100 };
    } catch (error: unknown) {
      this.logger.error(
        `WmsGoodsIssuedListener.resolveValue failed for material ${materialId}: ${(error as Error).message}`,
      );
      return { materialId, quantity, value: null };
    }
  }
}

@Injectable()
@EventsHandler(WmsFgReceivedEvent)
export class WmsFgReceivedGlListener implements IEventHandler<WmsFgReceivedEvent> {
  private readonly logger = new Logger(WmsFgReceivedGlListener.name);

  constructor(private readonly glPostingService: GlPostingService) {}

  async handle(event: WmsFgReceivedEvent): Promise<void> {
    try {
      const materialId = Number(event?.materialId);
      const quantity = Number(event?.amount); // FG received quantity (not a money value)
      const warehouseId = Number(event?.warehouseId);

      if (!Number.isFinite(materialId) || materialId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        this.logger.warn(
          `WmsFgReceivedGlListener: invalid event (materialId=${event?.materialId}, amount=${event?.amount}) — GL skipped`,
        );
        return;
      }

      const value = await this.resolveValue(materialId, quantity);
      if (value == null || value <= 0) {
        this.logger.warn(
          `WmsFgReceivedGlListener: no positive unit cost for material ${materialId} ` +
            `(qty=${quantity}) — FG-receipt GL post SKIPPED. material_cards.unit_price KERAK.`,
        );
        return;
      }

      // Dr Inventory (1000) / Cr Accounts Payable (6000) — same legs as GlPostingService.postGoodsReceipt.
      const ymd = new Date().toISOString().slice(0, 10);
      const reference = `WFR-${Number.isFinite(warehouseId) && warehouseId > 0 ? warehouseId : 'NA'}-${materialId}-${ymd}`;
      const lines: JournalLine[] = [
        { accountCode: GL.INVENTORY, accountName: 'Materiallar (Inventory) - Dr', debit: value, credit: 0 },
        { accountCode: GL.ACCOUNTS_PAYABLE, accountName: 'Kreditorlar (AP) - Cr', debit: 0, credit: value },
      ];

      const result = await this.glPostingService.postJournal(lines, reference);
      if (!result.ok) {
        this.logger.error(
          `WmsFgReceivedGlListener: GL posting failed (ref=${reference}): ${String(result.error)}`,
        );
        return;
      }
      this.logger.log(
        `HOP 5 WMS→FIN: FG-receipt GL posted to entries — material=${materialId}, qty=${quantity}, ` +
          `value=${value}, entryId=${result.data}, ref=${reference}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Error processing WmsFgReceivedEvent (GL): ${(error as Error).message}`);
    }
  }

  /** Parametrized unit-cost lookup; null when no positive cost is known (never invents money). */
  private async resolveValue(materialId: number, quantity: number): Promise<number | null> {
    try {
      const res = await runQuery<{ unit_price: string | null; last_purchase_price: string | null }>(sql`
        SELECT unit_price, last_purchase_price FROM material_cards WHERE id = ${materialId} LIMIT 1
      `);
      const rows = Array.isArray(res?.rows) ? res.rows : [];
      const row = rows[0];
      if (!row) return null;
      const unitPrice = Number(row.unit_price);
      const lastPurchase = Number(row.last_purchase_price);
      const unitCost =
        Number.isFinite(unitPrice) && unitPrice > 0
          ? unitPrice
          : Number.isFinite(lastPurchase) && lastPurchase > 0
            ? lastPurchase
            : null;
      if (unitCost == null) return null;
      return Math.round(quantity * unitCost * 100) / 100;
    } catch (error: unknown) {
      this.logger.error(
        `WmsFgReceivedGlListener.resolveValue failed for material ${materialId}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
