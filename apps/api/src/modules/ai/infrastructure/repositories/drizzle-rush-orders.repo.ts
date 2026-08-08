/**
 * @module drizzle-rush-orders.repo
 * @description Repository / data-access layer for AI Rush Orders (owner 2026-07-13, chat).
 *   Raw SQL is used deliberately (Qoida 4 "murakkab so'rov" exception) — the candidate list
 *   needs a LEFT JOIN against `rush_order_requests` plus in-SQL date arithmetic
 *   (`requested_delivery_date::date - created_at::date`) that a Drizzle query builder cannot
 *   express cleanly; the sibling demand-forecast.service.ts built this same session uses the
 *   identical runQuery/sql-template pattern for the same reason.
 *
 *   `sales_orders` has no Drizzle pgTable exposed for the columns this file needs
 *   (order_number/customer_name/requested_delivery_date/status/master_status all live on the
 *   ADD-ONLY superset — see lib/db/src/schema/sd-orders.ts header note); referencing the raw
 *   table name keeps this file decoupled from that barrel, same convention CC/kanban use for
 *   their own raw-SQL repositories.
 * @layer Infrastructure (AI module)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';

export type RushOrderStatus = 'pending_approval' | 'approved' | 'rejected';

/** One row from the GET /ai/rush-orders candidate query — either a still-undecided
 *  qualifying order (requestId=null) or an already-decided one (requestId set, snapshot
 *  columns populated from the persisted rush_order_requests row). */
export interface RushOrderCandidateRow {
  orderId: number;
  orderNumber: string;
  customerName: string;
  requestedDeliveryDate: string | null;
  /** requested_delivery_date::date - created_at::date, computed live in SQL; null if the
   *  requested date is missing/malformed. Always reflects TODAY's dates — for an already
   *  decided row (requestId != null) prefer the persisted rushLeadDays snapshot instead. */
  computedLeadDays: number | null;
  requestId: number | null;
  status: RushOrderStatus | null;
  standardLeadDays: number | null;
  rushLeadDays: number | null;
  surchargePct: string | null;
  feasibilityScore: number | null;
  rejectedReason: string | null;
}

/** Minimal order info needed to evaluate/create a rush decision for a single order_id. */
export interface RushOrderBasicInfo {
  orderId: number;
  orderNumber: string;
  customerName: string;
  requestedDeliveryDate: string | null;
  computedLeadDays: number | null;
}

/** A persisted rush_order_requests row, joined with its order's display fields. */
export interface RushOrderRequestRow {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  requestedDeliveryDate: string | null;
  standardLeadDays: number;
  rushLeadDays: number;
  surchargePct: string;
  feasibilityScore: number;
  status: RushOrderStatus;
  rejectedReason: string | null;
}

export interface CapacitySignal {
  openProductionOrders: number;
  activeWorkCenters: number;
}

export interface InsertRushRequestInput {
  orderId: number;
  requestedBy: number;
  standardLeadDays: number;
  rushLeadDays: number;
  surchargePct: number;
  feasibilityScore: number;
  status: RushOrderStatus;
  approvedBy?: number | null;
  approvedAt?: Date | null;
  rejectedReason?: string | null;
}

// Malformed/blank requested_delivery_date values must never blow up the query with a bad
// `::date` cast — guarded with this regex both here and in the WHERE clause below.
const ISO_DATE_RE = '^\\d{4}-\\d{2}-\\d{2}$';

@Injectable()
export class DrizzleRushOrdersRepo {
  /**
   * Orders that either (a) already have a rush_order_requests row (show current status
   * regardless of today's qualification), or (b) currently qualify by the lead-days rule and
   * have no row yet (virtual "pending_approval" candidate). Terminal orders (cancelled) are
   * excluded from the (b) branch only — an order that already has a tracked decision keeps
   * showing even if it later moved to a terminal status.
   */
  async listCandidates(maxLeadDays: number): Promise<Result<RushOrderCandidateRow[]>> {
    return safeCall(async () => {
      const r = await runQuery<{
        order_id: number;
        order_number: string | null;
        customer_name: string | null;
        requested_delivery_date: string | null;
        computed_lead_days: number | null;
        request_id: number | null;
        status: RushOrderStatus | null;
        standard_lead_days: number | null;
        rush_lead_days: number | null;
        surcharge_pct: string | null;
        feasibility_score: number | null;
        rejected_reason: string | null;
      }>(sql`
        SELECT
          so.id AS order_id,
          so.order_number,
          COALESCE(so.customer_name, '') AS customer_name,
          so.requested_delivery_date,
          CASE WHEN so.requested_delivery_date ~ ${ISO_DATE_RE}
               THEN (so.requested_delivery_date::date - so.created_at::date)
               ELSE NULL END AS computed_lead_days,
          ror.id AS request_id,
          ror.status,
          ror.standard_lead_days,
          ror.rush_lead_days,
          ror.surcharge_pct,
          ror.feasibility_score,
          ror.rejected_reason
        FROM sales_orders so
        LEFT JOIN rush_order_requests ror ON ror.order_id = so.id
        WHERE so.deleted_at IS NULL
          AND (
            ror.id IS NOT NULL
            OR (
              so.requested_delivery_date ~ ${ISO_DATE_RE}
              AND (so.requested_delivery_date::date - so.created_at::date) BETWEEN 0 AND ${maxLeadDays}
              AND COALESCE(so.status, '') NOT ILIKE 'cancelled'
            )
          )
        ORDER BY so.created_at DESC
        LIMIT 200
      `);

      return (Array.isArray(r.rows) ? r.rows : []).map((row) => ({
        orderId: row.order_id,
        orderNumber: row.order_number ?? '',
        customerName: row.customer_name ?? '',
        requestedDeliveryDate: row.requested_delivery_date,
        computedLeadDays: row.computed_lead_days,
        requestId: row.request_id,
        status: row.status,
        standardLeadDays: row.standard_lead_days,
        rushLeadDays: row.rush_lead_days,
        surchargePct: row.surcharge_pct,
        feasibilityScore: row.feasibility_score,
        rejectedReason: row.rejected_reason,
      }));
    });
  }

  /** Live capacity snapshot used by the feasibility-score load component. */
  async getCapacitySignal(): Promise<Result<CapacitySignal>> {
    return safeCall(async () => {
      const r = await runQuery<{ open_orders: string; active_work_centers: string }>(sql`
        SELECT
          (SELECT COUNT(*) FROM production_orders WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled', 'closed')) AS open_orders,
          (SELECT COUNT(*) FROM work_centers WHERE is_active = true AND deleted_at IS NULL) AS active_work_centers
      `);
      const row = r.rows[0];
      return {
        openProductionOrders: Number(row?.open_orders ?? 0),
        activeWorkCenters: Number(row?.active_work_centers ?? 0),
      };
    });
  }

  /** Basic order fields needed to (re)evaluate rush qualification for a single order_id. */
  async getOrderBasicInfo(orderId: number): Promise<Result<RushOrderBasicInfo | null>> {
    return safeCall(async () => {
      const r = await runQuery<{
        order_id: number;
        order_number: string | null;
        customer_name: string | null;
        requested_delivery_date: string | null;
        computed_lead_days: number | null;
      }>(sql`
        SELECT
          so.id AS order_id,
          so.order_number,
          COALESCE(so.customer_name, '') AS customer_name,
          so.requested_delivery_date,
          CASE WHEN so.requested_delivery_date ~ ${ISO_DATE_RE}
               THEN (so.requested_delivery_date::date - so.created_at::date)
               ELSE NULL END AS computed_lead_days
        FROM sales_orders so
        WHERE so.id = ${orderId} AND so.deleted_at IS NULL
        LIMIT 1
      `);
      const row = r.rows[0];
      if (!row) return null;
      return {
        orderId: row.order_id,
        orderNumber: row.order_number ?? '',
        customerName: row.customer_name ?? '',
        requestedDeliveryDate: row.requested_delivery_date,
        computedLeadDays: row.computed_lead_days,
      };
    });
  }

  /** The current (unique per order_id) rush decision row, joined with order display fields. */
  async getRequestByOrderId(orderId: number): Promise<Result<RushOrderRequestRow | null>> {
    return safeCall(async () => {
      const r = await runQuery<{
        id: number;
        order_id: number;
        order_number: string | null;
        customer_name: string | null;
        requested_delivery_date: string | null;
        standard_lead_days: number;
        rush_lead_days: number;
        surcharge_pct: string;
        feasibility_score: number;
        status: RushOrderStatus;
        rejected_reason: string | null;
      }>(sql`
        SELECT
          ror.id, ror.order_id, ror.standard_lead_days, ror.rush_lead_days,
          ror.surcharge_pct, ror.feasibility_score, ror.status, ror.rejected_reason,
          so.order_number, COALESCE(so.customer_name, '') AS customer_name, so.requested_delivery_date
        FROM rush_order_requests ror
        JOIN sales_orders so ON so.id = ror.order_id
        WHERE ror.order_id = ${orderId}
        LIMIT 1
      `);
      const row = r.rows[0];
      if (!row) return null;
      return {
        id: row.id,
        orderId: row.order_id,
        orderNumber: row.order_number ?? '',
        customerName: row.customer_name ?? '',
        requestedDeliveryDate: row.requested_delivery_date,
        standardLeadDays: row.standard_lead_days,
        rushLeadDays: row.rush_lead_days,
        surchargePct: row.surcharge_pct,
        feasibilityScore: row.feasibility_score,
        status: row.status,
        rejectedReason: row.rejected_reason,
      };
    });
  }

  /** Creates the first (and thereafter unique) rush decision row for an order. */
  async insertRequest(input: InsertRushRequestInput): Promise<Result<RushOrderRequestRow>> {
    return safeCall(async () => {
      await runQuery(sql`
        INSERT INTO rush_order_requests
          (order_id, requested_by, standard_lead_days, rush_lead_days, surcharge_pct, feasibility_score, status, approved_by, approved_at, rejected_reason)
        VALUES (
          ${input.orderId}, ${input.requestedBy}, ${input.standardLeadDays}, ${input.rushLeadDays},
          ${input.surchargePct}, ${input.feasibilityScore}, ${input.status},
          ${input.approvedBy ?? null}, ${input.approvedAt ?? null}, ${input.rejectedReason ?? null}
        )
      `);
      const created = await this.getRequestByOrderId(input.orderId);
      if (!created.ok) throw new Error(created.error.message);
      if (!created.data) throw new Error('rush_order_requests insert did not persist');
      return created.data;
    });
  }

  /** Transitions an existing rush decision row (pending_approval -> approved|rejected). */
  async updateStatus(
    id: number,
    orderId: number,
    status: RushOrderStatus,
    extra: { approvedBy?: number | null; approvedAt?: Date | null; rejectedReason?: string | null },
  ): Promise<Result<RushOrderRequestRow>> {
    return safeCall(async () => {
      await runQuery(sql`
        UPDATE rush_order_requests
        SET status = ${status},
            approved_by = ${extra.approvedBy ?? null},
            approved_at = ${extra.approvedAt ?? null},
            rejected_reason = ${extra.rejectedReason ?? null},
            updated_at = now()
        WHERE id = ${id}
      `);
      const updated = await this.getRequestByOrderId(orderId);
      if (!updated.ok) throw new Error(updated.error.message);
      if (!updated.data) throw new Error('rush_order_requests update did not persist');
      return updated.data;
    });
  }
}
