/**
 * @module drizzle-sd-invoices.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, invoices as legacyInvoices, sales_orders as legacySalesOrders } from '@shared/db';
import { salesInvoices } from '@europrint/schemas';
import { eq, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  ISdInvoicesRepository,
  CreateInvoiceInput,
  InvoiceRow,
  OrderForInvoice,
  DrizzleExecutor,
} from './i-sd-invoices.repo';

type Row = Record<string, unknown>;

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
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(salesInvoices).where(isNull(salesInvoices.deletedAt)).limit(1).offset(0),
        db.select().from(salesInvoices).where(isNull(salesInvoices.deletedAt)).orderBy(desc(salesInvoices.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisob-fakturalar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Hisob-faktura #${id} topilmadi`); }
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(salesInvoices).where(eq(salesInvoices.invoiceNumber, invoiceNumber)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisob-faktura topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(salesInvoices).values({ ...dto, status: 'draft', ...(createdBy ? { createdBy } : {} as typeof salesInvoices.$inferInsert) } as typeof salesInvoices.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

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
      await exec.insert(legacyInvoices).values({
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
