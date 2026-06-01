/**
 * @module drizzle-sd-order-departments.repo
 * @description Repository for sd_order_departments — the manager's per-order department
 *   selection that drives the Phase 4 advance-paid fan-out. Raw SQL (simple CRUD on a
 *   table with no Drizzle def); returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class SdOrderDepartmentsRepository {
  async setForOrder(orderId: number, depts: Array<{ department: string; mode?: string }>): Promise<Result<Row[]>> {
    try {
      for (const d of depts) {
        await runQuery(sql`
          INSERT INTO sd_order_departments (order_id, department, mode, status)
          VALUES (${orderId}, ${d.department}, ${d.mode ?? null}, 'pending')
          ON CONFLICT (order_id, department)
          DO UPDATE SET mode = EXCLUDED.mode, updated_at = NOW()
        `);
      }
      return this.listForOrder(orderId);
    } catch (e: unknown) { return Err((e as Error)?.message || "Bo'lim tanlashni saqlashda xatolik"); }
  }

  async listForOrder(orderId: number): Promise<Result<Row[]>> {
    try {
      const r = await runQuery<Row>(sql`
        SELECT id, order_id, department, mode, status, created_at, updated_at
        FROM sd_order_departments WHERE order_id = ${orderId} ORDER BY department
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error)?.message || "Bo'limlarni o'qishda xatolik"); }
  }

  /** Create the mold dept-job for an order (Phase 4 fan-out). Idempotent: skips if a mold
   *  row already exists for the order. vendor is NOT NULL (CHECK) — defaults to 'Internal'
   *  for auto-created jobs (the mold dept reassigns it). status defaults to 'ORDERED' (started). */
  async createMoldJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_molds (order_id, vendor, status)
        SELECT ${orderId}, 'Internal', 'ORDERED'
        WHERE NOT EXISTS (SELECT 1 FROM ow_molds WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mold job yaratishda xatolik'); }
  }

  /** Create the design dept-job (ow_tech_cards) for an order. Idempotent. Only order_id is
   *  required; status defaults to 'DRAFT' (started), content '{}', version 1. */
  async createDesignJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_tech_cards (order_id)
        SELECT ${orderId}
        WHERE NOT EXISTS (SELECT 1 FROM ow_tech_cards WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Design job yaratishda xatolik'); }
  }

  /** Advance a design tech-card status (DRAFT->REVIEW->CONFIRMED/OBSOLETE).
   *  CONFIRMED stamps approved_at and marks the design department 'done'. */
  async setDesignStatus(orderId: number, techCardId: string, status: string): Promise<Result<Row | null>> {
    try {
      const r = await runQuery<Row>(sql`
        UPDATE ow_tech_cards
           SET status = ${status},
               approved_at = CASE WHEN ${status} = 'CONFIRMED' THEN NOW() ELSE approved_at END
         WHERE id = ${techCardId}::uuid AND order_id = ${orderId}
        RETURNING id, status, approved_at
      `);
      if (!r.rows[0]) return Err('Tech card topilmadi');
      if (status === 'CONFIRMED') await this.markStatus(orderId, 'design', 'done');
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Design statusini yangilashda xatolik'); }
  }

  /** Create the cliché dept-job (ow_cliches). Idempotent. cliche_type + vendor are NOT NULL —
   *  default to 'photopolymer' (valid CHECK) and 'Internal'; the cliché dept reassigns them. */
  async createClicheJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_cliches (order_id, cliche_type, vendor)
        SELECT ${orderId}, 'photopolymer', 'Internal'
        WHERE NOT EXISTS (SELECT 1 FROM ow_cliches WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Cliché job yaratishda xatolik'); }
  }

  /** Advance a cliché status (ORDERED->IN_TRANSIT->ARRIVED/REJECTED). ARRIVED stamps
   *  arrived_at (the done signal, matching calcClichePct) + marks the cliché dept 'done'. */
  async setClicheStatus(orderId: number, clicheId: string, status: string): Promise<Result<Row | null>> {
    try {
      const r = await runQuery<Row>(sql`
        UPDATE ow_cliches
           SET status = ${status},
               arrived_at = CASE WHEN ${status} = 'ARRIVED' THEN NOW() ELSE arrived_at END,
               ready_for_flexo = CASE WHEN ${status} = 'ARRIVED' THEN true ELSE ready_for_flexo END
         WHERE id = ${clicheId}::uuid AND order_id = ${orderId}
        RETURNING id, status, arrived_at
      `);
      if (!r.rows[0]) return Err('Cliché topilmadi');
      if (status === 'ARRIVED') await this.markStatus(orderId, 'cliche', 'done');
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Cliché statusini yangilashda xatolik'); }
  }

  /** Create the logistics dept-job: a shipping request (ow_shipping_requests, order-keyed).
   *  Idempotent. order_id is the only required col (delivery_address/payment_verified/id have
   *  defaults); the logistics dept fills address/contact later. The delivery lifecycle + done
   *  signal live on the child ow_deliveries (see setShippingStatus). */
  async createShippingRequestJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_shipping_requests (order_id)
        SELECT ${orderId}
        WHERE NOT EXISTS (SELECT 1 FROM ow_shipping_requests WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Shipping request yaratishda xatolik'); }
  }

  /** Advance the logistics delivery lifecycle (DISPATCHED->IN_TRANSIT->DELIVERED/RETURNED).
   *  Operates on the order's single shipping request's child ow_deliveries row (upsert: the
   *  delivery is created on the first call). DELIVERED stamps arrived_at + marks the logistics
   *  dept 'done' — the real "customer received it" signal, not a marker. */
  async setShippingStatus(orderId: number, status: string): Promise<Result<Row | null>> {
    try {
      const reqR = await runQuery<Row>(sql`
        SELECT id FROM ow_shipping_requests WHERE order_id = ${orderId} ORDER BY id LIMIT 1
      `);
      const reqId = reqR.rows[0]?.['id'];
      if (!reqId) return Err('Shipping request topilmadi');

      const existing = await runQuery<Row>(sql`
        SELECT id FROM ow_deliveries WHERE shipping_request_id = ${reqId}::uuid ORDER BY id LIMIT 1
      `);
      const existingId = existing.rows[0]?.['id'];

      let row: Row | undefined;
      if (existingId) {
        const upd = await runQuery<Row>(sql`
          UPDATE ow_deliveries
             SET status = ${status},
                 dispatched_at = COALESCE(dispatched_at, NOW()),
                 arrived_at = CASE WHEN ${status} = 'DELIVERED' THEN NOW() ELSE arrived_at END
           WHERE id = ${existingId}::uuid
          RETURNING id, shipping_request_id, status, dispatched_at, arrived_at
        `);
        row = upd.rows[0];
      } else {
        const ins = await runQuery<Row>(sql`
          INSERT INTO ow_deliveries (shipping_request_id, status, dispatched_at, arrived_at)
          VALUES (${reqId}::uuid, ${status}, NOW(), CASE WHEN ${status} = 'DELIVERED' THEN NOW() ELSE NULL END)
          RETURNING id, shipping_request_id, status, dispatched_at, arrived_at
        `);
        row = ins.rows[0];
      }
      if (!row) return Err('Yetkazib berishni yangilashda xatolik');
      if (status === 'DELIVERED') await this.markStatus(orderId, 'logistics', 'done');
      return Ok(row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yetkazib berish statusini yangilashda xatolik'); }
  }

  /** Create the warehouse/rulon dept-job: an order material requirement (ow_material_requirements,
   *  order-keyed). Idempotent. material_id + qty_required are NOT NULL — seed with 'TBD' / 0
   *  (the warehouse dept sets the real roll + quantity, then reserves/issues); status defaults
   *  'NEEDED'. This is a real warehouse work-queue entry, not a marker. */
  async createMaterialRequirementJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_material_requirements (order_id, material_id, qty_required)
        SELECT ${orderId}, 'TBD', 0
        WHERE NOT EXISTS (SELECT 1 FROM ow_material_requirements WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Material requirement yaratishda xatolik'); }
  }

  /** Advance a material requirement's status (NEEDED->RESERVED->ISSUED->RETURNED). ISSUED is the
   *  done signal — the rolls/material were issued to production — and marks the warehouse dept 'done'. */
  async setMaterialStatus(orderId: number, reqId: string, status: string): Promise<Result<Row | null>> {
    try {
      const r = await runQuery<Row>(sql`
        UPDATE ow_material_requirements
           SET status = ${status}
         WHERE id = ${reqId}::uuid AND order_id = ${orderId}
        RETURNING id, material_id, qty_required, qty_reserved, qty_issued, lab_passed, status
      `);
      if (!r.rows[0]) return Err('Material requirement topilmadi');
      if (status === 'ISSUED') await this.markStatus(orderId, 'warehouse', 'done');
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Material statusini yangilashda xatolik'); }
  }

  /** Saga view: the order + its selected departments + the mold dept-track detail
   *  (ow_molds keyed to sd_sales_orders.id). Reuses the ow_molds table + progress pattern. */
  async getSaga(orderId: number): Promise<Result<Row>> {
    try {
      const ord = await runQuery<Row>(sql`
        SELECT id, order_number, status, advance_status, advance_paid, total_amount
        FROM sd_sales_orders WHERE id = ${orderId} AND deleted_at IS NULL LIMIT 1
      `);
      if (!ord.rows[0]) return Err(`Buyurtma #${orderId} topilmadi`);
      const depts = await runQuery<Row>(sql`
        SELECT department, mode, status FROM sd_order_departments WHERE order_id = ${orderId} ORDER BY department
      `);
      const molds = await runQuery<Row>(sql`
        SELECT id, vendor, status, order_sent_at, received_at FROM ow_molds WHERE order_id = ${orderId} ORDER BY id
      `);
      const moldRows = molds.rows;
      const moldDone = moldRows.filter((m) => m['status'] === 'RECEIVED').length;
      const moldPct  = moldRows.length ? Math.round((moldDone / moldRows.length) * 100) : 0;

      const tech = await runQuery<Row>(sql`
        SELECT id, status, version, approved_at FROM ow_tech_cards WHERE order_id = ${orderId} ORDER BY id
      `);
      const techRows = tech.rows;
      const techDone = techRows.filter((t) => t['status'] === 'CONFIRMED').length;
      const techPct  = techRows.length ? Math.round((techDone / techRows.length) * 100) : 0;

      const cliches = await runQuery<Row>(sql`
        SELECT id, cliche_type, vendor, status, arrived_at FROM ow_cliches WHERE order_id = ${orderId} ORDER BY id
      `);
      const clicheRows = cliches.rows;
      const clicheDone = clicheRows.filter((c) => c['arrived_at'] != null).length;
      const clichePct  = clicheRows.length ? Math.round((clicheDone / clicheRows.length) * 100) : 0;

      // Logistics: ow_shipping_requests (order-keyed) + child ow_deliveries (status lifecycle).
      // done = a request whose delivery reached DELIVERED.
      const shipReqs = await runQuery<Row>(sql`
        SELECT id, payment_verified, approved_by, requested_at FROM ow_shipping_requests WHERE order_id = ${orderId} ORDER BY id
      `);
      const shipReqRows = shipReqs.rows;
      const deliveries = await runQuery<Row>(sql`
        SELECT d.id, d.shipping_request_id, d.status, d.dispatched_at, d.arrived_at
        FROM ow_deliveries d JOIN ow_shipping_requests r ON r.id = d.shipping_request_id
        WHERE r.order_id = ${orderId} ORDER BY d.id
      `);
      const deliveryRows = deliveries.rows;
      const deliveredReqIds = new Set(deliveryRows.filter((d) => d['status'] === 'DELIVERED').map((d) => d['shipping_request_id']));
      const logiDone = shipReqRows.filter((r) => deliveredReqIds.has(r['id'])).length;
      const logiPct  = shipReqRows.length ? Math.round((logiDone / shipReqRows.length) * 100) : 0;

      // Warehouse/rulon: ow_material_requirements (order-keyed). done = status ISSUED.
      const matsResult = await runQuery<Row>(sql`
        SELECT id, material_id, qty_required, qty_reserved, qty_issued, lab_passed, status
        FROM ow_material_requirements WHERE order_id = ${orderId} ORDER BY id
      `);
      const matRows = matsResult.rows;
      const matDone = matRows.filter((m) => m['status'] === 'ISSUED').length;
      const matPct  = matRows.length ? Math.round((matDone / matRows.length) * 100) : 0;

      return Ok({
        order: ord.rows[0],
        departments: depts.rows,
        tracks: [
          { name: 'mold',      count: moldRows.length,    done: moldDone,   progressPct: moldPct,   rows: moldRows },
          { name: 'design',    count: techRows.length,    done: techDone,   progressPct: techPct,   rows: techRows },
          { name: 'cliche',    count: clicheRows.length,  done: clicheDone, progressPct: clichePct, rows: clicheRows },
          { name: 'logistics', count: shipReqRows.length, done: logiDone,   progressPct: logiPct,   rows: deliveryRows, requests: shipReqRows },
          { name: 'warehouse', count: matRows.length,     done: matDone,    progressPct: matPct,    rows: matRows },
        ],
      });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Saga ko\'rinishini o\'qishda xatolik'); }
  }

  /** Update a mold dept-job's detailed status (ORDERED->IN_TRANSIT->RECEIVED/REJECTED).
   *  When RECEIVED, stamp received_at and mark the mold department 'done'. */
  async setMoldStatus(orderId: number, moldId: string, status: string): Promise<Result<Row | null>> {
    try {
      const r = await runQuery<Row>(sql`
        UPDATE ow_molds
           SET status = ${status},
               received_at = CASE WHEN ${status} = 'RECEIVED' THEN NOW() ELSE received_at END
         WHERE id = ${moldId}::uuid AND order_id = ${orderId}
        RETURNING id, vendor, status, received_at
      `);
      if (!r.rows[0]) return Err('Mold topilmadi');
      if (status === 'RECEIVED') await this.markStatus(orderId, 'mold', 'done');
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mold statusini yangilashda xatolik'); }
  }

  async markStatus(orderId: number, department: string, status: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE sd_order_departments SET status = ${status}, updated_at = NOW()
        WHERE order_id = ${orderId} AND department = ${department}
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Status yangilashda xatolik'); }
  }
}
