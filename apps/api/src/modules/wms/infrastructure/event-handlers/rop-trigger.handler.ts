import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeNum } from '@common/math/math-utils';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

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

@Injectable()
export class RopTriggerHandler {
  private readonly logger = new Logger(RopTriggerHandler.name);

  @OnEvent(ERP_EVENTS.STOCK_UPDATED)
  async handleStockLevelUpdated(payload: StockLevelUpdatedPayload): Promise<void> {
    try {
      await this.checkAndTrigger(payload.materialId);
    } catch (e) {
      this.logger.error(`ROP trigger error for material ${payload.materialId}: ${String(e)}`);
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

    await runQuery(sql`
      WITH new_req AS (
        INSERT INTO mm_purchase_requisitions (title, notes, status, created_at, updated_at)
        VALUES (
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
