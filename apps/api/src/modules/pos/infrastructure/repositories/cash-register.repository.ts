/**
 * @module cash-register.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { eq, ilike, desc, sql, and, gte, lt } from 'drizzle-orm';
import { db } from '@shared/db';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { retail_pos_products, retail_pos_transactions } from '@shared/db/schema-pos-retail';
import { safeCall, Result, Ok, Err } from '@common/result';
import { createId } from '@paralleldrive/cuid2';
import type { ICashRegisterRepository } from '../../domain/repositories/i-cash-register.repo';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
export type RetailProduct = typeof retail_pos_products.$inferSelect;
export type RetailTransaction = typeof retail_pos_transactions.$inferSelect;

export interface CreateProductInput {
  barcode: string;
  name: string;
  nameRu?: string;
  category?: string;
  unitPrice: number;
  unit?: string;
  stockQuantity?: number;
  minStock?: number;
  imageUrl?: string;
  createdBy?: string;
}

export interface CreateTransactionInput {
  cashierId?: string;
  customerName?: string;
  customerId?: string;
  items: { productId: string; name: string; quantity: number; unitPrice?: number; total?: number }[];
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentDetails?: Record<string, unknown>;
  notes?: string;
}

@Injectable()
export class CashRegisterRepository implements ICashRegisterRepository {
  async findProducts(search?: string): Promise<Result<RetailProduct[]>> {
    try {
    return safeCall(() => {
      const where = search
        ? and(
            eq(retail_pos_products.is_active, true),
            ilike(retail_pos_products.name, `%${search}%`),
          )
        : eq(retail_pos_products.is_active, true);
      return db.select().from(retail_pos_products).where(where).orderBy(retail_pos_products.name);
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async findProductById(id: string): Promise<Result<RetailProduct | null>> {
    try {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(retail_pos_products)
        .where(eq(retail_pos_products.id, id))
        .limit(1);
      return rows[0] ?? null;
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async findProductByBarcode(barcode: string): Promise<Result<RetailProduct | null>> {
    try {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(retail_pos_products)
        .where(and(eq(retail_pos_products.barcode, barcode), eq(retail_pos_products.is_active, true)))
        .limit(1);
      return rows[0] ?? null;
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async insertProduct(data: CreateProductInput): Promise<Result<RetailProduct>> {
    try {
    return safeCall(async () => {
      const rows = await db.insert(retail_pos_products).values({
        barcode:       data.barcode,
        name:          data.name,
        name_ru:       data.nameRu ?? null,
        category:      data.category ?? null,
        unit_price:    String(data.unitPrice),
        unit:          data.unit ?? 'dona',
        stock_quantity: String(data.stockQuantity ?? 0),
        min_stock:     String(data.minStock ?? 0),
        image_url:     data.imageUrl ?? null,
        created_by:    data.createdBy ?? null,
      }).returning();
      return rows[0];
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async findTransactions(): Promise<Result<RetailTransaction[]>> {
    try {
    return safeCall(() =>
      db.select().from(retail_pos_transactions).orderBy(desc(retail_pos_transactions.created_at)).limit(MAX_QUERY_LIMIT),
    );
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async findTransactionById(id: string): Promise<Result<RetailTransaction | null>> {
    try {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(retail_pos_transactions)
        .where(eq(retail_pos_transactions.id, id))
        .limit(1);
      return rows[0] ?? null;
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async insertTransaction(data: CreateTransactionInput, cashierId?: string): Promise<Result<RetailTransaction>> {
    try {
    return safeCall(async () => {
      const now = _time.now();
      const txNum = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${createId().slice(0, 6).toUpperCase()}`;
      const receiptNum = `REC-${txNum.slice(4)}`;
      const rows = await db.insert(retail_pos_transactions).values({
        transaction_number: txNum,
        receipt_number:     receiptNum,
        cashier_id:         cashierId ?? data.cashierId ?? null,
        customer_name:      data.customerName ?? null,
        customer_id:        data.customerId ?? null,
        items:              data.items,
        subtotal:           String(data.subtotal),
        discount_amount:    String(data.discountAmount ?? 0),
        tax_rate:           String(data.taxRate ?? 12),
        tax_amount:         String(data.taxAmount ?? 0),
        total_amount:       String(data.totalAmount),
        payment_method:     data.paymentMethod,
        payment_details:    data.paymentDetails ?? {},
        notes:              data.notes ?? null,
        status:             'completed',
      }).returning();
      return rows[0];
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async refundTransaction(id: string, refundedBy?: string): Promise<Result<RetailTransaction>> {
    try {
    return safeCall(async () => {
      const rows = await db
        .update(retail_pos_transactions)
        .set({ status: 'refunded', refunded_at: _time.now(), refunded_by: refundedBy ?? null })
        .where(eq(retail_pos_transactions.id, id))
        .returning();
      return rows[0];
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async getDashboard(): Promise<Result<{
    salesToday: number;
    transactionsToday: number;
    avgBasket: number;
    totalSalesAll: number;
    totalTransactionsAll: number;
    paymentBreakdown: { method: string; total: number; count: number }[];
    topProducts: { name: string; barcode: string; totalSold: number; totalRevenue: number }[];
    lowStockCount: number;
  }>> {
    try {
    return safeCall(async () => {
      const todayStart = _time.now();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const [todayRows, allRows, lowStockRows] = await Promise.all([
        db.select({
          total:        sql<number>`COALESCE(SUM(total_amount::numeric), 0)`,
          count:        sql<number>`COUNT(*)`,
        }).from(retail_pos_transactions).where(
          and(
            gte(retail_pos_transactions.created_at, todayStart),
            lt(retail_pos_transactions.created_at, tomorrowStart),
            eq(retail_pos_transactions.status, 'completed'),
          ),
        ),
        db.select({
          total: sql<number>`COALESCE(SUM(total_amount::numeric), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(retail_pos_transactions).where(eq(retail_pos_transactions.status, 'completed')),
        db.select({ count: sql<number>`COUNT(*)` })
          .from(retail_pos_products)
          .where(
            and(
              eq(retail_pos_products.is_active, true),
              sql`stock_quantity::numeric < min_stock::numeric`,
            ),
          ),
      ]);

      const salesToday = Number(todayRows[0]?.total ?? 0);
      const transactionsToday = Number(todayRows[0]?.count ?? 0);
      const totalSalesAll = Number(allRows[0]?.total ?? 0);
      const totalTransactionsAll = Number(allRows[0]?.count ?? 0);
      const avgBasket = totalTransactionsAll > 0 ? totalSalesAll / totalTransactionsAll : 0;
      const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

      return {
        salesToday, transactionsToday, avgBasket, totalSalesAll, totalTransactionsAll,
        paymentBreakdown: [], topProducts: [], lowStockCount,
      };
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  /** Kunlik sotuvlar aggregati (retail_pos_transactions) — GET /pos/sales/daily uchun. */
  async findDailySales(date?: string): Promise<Result<{ date: string; transactionCount: number; totalAmount: number; byPaymentMethod: { method: string; count: number; total: number }[] }>> {
    try {
      return safeCall(async () => {
        const dayStart = date ? new Date(`${date}T00:00:00`) : (() => { const d = _time.now(); d.setHours(0, 0, 0, 0); return d; })();
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const where = and(
          gte(retail_pos_transactions.created_at, dayStart),
          lt(retail_pos_transactions.created_at, dayEnd),
          eq(retail_pos_transactions.status, 'completed'),
        );
        const [totals] = await db.select({
          total: sql<number>`COALESCE(SUM(total_amount::numeric), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(retail_pos_transactions).where(where);
        const byMethod = await db.select({
          method: retail_pos_transactions.payment_method,
          total: sql<number>`COALESCE(SUM(total_amount::numeric), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(retail_pos_transactions).where(where).groupBy(retail_pos_transactions.payment_method);
        const isoDate = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
        return {
          date: isoDate,
          transactionCount: Number(totals?.count ?? 0),
          totalAmount: Number(totals?.total ?? 0),
          byPaymentMethod: (Array.isArray(byMethod) ? byMethod : []).map((m) => ({ method: String(m.method ?? 'unknown'), count: Number(m.count), total: Number(m.total) })),
        };
      });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  /** POS-1: Sotuv va stock kamaytirish — bitta DB transaction ichida (atomik) */
  async insertTransactionAtomic(
    data: CreateTransactionInput,
    items: { productId: string; quantity: number }[],
    cashierId?: string,
  ): Promise<Result<RetailTransaction>> {
    try {
      return safeCall(async () => {
        return db.transaction(async (tx) => {
          const now = _time.now();
          const txNum = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${createId().slice(0, 6).toUpperCase()}`;
          const receiptNum = `REC-${txNum.slice(4)}`;
          const rows = await tx.insert(retail_pos_transactions).values({
            transaction_number: txNum,
            receipt_number:     receiptNum,
            cashier_id:         cashierId ?? data.cashierId ?? null,
            customer_name:      data.customerName ?? null,
            customer_id:        data.customerId ?? null,
            items:              data.items,
            subtotal:           String(data.subtotal),
            discount_amount:    String(data.discountAmount ?? 0),
            tax_rate:           String(data.taxRate ?? 12),
            tax_amount:         String(data.taxAmount ?? 0),
            total_amount:       String(data.totalAmount),
            payment_method:     data.paymentMethod,
            payment_details:    data.paymentDetails ?? {},
            notes:              data.notes ?? null,
            status:             'completed',
          }).returning();
          for (const item of items) {
            await tx.update(retail_pos_products)
              .set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${item.quantity})` })
              .where(eq(retail_pos_products.id, item.productId));
          }
          return rows[0];
        });
      });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async decrementStock(productId: string, quantity: number): Promise<Result<void>> {
    try {
    return safeCall(async () => {
      await db.update(retail_pos_products)
        .set({ stock_quantity: sql`GREATEST(0, stock_quantity::numeric - ${quantity})` })
        .where(eq(retail_pos_products.id, productId));
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async incrementStock(items: { productId: string; quantity: number }[]): Promise<Result<void>> {
    try {
    return safeCall(async () => {
      for (const item of items) {
        await db.update(retail_pos_products)
          .set({ stock_quantity: sql`stock_quantity::numeric + ${item.quantity}` })
          .where(eq(retail_pos_products.id, item.productId));
      }
    });
      } catch (_e) {
      return Err(String(_e));
    }
  }
}
