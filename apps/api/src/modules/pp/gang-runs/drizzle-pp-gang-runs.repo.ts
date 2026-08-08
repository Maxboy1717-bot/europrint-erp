/**
 * @module drizzle-pp-gang-runs.repo
 * @description Drizzle implementation of the gang-run port (pp_gang_runs / pp_gang_run_orders,
 *   vision 07-pp#37). Like the sibling reason-code repo, the tables are read/written through
 *   parameterised runQuery (Rule B: no sql.raw of a variable; every value — including the
 *   int[]/numeric[]/text[] arrays passed to unnest — is bound). Header+members are written in
 *   one statement via a data-modifying CTE so a gang run and its rows are created/finalized
 *   atomically. All methods return Result<T> and guard rows with Array.isArray.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpGangRunsRepo,
  GangRunHeaderRow,
  GangRunMemberRow,
  OrderQtyRow,
  GangRunMemberInput,
  GangRunAllocation,
} from './i-pp-gang-runs.repo';

/** Raw header row (snake_case) before mapping to the camelCase API view. */
interface GangRunHeaderDbRow {
  id: number | string;
  print_job_ref: string;
  status: string;
  total_brak_qty: number | string;
  created_by: number | string | null;
  accepted_at: string | Date | null;
  created_at: string | Date | null;
}

/** Raw member row (snake_case) before mapping. */
interface GangRunMemberDbRow {
  production_order_id: number | string;
  order_quantity: number | string;
  brak_qty: number | string;
  acceptance_act_id: string | null;
}

/** Raw order-quantity snapshot row. */
interface OrderQtyDbRow {
  id: number | string;
  quantity: number | string;
}

function mapHeader(row: GangRunHeaderDbRow): GangRunHeaderRow {
  return {
    id: Number(row.id),
    printJobRef: String(row.print_job_ref),
    status: String(row.status),
    totalBrakQty: Number(row.total_brak_qty ?? 0),
    createdBy: row.created_by != null ? Number(row.created_by) : null,
    acceptedAt: row.accepted_at != null ? new Date(row.accepted_at).toISOString() : null,
    createdAt: row.created_at != null ? new Date(row.created_at).toISOString() : null,
  };
}

function mapMember(row: GangRunMemberDbRow): GangRunMemberRow {
  return {
    productionOrderId: Number(row.production_order_id),
    orderQuantity: Number(row.order_quantity ?? 0),
    brakQty: Number(row.brak_qty ?? 0),
    acceptanceActId: row.acceptance_act_id != null ? String(row.acceptance_act_id) : null,
  };
}

@Injectable()
export class DrizzlePpGangRunsRepository implements IPpGangRunsRepo {
  async orderQuantities(orderIds: number[]): Promise<Result<OrderQtyRow[]>> {
    try {
      const ids = Array.isArray(orderIds) ? orderIds : [];
      if (ids.length === 0) return Ok([]);
      // Split weight = the order's own quantity (planned first, then legacy scalar quantity).
      const r = await runQuery<OrderQtyDbRow>(sql`
        SELECT id, COALESCE(planned_quantity, quantity, 0)::numeric AS quantity
        FROM production_orders
        WHERE id = ANY(${ids}::int[]) AND deleted_at IS NULL
        ORDER BY id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map((row) => ({ id: Number(row.id), quantity: Number(row.quantity ?? 0) })));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Buyurtma miqdorlarini o'qishda xatolik"));
    }
  }

  async insertGangRun(
    printJobRef: string,
    createdBy: number | null,
    members: GangRunMemberInput[],
  ): Promise<Result<GangRunHeaderRow>> {
    try {
      const list = Array.isArray(members) ? members : [];
      const ids = list.map((m) => Number(m.productionOrderId));
      const qtys = list.map((m) => Number(m.orderQuantity));
      // Atomic: insert header, then fan the member rows in from unnest(int[], numeric[])
      // pairing each order id with its snapshotted quantity — one statement, one transaction.
      const r = await runQuery<GangRunHeaderDbRow>(sql`
        WITH gr AS (
          INSERT INTO pp_gang_runs (print_job_ref, status, created_by)
          VALUES (${printJobRef}, 'open', ${createdBy})
          RETURNING id, print_job_ref, status, total_brak_qty, created_by, accepted_at, created_at
        ), ins AS (
          INSERT INTO pp_gang_run_orders (gang_run_id, production_order_id, order_quantity)
          SELECT gr.id, t.oid, t.qty
          FROM gr, unnest(${ids}::int[], ${qtys}::numeric[]) AS t(oid, qty)
          RETURNING 1
        )
        SELECT * FROM gr`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Gang-run yaratilmadi'));
      return Ok(mapHeader(row));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Gang-run yaratishda xatolik'));
    }
  }

  async findHeader(gangRunId: number): Promise<Result<GangRunHeaderRow | null>> {
    try {
      const r = await runQuery<GangRunHeaderDbRow>(sql`
        SELECT id, print_job_ref, status, total_brak_qty, created_by, accepted_at, created_at
        FROM pp_gang_runs WHERE id = ${gangRunId}`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapHeader(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Gang-run o'qishda xatolik"));
    }
  }

  async findMembers(gangRunId: number): Promise<Result<GangRunMemberRow[]>> {
    try {
      const r = await runQuery<GangRunMemberDbRow>(sql`
        SELECT production_order_id, order_quantity, brak_qty, acceptance_act_id
        FROM pp_gang_run_orders WHERE gang_run_id = ${gangRunId}
        ORDER BY production_order_id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapMember));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Gang-run a'zolarini o'qishda xatolik"));
    }
  }

  async listHeaders(): Promise<Result<GangRunHeaderRow[]>> {
    try {
      const r = await runQuery<GangRunHeaderDbRow>(sql`
        SELECT id, print_job_ref, status, total_brak_qty, created_by, accepted_at, created_at
        FROM pp_gang_runs ORDER BY id DESC`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapHeader));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Gang-run ro'yxatini o'qishda xatolik"));
    }
  }

  async applyAcceptance(
    gangRunId: number,
    totalBrakQty: number,
    allocations: GangRunAllocation[],
  ): Promise<Result<GangRunHeaderRow | null>> {
    try {
      const list = Array.isArray(allocations) ? allocations : [];
      const ids = list.map((a) => Number(a.productionOrderId));
      const braks = list.map((a) => Number(a.brakQty));
      const acts = list.map((a) => String(a.acceptanceActId));
      // Data-modifying CTE `upd` runs to completion (Postgres guarantees this even though
      // the main query does not read it), stamping every member's brak share + act ref;
      // the main UPDATE then finalizes the header. One statement = one atomic accept.
      const r = await runQuery<GangRunHeaderDbRow>(sql`
        WITH upd AS (
          UPDATE pp_gang_run_orders mo SET
            brak_qty = v.brak,
            acceptance_act_id = v.act,
            accepted_at = NOW()
          FROM unnest(${ids}::int[], ${braks}::numeric[], ${acts}::text[]) AS v(oid, brak, act)
          WHERE mo.gang_run_id = ${gangRunId} AND mo.production_order_id = v.oid
          RETURNING 1
        )
        UPDATE pp_gang_runs SET status = 'accepted', total_brak_qty = ${totalBrakQty}, accepted_at = NOW()
        WHERE id = ${gangRunId}
        RETURNING id, print_job_ref, status, total_brak_qty, created_by, accepted_at, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapHeader(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Gang-run qabul qilishda xatolik'));
    }
  }
}
