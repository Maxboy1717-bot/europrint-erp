/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   Optimistic-lock UPDATE with COALESCE(version, 0) = ${expected} RETURNING
 *   id and new version, and the atomic advance-payment CTE chain
 *   (WITH existing_key AS ..., lock_update AS UPDATE ... RETURNING,
 *    idempotency_insert AS INSERT ... ON CONFLICT DO NOTHING RETURNING)
 *   that combines idempotency-key check, conditional UPDATE, and
 *   key-write into a single statement. Drizzle has no CTE-with-DML composition.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module drizzle-sales-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { runQuery, db } from '@shared/db';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { sql } from 'drizzle-orm';
import { execSdSalesOrderInsert, execSdSalesOrderUpdate, execSdSalesOrderDelete } from '@common/database/queries-sd';
import { Err } from '@common/result';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { CustomerId } from '@shared/domain/value-objects/customer-id.vo';
import { ISalesOrderRepository, DrizzleTxExecutor, SalesOrderLineInput, SalesOrderItemView } from '../../domain/repositories/i-sales-order.repo';
import { SoStatus } from '../../domain/value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSalesOrderRepository implements ISalesOrderRepository {
  async save(order: SalesOrder, tx?: DrizzleTxExecutor, crmLeadId?: number | null): Promise<Result<SalesOrder>> {
    try {
      // PA0-6: pass the optional Drizzle `tx` executor through to the helper
      // so the INSERT participates in the same transaction as the outbox write.
      const newId = await execSdSalesOrderInsert(
        order.getOrderNumber(), order.getStatus(), order.getCompanyId(),
        order.getTotalAmount(), (castTo<Row>(order))['createdBy'],
        tx,
        order.getCustomerId() ?? null, // #03 HOP-0: carry the customer link into sales_orders
        crmLeadId ?? null, // 2.6: carry the originating CRM lead link into sales_orders
        order.getDesignFlag(), order.getSampleFlag(), order.getCurrency(),
      );
      // Carry the DB-generated serial id back onto the aggregate so the command
      // handler (and the outbox entries it builds) reference the real order id
      // instead of the create()-time placeholder 0.
      order.assignPersistedId(newId);
      return { ok: true as const, data: order };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async saveItems(orderId: number, items: SalesOrderLineInput[], tx?: DrizzleTxExecutor): Promise<Result<number>> {
    try {
      if (!Array.isArray(items) || items.length === 0) return { ok: true as const, data: 0 };
      // Tx-aware: when called inside the create transaction, items + order header commit atomically.
      const exec = (tx ?? db) as { execute: (q: ReturnType<typeof sql>) => Promise<unknown> };
      let saved = 0;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemNumber = String((i + 1) * 10).padStart(6, '0'); // 000010, 000020, ...
        const qty = Number(it.orderQuantity);
        const price = Number(it.netPrice);
        const total = qty * price;
        // Raw SQL targets the LIVE columns (the drizzle salesOrderItems stub drifts material_id/sales_order_id
        // to varchar; live is integer). product_id binds to products (finished goods, owner 2026-06-05).
        // B13/Decision 3 (2026-07-06): default fallback was the free-text 'PC' -- now the
        // canonical unit_of_measures.code for "piece" ('dona').
        // Owner decision 2026-07-13 (chat) — "Mahsulot vs Buyurtma zanjiri": when it.productId is
        // absent, this is a bespoke print job (no catalog SKU) — product_id stays NULL and the
        // custom-spec columns (mirroring sd_quotation_items) carry the job description instead.
        // Same convention as approveQuotation()/convertQuotationToOrder()'s item-copy INSERTs.
        await exec.execute(sql`
          INSERT INTO sales_order_items
            (sales_order_id, item_number, product_id, description, order_quantity, open_quantity, unit,
             net_price, total_price, product_type, paper_type, thickness_mm, length_mm, width_mm, height_mm,
             print_colors, lamination, perforation, special_coating, is_new_die, printing_method,
             machine_format, created_at)
          VALUES
            (${orderId}, ${itemNumber}, ${it.productId ?? null}, ${it.description}, ${qty}, ${qty}, ${it.unit ?? 'dona'},
             ${price}, ${total}, ${it.productType ?? null}, ${it.paperType ?? null}, ${it.thicknessMm ?? null},
             ${it.lengthMm ?? null}, ${it.widthMm ?? null}, ${it.heightMm ?? null}, ${it.printColors ?? null},
             ${it.lamination ?? null}, ${it.perforation ?? null}, ${it.specialCoating ?? null}, ${it.isNewDie ?? null},
             ${it.printingMethod ?? null}, ${it.machineFormat ?? null}, NOW())`);
        saved++;
      }
      return { ok: true as const, data: saved };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findItemsByOrderId(orderId: number): Promise<Result<SalesOrderItemView[]>> {
    try {
      // Read the order's persisted lines. product_id is the canonical finished-good
      // binding the create flow writes (FK → products); material_id is a legacy/unused
      // column (drizzle-sd-atp.repo) — surfaced too so a clone of an older row is not lost.
      const r = await runQuery<Row>(sql`
        SELECT id, item_number, product_id, material_id, material_number,
               description, order_quantity, unit, net_price, total_price
          FROM sales_order_items
         WHERE sales_order_id = ${orderId}
         ORDER BY item_number ASC`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      const items: SalesOrderItemView[] = rows.map((row) => ({
        id: Number(row.id ?? 0),
        itemNumber: String(row.item_number ?? ''),
        productId: row.product_id != null ? Number(row.product_id) : null,
        materialId: row.material_id != null ? Number(row.material_id) : null,
        materialNumber: row.material_number != null ? String(row.material_number) : null,
        description: String(row.description ?? ''),
        orderQuantity: Number(row.order_quantity ?? 0),
        unit: String(row.unit ?? ''),
        netPrice: Number(row.net_price ?? 0),
        totalPrice: Number(row.total_price ?? 0),
      }));
      return { ok: true as const, data: items };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findById(id: number): Promise<Result<SalesOrder | null>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`);
      if (!r.rows[0]) return { ok: true as const, data: null };
      return { ok: true as const, data: this.toDomain(r.rows[0] as Row) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByOrderNumber(orderNumber: string): Promise<Result<SalesOrder | null>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE order_number = ${orderNumber} AND deleted_at IS NULL LIMIT 1`);
      if (!r.rows[0]) return { ok: true as const, data: null };
      return { ok: true as const, data: this.toDomain(r.rows[0] as Row) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE company_id = ${companyId} AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE status = ${status} AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findAll(limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findPendingAdvanceOrders(limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE advance_status IN ('pending', 'partial') AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async update(order: SalesOrder, tx?: DrizzleTxExecutor): Promise<Result<void>> {
    try {
      // tx (when present) keeps the status write atomic with the sibling outbox
      // insert so the golden-thread OrderStatusChanged event can never be lost.
      await execSdSalesOrderUpdate(order.getStatus(), order.getAdvanceStatus(), order.getId(), tx);
      return { ok: true as const, data: undefined };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async updateAdvancePaidWithLock(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
  ): Promise<Result<{ updated: boolean; newVersion: number }>> {
    try {
      const result = await runQuery<{ id: number; new_version: number }>(sql`
        UPDATE sd_sales_orders
           SET advance_paid   = ${newAdvancePaid},
               advance_status = ${newAdvanceStatus},
               version        = COALESCE(version, 0) + 1,
               updated_at     = NOW()
         WHERE id      = ${id}
           AND COALESCE(version, 0) = ${expectedVersion}
        RETURNING id, COALESCE(version, 1) AS new_version
      `);
      if (!result.rows?.length) {
        return Err({ code: 'CONFLICT', message: 'Optimistic lock conflict: version mismatch' });
      }
      return { ok: true as const, data: { updated: true, newVersion: Number(result.rows[0]?.new_version ?? expectedVersion + 1) } };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  async updateAdvancePaidAtomic(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
    idempotencyKey: string,
  ): Promise<Result<{ updated: boolean; newVersion: number; duplicate: boolean }>> {
    try {
      const result = await runQuery<{ duplicate_count: number; lock_count: number; new_version: number | null }>(sql`
        WITH existing_key AS (
          SELECT id FROM sd_advance_idempotency_keys
           WHERE order_id = ${id} AND idempotency_key = ${idempotencyKey}
           LIMIT 1
        ),
        lock_update AS (
          UPDATE sd_sales_orders
             SET advance_paid   = ${newAdvancePaid},
                 advance_status = ${newAdvanceStatus},
                 version        = COALESCE(version, 0) + 1,
                 updated_at     = NOW()
           WHERE sd_sales_orders.id = ${id}
             AND COALESCE(version, 0) = ${expectedVersion}
             AND NOT EXISTS (SELECT 1 FROM existing_key)
          RETURNING id, COALESCE(version, 1) AS new_version
        ),
        idempotency_insert AS (
          INSERT INTO sd_advance_idempotency_keys (order_id, idempotency_key, advance_paid)
          SELECT ${id}, ${idempotencyKey}, ${newAdvancePaid}
           WHERE EXISTS (SELECT 1 FROM lock_update)
          ON CONFLICT (order_id, idempotency_key) DO NOTHING
          RETURNING id
        )
        SELECT
          (SELECT COUNT(*)::int FROM existing_key) AS duplicate_count,
          (SELECT COUNT(*)::int FROM lock_update)  AS lock_count,
          (SELECT new_version FROM lock_update LIMIT 1) AS new_version
      `);
      const row           = result.rows?.[0];
      const duplicateCount = Number(row?.duplicate_count ?? 0);
      const lockCount      = Number(row?.lock_count ?? 0);
      const newVersion     = row?.new_version != null ? Number(row.new_version) : null;

      if (duplicateCount > 0) {
        return { ok: true as const, data: { updated: false, newVersion: -1, duplicate: true } };
      }
      if (lockCount === 0 || newVersion === null) {
        return Err({ code: 'CONFLICT', message: 'Optimistic lock conflict: version mismatch' });
      }
      return { ok: true as const, data: { updated: true, newVersion, duplicate: false } };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  async markPendingMaterial(orderId: number, reason: string | null, tx?: DrizzleTxExecutor): Promise<Result<{ signaledAt: string }>> {
    try {
      // 06-sd #100 — write the "Ожд.Сырьё" signal on the canonical BASE table
      // sales_orders (sd_sales_orders is a read VIEW that does not carry these
      // columns). Raw SQL (no Drizzle table object) keeps this off the stale-dist
      // rebuild path. tx (when present) makes the flip atomic with the outbox row.
      const conn = (tx ?? db) as { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Row[] }> };
      const r = await conn.execute(sql`
        UPDATE sales_orders
           SET status                  = 'pending_material',
               pending_material_since  = NOW(),
               pending_material_reason = ${reason},
               updated_at              = NOW()
         WHERE id = ${orderId} AND deleted_at IS NULL
        RETURNING pending_material_since`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      if (rows.length === 0) return Err({ code: 'NOT_FOUND', message: 'Buyurtma topilmadi' });
      return { ok: true as const, data: { signaledAt: String((rows[0] as Row).pending_material_since) } };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async delete(id: number): Promise<Result<void>> {
    try {
      await execSdSalesOrderDelete(id);
      return { ok: true as const, data: undefined };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async count(): Promise<Result<number>> {
    try {
      const r = await runQuery<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM sd_sales_orders`);
      return { ok: true as const, data: Number(r.rows[0]?.count ?? 0) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  private toDomain(row: Row): SalesOrder {
    const statusResult = SoStatus.create(String(row.status ?? 'draft'));
    const moneyResult = Money.of(Number(row.total_amount ?? 0), String(row.currency ?? 'UZS'));
    // Hydrate the (optional) CustomerId via the VO's trusted-source escape
    // hatch — DB FK is already validated by the schema, so we skip re-running
    // the create() guard.
    const rawCustomerId = row.customer_id !== undefined && row.customer_id !== null
      ? Number(row.customer_id)
      : undefined;
    const customerId = rawCustomerId && rawCustomerId > 0
      ? CustomerId.fromRaw(rawCustomerId)
      : undefined;
    return new SalesOrder({
      id: Number(row.id ?? 0), orderNumber: String(row.order_number ?? ''),
      status: statusResult.data as SoStatus, companyId: Number(row.company_id ?? 0),
      customerId,
      totalAmount: moneyResult,
      advanceRequired: Number(row.advance_required ?? 0), advancePaid: Number(row.advance_paid ?? 0),
      advanceStatus: String(row.advance_status ?? 'pending') as 'pending' | 'approved' | 'partial' | 'bypassed',
      advanceBypassBy: Number(row.advance_bypass_by ?? 0),
      advanceBypassReason: String(row.advance_bypass_reason ?? ''),
      designFlag: Boolean(row.design_flag), sampleFlag: Boolean(row.sample_flag),
      techBomApproved: Boolean(row.tech_bom_approved),
      techRoutingApproved: Boolean(row.tech_routing_approved),
      techCardApproved: Boolean(row.tech_card_approved),
      createdBy: Number(row.created_by ?? 0),
      createdAt: row.created_at ? new Date(String(row.created_at)) : _time.now(),
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : _time.now(),
      version: Number(row.version ?? 0),
    });
  }
}
