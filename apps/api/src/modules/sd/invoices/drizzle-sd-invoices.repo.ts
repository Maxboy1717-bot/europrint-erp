/**
 * @module drizzle-sd-invoices.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, invoices as canonicalInvoices, sales_orders as legacySalesOrders } from '@shared/db';
import { eq } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  ISdInvoicesRepository,
  CreateInvoiceInput,
  InvoiceRow,
  OrderForInvoice,
  DrizzleExecutor,
} from './i-sd-invoices.repo';

/**
 * Narrow shape we need from a Drizzle executor (db or tx). Restricted to
 * just the surface used in this repo so we don't import `PgTransaction` types.
 */
type ExecLike = {
  select: typeof db.select;
  insert: typeof db.insert;
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
