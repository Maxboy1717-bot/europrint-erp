/**
 * @module drizzle-pp-production-order-lines.repo
 * @description Drizzle implementation of the production_order_lines port (multi-line order,
 *   EP-PP-118 / vision 07-pp#124). Exactly like the pp_reason_codes sibling
 *   (drizzle-pp-reason-codes.repo.ts), this migration-added table is read/written through
 *   parameterised runQuery (Rule B — every value bound, never sql.raw of a variable), because
 *   @europrint/schemas resolves productionOrders from the apps/api compat layer rather than the
 *   lib/db module where productionOrderLines is mirrored — a lib/db-only table object is not
 *   import-resolvable at runtime. All methods return Result<T> and guard rows with Array.isArray
 *   (Rule 1/2/15).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpProductionOrderLinesRepo,
  ProductionOrderLineRow,
  CreateOrderLineInput,
  UpdateOrderLineInput,
} from './i-pp-production-order-lines.repo';

/** Raw DB row shape (snake_case) before mapping to the camelCase API view. */
interface OrderLineDbRow {
  id: number | string;
  production_order_id: number | string;
  product_id: number | string;
  quantity: string | number;
  route_id: number | string | null;
  seq: number | string;
  status: string;
  notes: string | null;
}

function mapRow(row: OrderLineDbRow): ProductionOrderLineRow {
  return {
    id: Number(row.id),
    productionOrderId: Number(row.production_order_id),
    productId: Number(row.product_id),
    quantity: String(row.quantity ?? '0'),
    routeId: row.route_id != null ? Number(row.route_id) : null,
    seq: Number(row.seq ?? 1),
    status: String(row.status),
    notes: row.notes != null ? String(row.notes) : null,
  };
}

const COLS = sql`id, production_order_id, product_id, quantity, route_id, seq, status, notes`;

@Injectable()
export class DrizzlePpProductionOrderLinesRepository implements IPpProductionOrderLinesRepo {
  async orderExists(productionOrderId: number): Promise<Result<boolean>> {
    try {
      const r = await runQuery<{ ok: boolean }>(sql`
        SELECT EXISTS (
          SELECT 1 FROM production_orders WHERE id = ${productionOrderId} AND deleted_at IS NULL
        ) AS ok`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows[0]?.ok === true);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Buyurtmani tekshirishda xatolik'));
    }
  }

  async findByOrder(productionOrderId: number): Promise<Result<ProductionOrderLineRow[]>> {
    try {
      const r = await runQuery<OrderLineDbRow>(sql`
        SELECT ${COLS} FROM production_order_lines
        WHERE production_order_id = ${productionOrderId}
        ORDER BY seq, id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapRow));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Buyurtma qatorlarini o'qishda xatolik"));
    }
  }

  async findById(id: number): Promise<Result<ProductionOrderLineRow | null>> {
    try {
      const r = await runQuery<OrderLineDbRow>(sql`
        SELECT ${COLS} FROM production_order_lines WHERE id = ${id} LIMIT 1`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Qator topilmadi'));
    }
  }

  // seq: caller value when supplied, else MAX(seq)+1 for the order (append). The unique
  // (production_order_id, seq) index rejects a duplicate position -> mapped to CONFLICT below.
  async create(productionOrderId: number, dto: CreateOrderLineInput): Promise<Result<ProductionOrderLineRow>> {
    try {
      const r = await runQuery<OrderLineDbRow>(sql`
        INSERT INTO production_order_lines (production_order_id, product_id, quantity, route_id, seq, status, notes)
        VALUES (
          ${productionOrderId},
          ${dto.productId},
          ${dto.quantity},
          ${dto.routeId ?? null},
          COALESCE(${dto.seq ?? null}, (SELECT COALESCE(MAX(seq), 0) + 1 FROM production_order_lines WHERE production_order_id = ${productionOrderId})),
          COALESCE(${dto.status ?? null}, 'created'),
          ${dto.notes ?? null}
        )
        RETURNING ${COLS}`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Qator yaratilmadi'));
      return Ok(mapRow(row));
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Qator yaratishda xatolik';
      // 23505 = unique_violation (duplicate (order, seq)); 23503 = FK violation (bad order).
      if (/23505/.test(msg) || /duplicate key/i.test(msg)) return Err(AppErr('CONFLICT', 'Bu pozitsiya (seq) band'));
      if (/23503/.test(msg)) return Err(AppErr('NOT_FOUND', 'Buyurtma topilmadi'));
      return Err(AppErr('DB_ERROR', msg));
    }
  }

  async update(id: number, patch: UpdateOrderLineInput): Promise<Result<ProductionOrderLineRow | null>> {
    try {
      // COALESCE(param, column): a field is written only when supplied (non-null); an omitted
      // field keeps its current value. route_id is reassigned the same way (passing null keeps
      // the current route rather than clearing it — a full clear is a rare op, not modelled here).
      const r = await runQuery<OrderLineDbRow>(sql`
        UPDATE production_order_lines SET
          product_id = COALESCE(${patch.productId ?? null}, product_id),
          quantity   = COALESCE(${patch.quantity ?? null}, quantity),
          route_id   = COALESCE(${patch.routeId ?? null}, route_id),
          seq        = COALESCE(${patch.seq ?? null}, seq),
          status     = COALESCE(${patch.status ?? null}, status),
          notes      = COALESCE(${patch.notes ?? null}, notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING ${COLS}`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Qatorni yangilashda xatolik';
      if (/23505/.test(msg) || /duplicate key/i.test(msg)) return Err(AppErr('CONFLICT', 'Bu pozitsiya (seq) band'));
      return Err(AppErr('DB_ERROR', msg));
    }
  }

  async remove(id: number): Promise<Result<boolean>> {
    try {
      const r = await runQuery<{ id: number | string }>(sql`
        DELETE FROM production_order_lines WHERE id = ${id} RETURNING id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.length > 0);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Qatorni o'chirishda xatolik"));
    }
  }
}
