/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   parameterised INTERVAL cast (NOW() - (${DEDUP_WINDOW})::interval) for
 *   24-hour idempotency window, and the WITH new_req AS (INSERT ...
 *   RETURNING id) INSERT INTO ... SELECT id, ... FROM new_req chained CTE
 *   that creates the requisition header and one item in a single statement
 *   to keep the operation atomic without an explicit transaction.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module rop-trigger.handler
 * @description Reorder-Point trigger: listens for stock-level changes and
 *   automatically creates a purchase requisition when a material drops
 *   below its configured reorder point (ROP). Suggested quantity = the
 *   material's EOQ (computed elsewhere; see `wms-eoq.service.ts`).
 *
 *   Trigger logic:
 *     1. Stock movement fires `STOCK_UPDATED` event with new on-hand
 *     2. Load material policy: { reorder_point, eoq }
 *     3. If newOnHand < reorder_point AND no recent requisition exists:
 *          create requisition with qty = EOQ, source = AUTO_ROP_TRIGGER
 *     4. Else: no-op
 * @layer Event Handler (WMS)
 *
 * WHY EVENT-DRIVEN (not polled)
 *   Polling every material every minute = O(materials × frequency) and
 *   gives the buyer no real-time signal. Event-driven means the requisition
 *   is created within seconds of the stock crossing the threshold —
 *   buyer sees it on their dashboard before next refresh, can act ASAP.
 *
 *   The cost is one DB query per movement (for the policy lookup) which
 *   is trivially indexed.
 *
 * WHY 24-HOUR DEDUP WINDOW
 *   Without dedup, every subsequent stock movement (each issue, each
 *   small write-off) would create a NEW requisition for the same shortage —
 *   spamming the buyer's inbox with duplicates. The 24h window matches
 *   one business day: if buyer hasn't acted on yesterday's req, today's
 *   shortage doesn't need another one.
 *
 *   24 hours is a SQL interval literal because we need PostgreSQL to
 *   compute the cutoff with its timezone-aware time math (consistent
 *   with `pos_movements.created_at` semantics).
 *
 * WHY AUTO_ROP_SOURCE TAG ON THE REQUISITION
 *   Buyers need to know which reqs are auto-generated vs hand-entered —
 *   auto reqs get bulk-approval workflows, manual reqs are reviewed
 *   one-by-one. The `source` column on `purchase_requisitions` lets the
 *   approval dashboard filter.
 *
 * WHY NO Result<T> RETURN HERE
 *   Event handlers are fire-and-forget — they don't return values to a
 *   caller. The try/catch wraps the failure into a log entry so we
 *   don't crash the event emitter loop. If buyers report missing
 *   auto-reqs, check the logs for this handler's errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeNum } from '@common/math/math-utils';
import { StockUpdatedEvent } from '@modules/wms/application/events/stock-updated.event';

const AUTO_ROP_SOURCE = 'AUTO_ROP_TRIGGER';
// Idempotency window: 24 hours per spec (prevents duplicate requisitions within one business day)
const DEDUP_WINDOW = '24 hours';

export interface StockLevelUpdatedPayload {
  materialId: number;
  newOnHand: number;
}

interface PolicyRow {
  material_id: number;
  reorder_point: number;
  eoq: number;
}

interface ReqCheckRow {
  id: number;
}

interface MaterialRow {
  name: string;
  code: string;
  current_stock: number;
  min_order_qty: number;
}

/**
 * PA2-18 Wave 6: converted from `@OnEvent(ERP_EVENTS.STOCK_UPDATED)` to canonical
 *   `@EventsHandler(StockUpdatedEvent)`. The event class lives in
 *   wms/application/events/stock-updated.event.ts; EventBridge re-emits to any
 *   straggler @OnEvent listeners during the migration window.
 */
@Injectable()
@EventsHandler(StockUpdatedEvent)
export class RopTriggerHandler implements IEventHandler<StockUpdatedEvent> {
  private readonly logger = new Logger(RopTriggerHandler.name);

  async handle(event: StockUpdatedEvent): Promise<void> {
    try {
      await this.checkAndTrigger(event.materialId);
    } catch (e) {
      this.logger.error(`ROP trigger error for material ${event.materialId}: ${String(e)}`);
    }
  }

  private async checkAndTrigger(materialId: number): Promise<void> {
    // Join inventory_policy to get both ROP and policy EOQ in one query
    const policyRows = await runQuery<PolicyRow>(sql`
      SELECT material_id,
             reorder_point::numeric AS reorder_point,
             COALESCE(eoq, 0)::numeric AS eoq
      FROM inventory_policy
      WHERE material_id = ${materialId}
    `);

    const policy = policyRows.rows[0];
    if (!policy) return;

    const rop = safeNum(policy.reorder_point);

    // Canonical on-hand from material_cards — single source of truth for inventory position
    const matRows = await runQuery<MaterialRow>(sql`
      SELECT COALESCE(xom_ashyo, kod, 'Material') AS name,
             COALESCE(kod, '') AS code,
             COALESCE(current_stock, 0)::numeric AS current_stock,
             COALESCE(min_stock, 0)::numeric AS min_order_qty
      FROM material_cards WHERE id = ${materialId}
    `);

    const mat = matRows.rows[0];
    if (!mat) return;

    const canonicalOnHand = safeNum(mat.current_stock);
    if (canonicalOnHand > rop) return;

    // Idempotency: skip if an open requisition exists within dedup window
    const existing = await runQuery<ReqCheckRow>(sql`
      SELECT pr.id
      FROM mm_purchase_requisitions pr
      JOIN mm_purchase_requisition_items pri ON pri.requisition_id = pr.id
      WHERE pri.material_id = ${materialId}
        AND pr.status IN ('pending', 'approved')
        AND pr.created_at > NOW() - (${DEDUP_WINDOW})::interval
      LIMIT 1
    `);

    if ((existing.rows ?? []).length > 0) {
      this.logger.log(`ROP: material ${materialId} — active requisition within ${DEDUP_WINDOW}, skipping`);
      return;
    }

    // Order quantity precedence (spec): material_recommendation.eoq_qty → material_cards.min_order_qty → 1
    const recRows = await runQuery<{ eoq_qty: number }>(sql`
      SELECT COALESCE(eoq_qty, 0)::numeric AS eoq_qty
      FROM material_recommendation WHERE material_id = ${materialId}
    `);

    const recommendedEoq = recRows.rows[0] ? safeNum(recRows.rows[0].eoq_qty) : 0;
    const minOrderQty = safeNum(mat.min_order_qty);
    const orderQty = recommendedEoq > 0 ? recommendedEoq : minOrderQty > 0 ? minOrderQty : 1;
    const priority = canonicalOnHand <= 0 ? 'URGENT' : 'NORMAL';

    // Q-46 (2026-07-02): `mm_purchase_requisitions` is an updatable VIEW over the
    // base table `purchase_requisitions` (pg_get_viewdef-verified), which enforces
    // NOT NULL on requisition_number/material_id/required_quantity/required_date.
    // The header INSERT here previously omitted all four — every ROP trigger fire
    // threw 23502 on the header row, caught by `handle()`'s try/catch and only
    // logged (never surfaced to a buyer), so the auto-requisition was silently
    // never created. Fix: supply requisition_number (from the canonical
    // `purchase_requisition_seq` sequence), material_id + required_quantity (the
    // real triggering material/qty already computed above), and required_date
    // (today — required_date is `varchar(10)` 'YYYY-MM-DD', and "at/below ROP"
    // means the need is immediate, not a fabricated future date).
    await runQuery(sql`
      WITH new_req AS (
        INSERT INTO mm_purchase_requisitions
          (requisition_number, material_id, required_quantity, required_date,
           title, notes, status, created_at, updated_at)
        VALUES (
          'PR-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('purchase_requisition_seq')::text, 6, '0'),
          ${materialId}, ${orderQty}, to_char(NOW(), 'YYYY-MM-DD'),
          ${`[${AUTO_ROP_SOURCE}] ${mat.name} #${materialId} — ${priority}`},
          ${`ROP trigger: on_hand=${canonicalOnHand} ≤ rop=${rop}. Priority: ${priority}. Source: ${AUTO_ROP_SOURCE}`},
          'pending',
          NOW(), NOW()
        )
        RETURNING id
      )
      INSERT INTO mm_purchase_requisition_items (requisition_id, material_id, quantity)
      SELECT id, ${materialId}, ${orderQty} FROM new_req
    `);

    this.logger.log(
      `ROP trigger: material ${materialId}, on_hand=${canonicalOnHand}, rop=${rop}, qty=${orderQty}, priority=${priority}`,
    );
  }
}
