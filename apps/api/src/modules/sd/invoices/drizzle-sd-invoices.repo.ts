/**
 * @module drizzle-sd-invoices.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, invoices as canonicalInvoices, sales_orders as legacySalesOrders } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  ISdInvoicesRepository,
  CreateInvoiceInput,
  InvoiceRow,
  OrderForInvoice,
  OrderFulfillmentQty,
  DrizzleExecutor,
} from './i-sd-invoices.repo';

/**
 * Narrow shape we need from a Drizzle executor (db or tx). Restricted to
 * just the surface used in this repo so we don't import `PgTransaction` types.
 */
type ExecLike = {
  select: typeof db.select;
  insert: typeof db.insert;
  execute: typeof db.execute;
};

const asExec = (tx?: DrizzleExecutor): ExecLike => (tx ?? db) as unknown as ExecLike;

@Injectable()
export class DrizzleSdInvoicesRepository implements ISdInvoicesRepository {
  async findOrderForInvoicing(
    orderId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<OrderForInvoice | null>> {
    try {
      const exec = asExec(tx);
      const rows = await exec
        .select({
          id: legacySalesOrders.id,
          status: legacySalesOrders.status,
        })
        .from(legacySalesOrders)
        .where(eq(legacySalesOrders.id, orderId))
        .limit(1);
      const row = (rows as Array<{ id: string; status: string }>)[0];
      if (!row) return Ok(null);
      // NOTE: `sales_orders` in `@shared/db/schema-core` has no soft-delete column;
      // the legacy handler probed `deleted_at` defensively. We preserve null here
      // so the handler's deletedAt branch stays a structural no-op.
      return Ok({ id: row.id, status: row.status, deletedAt: null });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Buyurtmani yuklab bo\'lmadi'));
    }
  }

  /**
   * VISION-3340 SD-06 #24 — feeds CreateInvoiceHandler's `invoices.invoice_type` stamp.
   * Raw SQL (Qoida 4): `sales_order_items` / `delivery_items` / `deliveries` are live
   * integer-keyed tables outside the Drizzle schema (same known id-type drift noted in
   * findOrderForInvoicing above) — the `::text` cast keeps the comparison safe.
   */
  async getOrderFulfillmentQty(
    salesOrderId: string,
    tx?: DrizzleExecutor,
  ): Promise<Result<OrderFulfillmentQty>> {
    try {
      const exec = asExec(tx);
      const result = await exec.execute(sql`
        SELECT
          COALESCE((
            SELECT SUM(soi.order_quantity) FROM sales_order_items soi
            WHERE soi.sales_order_id::text = ${salesOrderId}
          ), 0) AS ordered_qty,
          COALESCE((
            SELECT SUM(di.delivery_quantity) FROM delivery_items di
            JOIN deliveries d ON d.id = di.delivery_id
            WHERE d.sales_order_id::text = ${salesOrderId} AND d.deleted_at IS NULL
          ), 0) AS delivered_qty,
          EXISTS (
            SELECT 1 FROM delivery_items di
            JOIN deliveries d ON d.id = di.delivery_id
            WHERE d.sales_order_id::text = ${salesOrderId} AND d.deleted_at IS NULL
          ) AS has_delivery_data
      `);
      type FulfillmentRow = {
        ordered_qty: string | number;
        delivered_qty: string | number;
        has_delivery_data: boolean;
      };
      const rows = (result as unknown as { rows?: FulfillmentRow[] }).rows ?? [];
      const row = rows[0];
      return Ok({
        orderedQty: Number(row?.ordered_qty ?? 0),
        deliveredQty: Number(row?.delivered_qty ?? 0),
        hasDeliveryData: Boolean(row?.has_delivery_data),
      });
    } catch (e: unknown) {
      return Err(
        AppErr('DB_ERROR', (e as Error)?.message || "Buyurtma bajarilish miqdorini yuklab bo'lmadi"),
      );
    }
  }

  async withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    try {
      return await db.transaction(async (tx) => work(tx as DrizzleExecutor));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Tranzaksiya xatoligi'));
    }
  }

  async createInvoice(input: CreateInvoiceInput, tx?: DrizzleExecutor): Promise<Result<InvoiceRow>> {
    try {
      const exec = asExec(tx);
      await exec.insert(canonicalInvoices).values({
        invoice_number: input.invoiceNumber,
        sales_order_id: input.salesOrderId ?? undefined,
        customer_name: input.customerName,
        customer_id: input.customerId ?? undefined,
        items: input.itemsJson,
        subtotal: input.subtotal,
        tax_amount: input.taxAmount,
        total_amount: input.totalAmount,
        paid_amount: input.paidAmount,
        status: input.status as 'draft',
        due_date: input.dueDate ?? undefined,
        created_by: input.createdBy,
        created_at: input.createdAt,
        updated_at: input.updatedAt,
        delivery_term: input.deliveryTerm ?? undefined,
        incoterm_code: input.incotermCode ?? undefined,
        currency: input.currency ?? undefined,
        invoice_type: input.invoiceType ?? undefined,
      });
      return Ok({
        invoiceNumber: input.invoiceNumber,
        subtotal: input.subtotal,
        taxAmount: input.taxAmount,
        totalAmount: input.totalAmount,
        status: input.status,
      });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Faktura yaratilmadi'));
    }
  }
}
