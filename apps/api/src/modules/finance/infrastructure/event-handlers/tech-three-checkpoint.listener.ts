/**
 * @module tech-three-checkpoint.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(TechThreeCheckpointEvent)` form. Migrated from the legacy
 *   `@OnEvent(ERP_EVENTS.TECH_THREE_CHECKPOINT)` string topic to the canonical
 *   event class. EventBridge keeps re-emitting to the legacy string topic for
 *   any non-migrated emit sites — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Trigger 6 — Tech 3-checkpoint to'liq tasdiqlandi → FI advance check.
 *
 *   Mantiq:
 *     1. sales_orders.tech_bom_approved + routing + card barchasi true bo'lsa
 *     2. advance_paid_amount / total_value >= advance_required_percent → advance OK
 *        → master_status = 'ready_for_planning' + emit ADVANCE_APPROVED (Trigger 7)
 *     3. advance yetmasa → master_status = 'pending_advance' + emit (eslatma uchun)
 *
 *   ARCHITECTURE.md §10 #6, §8.1 (HARD BLOCK)
 *
 *   SB0811/SB0823 fix (2026-07-04, stale-comment correction — the chain is wired):
 *   `sd/application/commands/approve-tech-checkpoint.handler.ts` publishes this event
 *   once all 3 tech checkpoints (BOM+Routing+Card) are approved on an order
 *   (`order.isThreeCheckpointPassed()`); this listener then evaluates the advance
 *   percent and — on success — publishes `AdvanceApprovedEvent`, which
 *   `pp/infrastructure/event-handlers/advance-approved.listener.ts` consumes to unlock
 *   production planning. End-to-end: SD checkpoint → FI advance-gate → PP unlock.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { TechThreeCheckpointEvent } from '../../domain/events/tech-three-checkpoint.event';
import { AdvanceApprovedEvent } from '../../domain/events/advance-approved.event';

type Row = Record<string, unknown>;

const ADVANCE_PERCENT_DEFAULT = 70;     // ARCHITECTURE.md §8.1
const ADVANCE_PCT_TOLERANCE = 0.001;    // float taqqos toleransi

@Injectable()
@EventsHandler(TechThreeCheckpointEvent)
export class TechThreeCheckpointListener
  implements IEventHandler<TechThreeCheckpointEvent>
{
  private readonly logger = new Logger(TechThreeCheckpointListener.name);

  constructor(private readonly eventBus: EventBus) {}

  async handle(event: TechThreeCheckpointEvent): Promise<void> {
    const payload = event.props;
    if (!Number.isFinite(payload?.orderId)) {
      this.logger.warn(`Trigger 6: orderId yo'q`);
      return;
    }

    const orderR = await this.fetchOrderForAdvanceCheck(payload.orderId);
    if (isErr(orderR)) {
      this.logger.error(`Trigger 6: ${orderR.error.message}`);
      return;
    }
    const row = orderR.data;
    if (!row) {
      this.logger.warn(`Trigger 6: order ${payload.orderId} topilmadi`);
      return;
    }

    const allTechApproved = row['tech_bom_approved'] === true
      && row['tech_routing_approved'] === true
      && row['tech_card_approved'] === true;

    if (!allTechApproved) {
      this.logger.debug(`Trigger 6: order ${payload.orderId} hali to'liq tasdiqlanmagan`);
      return;
    }

    const totalValue = Number(row['total_value'] ?? 0);
    const advancePaid = Number(row['advance_paid_amount'] ?? 0);
    const advancePctRequired = Number(row['advance_required_percent'] ?? ADVANCE_PERCENT_DEFAULT);

    const advancePaidPct = totalValue > 0 ? (advancePaid / totalValue) * 100 : 0;
    const advanceOk = advancePaidPct + ADVANCE_PCT_TOLERANCE >= advancePctRequired;

    if (advanceOk) {
      const updR = await this.markReadyForPlanning(payload.orderId);
      if (isErr(updR)) {
        this.logger.error(`Trigger 6: order ${payload.orderId} update fail — ${updR.error.message}`);
        return;
      }
      // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy
      // @OnEvent(ERP_EVENTS.ADVANCE_APPROVED) listeners (e.g. PP planning unlock).
      this.eventBus.publish(
        new AdvanceApprovedEvent(payload.orderId, advancePaid, advancePaidPct),
      );
      this.logger.log(
        `Trigger 6 ✅ order ${payload.orderId}: advance OK (${advancePaidPct.toFixed(2)}%) → ready_for_planning`,
      );
    } else {
      const updR = await this.markPendingAdvance(payload.orderId);
      if (isErr(updR)) {
        this.logger.error(`Trigger 6: order ${payload.orderId} pending update fail — ${updR.error.message}`);
        return;
      }
      this.logger.warn(
        `Trigger 6 ⏳ order ${payload.orderId}: advance ${advancePaidPct.toFixed(2)}% < ${advancePctRequired}% — pending_advance`,
      );
    }
  }

  private async fetchOrderForAdvanceCheck(orderId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // SB0811/SB0823 fix (2026-07-04): the live sales_orders column is `advance_percent`,
      // NOT `advance_required_percent` (that column does not exist) — this SELECT threw a
      // DB_ERROR on every invocation, silently no-op'ing Trigger 6 for every order (caught by
      // safeCall, logged, order stuck at master_status='pending_technology' forever).
      const result = await db.execute<Row>(sql`
        SELECT id, total_value, advance_paid_amount, advance_percent AS advance_required_percent,
               tech_bom_approved, tech_routing_approved, tech_card_approved,
               master_status
        FROM sales_orders
        WHERE id = ${orderId}
        LIMIT 1
      `);
      const list = Array.isArray((result as { rows?: Row[] }).rows)
        ? ((result as { rows: Row[] }).rows)
        : (Array.isArray(result) ? (result as Row[]) : []);
      return list[0] ?? null;
    }, 'DB_ERROR');
  }

  private async markReadyForPlanning(orderId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const upd = await db.execute<Row>(sql`
        UPDATE sales_orders
        SET master_status = 'ready_for_planning',
            advance_status = 'advance_completed',
            pp_queued_at = NOW(),
            updated_at = NOW()
        WHERE id = ${orderId}
          AND master_status IN ('pending_technology', 'pending_advance')
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }

  private async markPendingAdvance(orderId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const upd = await db.execute<Row>(sql`
        UPDATE sales_orders
        SET master_status = 'pending_advance',
            advance_status = 'partial_advance',
            updated_at = NOW()
        WHERE id = ${orderId}
          AND master_status = 'pending_technology'
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }
}
