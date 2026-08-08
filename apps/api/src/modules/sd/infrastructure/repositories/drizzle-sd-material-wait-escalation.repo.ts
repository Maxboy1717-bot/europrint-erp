/**
 * @module drizzle-sd-material-wait-escalation.repo
 * @description Repository for 06-sd #2 — MaterialRequiredEvent + MM reject / 24h→48h
 *   escalation. Owns ALL DB access for the material-wait escalation sweep via
 *   parametrised raw SQL (typedExecute) — NO Drizzle table objects imported (the
 *   new table has no schema def; raw SQL avoids the stale-dist rebuild dance).
 *   Result<T> everywhere (Qoida 1/6/15). Standalone — no constructor deps.
 *
 *   Data sources (all pre-existing, canonical):
 *     - hitl_approvals (entity_type='order_material_waiting') — the MM-side review
 *       queue already written by OrderMaterialWaitingListener; created_at is the
 *       material-wait clock; status='rejected' is the MM-reject signal.
 *     - sales_orders.status (varchar) — parked at 'material-wait' (Ожд.Сырьё).
 *     - domain_events — durable outbox; the MaterialWaitEscalated row is drained by
 *       the existing OutboxPublisher for downstream Telegram/notification.
 *     - sd_material_wait_escalations (new) — idempotent escalation ledger.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, safeCall } from '@common/result';

/** hitl_approvals.entity_type marking an SD→MM material-waiting review item. */
const MATERIAL_WAIT_ENTITY_TYPE = 'order_material_waiting';

export interface OverdueMaterialWaitRow {
  hitl_approval_id: number;
  sales_order_id: number;
  reason: string | null;
  review_status: string; // 'pending' | 'rejected'
  age_hours: number;
  current_level: number;
}

export interface RecordEscalationInput {
  salesOrderId: number;
  hitlApprovalId: number | null;
  level: number; // 1 = sales_manager (24h / MM-reject), 2 = director (48h)
  notifyRole: string; // 'sales_manager' | 'director'
  reason: string | null;
  ageHours: number;
}

@Injectable()
export class DrizzleSdMaterialWaitEscalationRepo {
  /**
   * Overdue candidates: pending material-wait review items older than `pendingHours`,
   * OR any MM-rejected material-wait review item (immediate — vision "MM rad etsa").
   * Joins the ledger to report the highest level already fired per order (idempotency input).
   */
  async findOverdue(pendingHours: number): Promise<Result<OverdueMaterialWaitRow[]>> {
    return safeCall(async () => {
      return typedExecute<OverdueMaterialWaitRow>(sql`
        SELECT h.id AS hitl_approval_id,
               h.entity_id::int AS sales_order_id,
               h.notes AS reason,
               h.status AS review_status,
               FLOOR(EXTRACT(EPOCH FROM (now() - h.created_at)) / 3600)::int AS age_hours,
               COALESCE(MAX(e.escalation_level), 0)::int AS current_level
        FROM hitl_approvals h
        LEFT JOIN sd_material_wait_escalations e ON e.sales_order_id = h.entity_id::int
        WHERE h.entity_type = ${MATERIAL_WAIT_ENTITY_TYPE}
          AND h.entity_id ~ '^[0-9]+$'
          AND (
            (h.status = 'pending' AND h.created_at < now() - make_interval(hours => ${pendingHours}::int))
            OR (h.status = 'rejected')
          )
        GROUP BY h.id, h.entity_id, h.notes, h.status, h.created_at
        ORDER BY sales_order_id
      `);
    }, 'DB_ERROR');
  }

  /** Idempotent: at most one row per (order, level) via the unique index. */
  async recordEscalation(input: RecordEscalationInput): Promise<Result<{ created: boolean }>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO sd_material_wait_escalations
          (sales_order_id, hitl_approval_id, escalation_level, notify_role, reason, age_hours)
        VALUES (${input.salesOrderId}, ${input.hitlApprovalId ?? null}, ${input.level},
                ${input.notifyRole}, ${input.reason ?? null}, ${input.ageHours})
        ON CONFLICT (sales_order_id, escalation_level) DO NOTHING
        RETURNING id
      `);
      return { created: rows.length > 0 };
    }, 'DB_ERROR');
  }

  /** Park the order in 'material-wait' (Ожд.Сырьё); never clobbers a terminal state. */
  async markOrderMaterialWait(salesOrderId: number): Promise<Result<{ updated: boolean }>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: number }>(sql`
        UPDATE sales_orders SET status = 'material-wait'
        WHERE id = ${salesOrderId}
          AND status NOT IN ('cancelled', 'closed', 'delivered', 'material-wait')
        RETURNING id
      `);
      return { updated: rows.length > 0 };
    }, 'DB_ERROR');
  }

  /**
   * Durable outbox signal (drained by OutboxPublisher → Telegram/notification).
   * Direct INSERT into domain_events (the same table OutboxRepository writes) keeps
   * this repo self-contained — no EventBus / OutboxRepository injection needed.
   */
  async emitEscalationEvent(
    salesOrderId: number,
    level: number,
    notifyRole: string,
    ageHours: number,
  ): Promise<Result<{ eventId: string | null }>> {
    return safeCall(async () => {
      const payload = JSON.stringify({ salesOrderId, escalationLevel: level, notifyRole, ageHours });
      const rows = await typedExecute<{ id: string }>(sql`
        INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload)
        VALUES ('SalesOrder', ${String(salesOrderId)}, 'MaterialWaitEscalated', ${payload}::jsonb)
        RETURNING id
      `);
      return { eventId: rows[0]?.id ?? null };
    }, 'DB_ERROR');
  }
}
