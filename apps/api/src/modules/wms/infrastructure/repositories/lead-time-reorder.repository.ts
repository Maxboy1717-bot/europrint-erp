/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express the
 *   `WITH new_req AS (INSERT ... RETURNING id) INSERT INTO ... SELECT id, ...`
 *   chained CTE that creates the requisition header + one item in a single
 *   statement (atomic, no explicit transaction), nor the sequence-generated
 *   `nextval('purchase_requisition_seq')` requisition number. This mirrors the
 *   already-proven write path in rop-trigger.handler.ts.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module lead-time-reorder.repository
 * @description Repository / data-access layer for 10-wms #39 (lead-time change ->
 *   reorder recompute + auto-draft PR). Owns all DB access (Qoida 15); returns
 *   Result<T>. Reads/writes the canonical `inventory_policy` table (never a fork)
 *   and the `mm_purchase_requisitions` updatable view (over base `purchase_requisitions`).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';
import { safeNum } from '@common/math/math-utils';

export interface PolicyRow {
  materialId: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
}

export interface StockRow {
  name: string;
  currentStock: number;
}

export interface DraftPrRow {
  requisitionId: number;
  requisitionNumber: string;
  status: string;
  quantity: number;
}

@Injectable()
export class LeadTimeReorderRepository {
  private readonly logger = new Logger(LeadTimeReorderRepository.name);

  /** Canonical policy row for a material (null when the material has no policy). */
  async getPolicy(materialId: number): Promise<Result<PolicyRow | null>> {
    return safeCall(async () => {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT material_id,
               safety_stock::numeric        AS safety_stock,
               reorder_point::numeric       AS reorder_point,
               COALESCE(lead_time_days, 1)::integer AS lead_time_days
        FROM inventory_policy
        WHERE material_id = ${materialId}
      `);
      const row = (r.rows ?? [])[0];
      if (!row) return null;
      return {
        materialId: safeNum(row['material_id']),
        safetyStock: safeNum(row['safety_stock']),
        reorderPoint: safeNum(row['reorder_point']),
        leadTimeDays: safeNum(row['lead_time_days']),
      } as PolicyRow;
    }, 'DB_ERROR');
  }

  /** Canonical on-hand from material_cards (single source of truth for inventory position). */
  async getStock(materialId: number): Promise<Result<StockRow | null>> {
    return safeCall(async () => {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT COALESCE(xom_ashyo, kod, 'Material') AS name,
               COALESCE(current_stock, 0)::numeric  AS current_stock
        FROM material_cards
        WHERE id = ${materialId}
      `);
      const row = (r.rows ?? [])[0];
      if (!row) return null;
      return { name: String(row['name'] ?? 'Material'), currentStock: safeNum(row['current_stock']) } as StockRow;
    }, 'DB_ERROR');
  }

  /** Persist the recomputed reorder point + new lead time; stamp the event-driven recompute time. */
  async updatePolicyReorder(materialId: number, leadTimeDays: number, reorderPoint: number): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        UPDATE inventory_policy
           SET lead_time_days        = ${leadTimeDays},
               reorder_point         = ${reorderPoint},
               reorder_recomputed_at = NOW(),
               updated_at            = NOW()
         WHERE material_id = ${materialId}
      `);
    }, 'DB_ERROR');
  }

  /** Idempotency: an open (pending/approved) requisition for this material within the last 24h. */
  async hasOpenRequisition(materialId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const r = await runQuery<{ id: number }>(sql`
        SELECT pr.id
        FROM mm_purchase_requisitions pr
        JOIN mm_purchase_requisition_items pri ON pri.requisition_id = pr.id
        WHERE pri.material_id = ${materialId}
          AND pr.status IN ('pending', 'approved')
          AND pr.created_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
      `);
      return (r.rows ?? []).length > 0;
    }, 'DB_ERROR');
  }

  /** Create a DRAFT (status='pending') requisition + one line; manual approval required. */
  async createDraftRequisition(
    materialId: number,
    quantity: number,
    title: string,
    notes: string,
  ): Promise<Result<DraftPrRow>> {
    return safeCall(async () => {
      const ins = await runQuery<{ requisition_id: number }>(sql`
        WITH new_req AS (
          INSERT INTO mm_purchase_requisitions
            (requisition_number, material_id, required_quantity, required_date,
             title, notes, status, created_at, updated_at)
          VALUES (
            'PR-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('purchase_requisition_seq')::text, 6, '0'),
            ${materialId}, ${quantity}, to_char(NOW(), 'YYYY-MM-DD'),
            ${title}, ${notes}, 'pending', NOW(), NOW()
          )
          RETURNING id
        )
        INSERT INTO mm_purchase_requisition_items (requisition_id, material_id, quantity)
        SELECT id, ${materialId}, ${quantity} FROM new_req
        RETURNING requisition_id
      `);
      const reqId = safeNum((ins.rows ?? [])[0]?.requisition_id);
      const hdr = await runQuery<Record<string, unknown>>(sql`
        SELECT requisition_number, status
        FROM mm_purchase_requisitions
        WHERE id = ${reqId}
      `);
      const h = (hdr.rows ?? [])[0] ?? {};
      return {
        requisitionId: reqId,
        requisitionNumber: String(h['requisition_number'] ?? ''),
        status: String(h['status'] ?? 'pending'),
        quantity,
      } as DraftPrRow;
    }, 'DB_ERROR');
  }
}
