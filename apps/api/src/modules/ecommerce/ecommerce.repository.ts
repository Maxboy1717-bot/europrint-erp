/**
 * @module ecommerce.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db } from '../../infrastructure/database/database';
import {
  customerOrders, customerAccounts, publicProducts, documentSequences, sdLeads, insertCustomerOrderSchema,
} from '@europrint/schemas';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

@Injectable()
export class EcommerceRepository {
  constructor(private readonly i18n: I18nService) {}

  async listCustomers(whereClause: ReturnType<typeof and> | undefined, limit: number, offset: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [customers, totalResult] = await Promise.all([
        db.select().from(customerAccounts).where(whereClause).orderBy(desc(customerAccounts.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(customerAccounts).where(whereClause),
      ]);
      return { customers, total: totalResult[0]?.count || 0 };
      }, 'DB_ERROR');
  }

  buildCustomerWhereClause(search?: string, verified?: string) {
    const conditions = [];
    if (search) conditions.push(sql`(${customerAccounts.fullName} ILIKE ${`%${search}%`} OR ${customerAccounts.phone} ILIKE ${`%${search}%`} OR ${customerAccounts.email} ILIKE ${`%${search}%`} OR ${customerAccounts.companyName} ILIKE ${`%${search}%`})`);
    if (verified !== undefined && verified !== '') conditions.push(eq(customerAccounts.isVerified, verified === 'true'));
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async getCustomer(id: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [customer] = await db.select().from(customerAccounts).where(eq(customerAccounts.id, id)).limit(1);
      if (!customer) throw new NotFoundException(await this.i18n.t('errors.customerNotFound'));
      return customer;
      }, 'DB_ERROR');
  }

  async getCustomerOrders(customerId: string) : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      return await db.select().from(customerOrders).where(eq(customerOrders.customerId, customerId)).orderBy(desc(customerOrders.createdAt)).limit(10);
      }, 'DB_ERROR');
  }

  async getCustomerOrderStats(customerId: string) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [stats] = await db.select({ totalOrders: count(), totalSpent: sql<number>`COALESCE(SUM(${customerOrders.total}), 0)` }).from(customerOrders).where(eq(customerOrders.customerId, customerId));
      return stats;
      }, 'DB_ERROR');
  }

  async updateCustomer(id: number, updateData: Record<string, unknown>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(customerAccounts).set(updateData as Partial<typeof customerAccounts.$inferInsert>).where(eq(customerAccounts.id, id)).returning();
      if (!updated) throw new NotFoundException(await this.i18n.t('errors.customerNotFound'));
      return updated;
      }, 'DB_ERROR');
  }

  async getStats() : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [productStats] = await db.select({
        total: count(),
        inStock: sql<number>`COUNT(*) FILTER (WHERE ${publicProducts.inStock} = true)`,
        featured: sql<number>`COUNT(*) FILTER (WHERE ${publicProducts.isFeatured} = true)`,
      }).from(publicProducts);
      const [orderStats] = await db.select({
        total: count(),
        newOrders: sql<number>`COUNT(*) FILTER (WHERE ${customerOrders.status} = 'new')`,
        inProduction: sql<number>`COUNT(*) FILTER (WHERE ${customerOrders.status} = 'in_production')`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${customerOrders.status} = 'delivered')`,
        totalRevenue: sql<number>`COALESCE(SUM(${customerOrders.total}) FILTER (WHERE ${customerOrders.paymentStatus} = 'paid'), 0)`,
      }).from(customerOrders);
      const [customerStats] = await db.select({
        total: count(),
        verified: sql<number>`COUNT(*) FILTER (WHERE ${customerAccounts.isVerified} = true)`,
      }).from(customerAccounts);
      return { products: productStats, orders: orderStats, customers: customerStats };
      }, 'DB_ERROR');
  }

  buildOrderWhereClause(status?: string, paymentStatus?: string, customerId?: string, search?: string) {
    const conditions = [];
    if (status) conditions.push(eq(customerOrders.status, status));
    if (paymentStatus) conditions.push(eq(customerOrders.paymentStatus, paymentStatus));
    if (customerId) conditions.push(eq(customerOrders.customerId, customerId));
    if (search) conditions.push(sql`(${customerOrders.orderNumber} ILIKE ${`%${search}%`} OR ${customerOrders.guestName} ILIKE ${`%${search}%`} OR ${customerOrders.guestPhone} ILIKE ${`%${search}%`})`);
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async listOrders(whereClause: ReturnType<typeof and> | undefined, limit: number, offset: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [orders, totalResult] = await Promise.all([
        db.select({ order: customerOrders, customer: customerAccounts })
          .from(customerOrders)
          .leftJoin(customerAccounts, eq(customerOrders.customerId as never, customerAccounts.id as never))
          .where(whereClause)
          .orderBy(desc(customerOrders.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(customerOrders).where(whereClause),
      ]);
      return { orders: (Array.isArray(orders) ? orders : []).map((o) => ({ ...o.order, customer: o.customer })), total: totalResult[0]?.count || 0 };
      }, 'DB_ERROR');
  }

  async getOrder(id: number) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [result] = await db.select({ order: customerOrders, customer: customerAccounts })
        .from(customerOrders)
        .leftJoin(customerAccounts, eq(customerOrders.customerId, customerAccounts.id))
        .where(eq(customerOrders.id, id))
        .limit(1);
      if (!result) throw new NotFoundException(await this.i18n.t('errors.orderNotFound'));
      return { ...result.order, customer: result.customer };
      }, 'DB_ERROR');
  }

  async updateOrderStatus(id: number, updateData: Record<string, unknown>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(customerOrders).set(updateData as Partial<typeof customerOrders.$inferInsert>).where(eq(customerOrders.id, id)).returning();
      if (!updated) throw new NotFoundException(await this.i18n.t('errors.orderNotFound'));
      return updated;
      }, 'DB_ERROR');
  }

  async updateOrder(id: number, body: Record<string, unknown>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const validatedData = insertCustomerOrderSchema.partial().parse(body);
      const [updated] = await db.update(customerOrders).set({ ...validatedData, updatedAt: _time.now() } as Partial<typeof customerOrders.$inferInsert>).where(eq(customerOrders.id, id)).returning();
      if (!updated) throw new NotFoundException(await this.i18n.t('errors.orderNotFound'));
      return updated;
      }, 'DB_ERROR');
  }

  async insertOrder(values: Record<string, unknown>) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const insertResult = await db.insert(customerOrders).values(values as never).returning();
      return (Array.isArray(insertResult) ? insertResult : [])[0];
      }, 'DB_ERROR');
  }

  async insertLeadAsync(firstName: string, lastName: string, phone: string, loggerRef: { error: (msg: string, ctx: unknown) => void }) : Promise<Result<void>>{
    return safeCall(async () => {
      // sd_leads canonical schema has `full_name` (text), `phone`, `status` — no separate first/last name columns.
      db.insert(sdLeads).values({
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
        status: 'new',
      }).catch((e: Error) => loggerRef.error('CRM lead creation failed', { error: (e as Error).message }));
      }, 'DB_ERROR');
  }

  async generateSequenceNumber(prefix: string): Promise<Result<string>> {
    return safeCall(async () => {
      const now = _time.now();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const yearMonth = `${year}${month.toString().padStart(2, '0')}`;
      const lastNumber = await db.transaction(async (tx) => {
        const [updated] = await tx.update(documentSequences)
          .set({ lastNumber: sql`${documentSequences.lastNumber} + 1`, updatedAt: _time.now() })
          .where(and(eq(documentSequences.prefix, prefix), eq(documentSequences.year, year), eq(documentSequences.month, month)))
          .returning({ lastNumber: documentSequences.lastNumber });
        if (updated) return updated.lastNumber;
        const [inserted] = await tx.insert(documentSequences)
          .values({ prefix, year, month, lastNumber: 1 } as typeof documentSequences.$inferInsert)
          .onConflictDoUpdate({
            target: [documentSequences.prefix, documentSequences.year, documentSequences.month],
            set: { lastNumber: sql`${documentSequences.lastNumber} + 1`, updatedAt: _time.now() },
          })
          .returning({ lastNumber: documentSequences.lastNumber });
        return inserted?.lastNumber ?? 1;
      });
      return `${prefix}-${yearMonth}-${String(lastNumber).padStart(4, '0')}`;
      }, 'DB_ERROR');
  }
}
