/**
 * @module finance-ap.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { and, eq, ne, lt, sql } from 'drizzle-orm';
import { ap_aging_buckets, finance_invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { IFinanceApRepo, ApBucket, CreateApEntryDto } from '../../domain/repositories/i-finance-ap.repo';

// OWNER QARORI 2026-07-02 (Moliya-GL-Kassa): finance_invoices = kanonik invoice-manba.
// purchase_invoices o'rniga finance_invoices (invoice_type='purchase') ishlatiladi —
// purchase_invoices'ning yagona yozuvchisi shu fayl edi (boshqa consumer yo'q edi, 0 satr).

type Row = Record<string, unknown>;

export type { ApBucket };

@Injectable()
export class FinanceApRepository implements IFinanceApRepo {
  async getApAgingBuckets(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(ap_aging_buckets)
        .orderBy(sql`${ap_aging_buckets.total_outstanding} DESC`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getApAgingTotals(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        current:           sql<number>`COALESCE(SUM(${ap_aging_buckets.current_amount}),0)`,
        days31to60:        sql<number>`COALESCE(SUM(${ap_aging_buckets.days_31_60}),0)`,
        days61to90:        sql<number>`COALESCE(SUM(${ap_aging_buckets.days_61_90}),0)`,
        days91to120:       sql<number>`COALESCE(SUM(${ap_aging_buckets.days_91_120}),0)`,
        over120:           sql<number>`COALESCE(SUM(${ap_aging_buckets.over_120}),0)`,
        total_outstanding: sql<number>`COALESCE(SUM(${ap_aging_buckets.total_outstanding}),0)`,
      }).from(ap_aging_buckets);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getOverduePurchaseInvoices(today: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(finance_invoices)
        .where(and(
          eq(finance_invoices.invoice_type, 'purchase'),
          ne(finance_invoices.payment_status, 'paid'),
          lt(finance_invoices.due_date, today),
        ))
        .orderBy(finance_invoices.due_date).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getUnpaidPurchaseInvoices(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:            finance_invoices.id,
        due_date:      finance_invoices.due_date,
        total_amount:  finance_invoices.total_amount,
        paid_amount:   finance_invoices.paid_amount,
        supplier_name: finance_invoices.supplier_name,
      }).from(finance_invoices)
        .where(and(
          eq(finance_invoices.invoice_type, 'purchase'),
          ne(finance_invoices.payment_status, 'paid'),
        )).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async clearApAgingBuckets(): Promise<void> {
    await db.delete(ap_aging_buckets);
  }

  async insertApAgingBucket(b: ApBucket): Promise<void> {
    await db.insert(ap_aging_buckets).values({
      vendor_id:         b.vendor_id ?? undefined,
      current_amount:    String(b.current),
      days_31_60:        String(b.days_31_60),
      days_61_90:        String(b.days_61_90),
      days_91_120:       String(b.days_91_120),
      over_120:          String(b.over_120),
      total_outstanding: String(b.total_outstanding),
    });
  }

  async replaceApAgingBuckets(rows: ApBucket[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(ap_aging_buckets);
      if (rows.length > 0) {
        await tx.insert(ap_aging_buckets).values(
          rows.map(b => ({
            vendor_id:         b.vendor_id ?? undefined,
            current_amount:    String(b.current),
            days_31_60:        String(b.days_31_60),
            days_61_90:        String(b.days_61_90),
            days_91_120:       String(b.days_91_120),
            over_120:          String(b.over_120),
            total_outstanding: String(b.total_outstanding),
          })),
        );
      }
    });
  }

  async createApEntry(dto: CreateApEntryDto): Promise<Result<Row>> {
    return safeCall(async () => {
      const invoiceNo = `AP-${Date.now()}`;
      const rows = await db.insert(finance_invoices).values({
        invoice_number: invoiceNo,
        invoice_type:   'purchase',
        vendor_id:      dto.vendorId != null ? Number(dto.vendorId) : null,
        total_amount:   String(dto.amount),
        paid_amount:    '0',
        due_date:       dto.dueDate ?? null,
        payment_status: 'unpaid',
        notes:          dto.description ?? null,
      } as typeof finance_invoices.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }
}
