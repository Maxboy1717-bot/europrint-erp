import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, sql, and } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { safeCall } from '@common/types/result.type';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';
import { OrderStatusVo } from '../../domain/value-objects/order-status.vo';
import { IOrderRepo } from './i-order.repo';
import { owOrders } from '@shared/db';

type DbRow = typeof owOrders.$inferSelect;

const DRAFT_STATUS = 'DRAFT';

@Injectable()
export class DrizzleOrderRepo implements IOrderRepo {
  private readonly logger = new Logger(DrizzleOrderRepo.name);

  async save(order: OrderAggregate): Promise<Result<OrderAggregate>> {
    return safeCall(async () => {
      await db.insert(owOrders).values({
        id:           order.getId(),
        orderNumber:  order.getOrderNumber(),
        customerId:   order.getCustomerId(),
        customerTier: order.getCustomerTier(),
        status:       order.getStatus(),
        stateVersion: order.getStateVersion(),
        totalAmount:  String(order.getTotalAmount()),
        currency:     order.getCurrency(),
        assignedSalesManager: order.getSalesManager(),
        tenantId:     order.getTenantId() ?? undefined,
      }).onConflictDoUpdate({
        target: owOrders.id,
        set: {
          status:       order.getStatus(),
          stateVersion: order.getStateVersion(),
          totalAmount:  String(order.getTotalAmount()),
          updatedAt:    sql`now()`,
        },
      });
      return order;
    }, 'DB_ERROR');
  }

  async findById(id: string, actorTenantId?: string | null): Promise<Result<OrderAggregate | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(owOrders).where(eq(owOrders.id, id)).limit(1);
      if (!rows[0]) return null;

      if (actorTenantId) {
        const rowTenant = rows[0].tenantId;
        if (rowTenant && rowTenant !== actorTenantId) {
          this.logger.warn({ msg: 'Tenant chegarasi buzildi', orderId: id, actorTenantId, rowTenant });
          return null;
        }
      }

      return this.toAggregate(rows[0]);
    }, 'DB_ERROR');
  }

  async findAll(filters: {
    status?: string;
    customerId?: number;
    tenantId?: string | null;
    actorId?: number;
    limit: number;
    offset: number;
  }): Promise<Result<{ items: OrderAggregate[]; total: number }>> {
    return safeCall(async () => {
      const conditions = [
        filters.status     ? eq(owOrders.status,               filters.status)     : undefined,
        filters.customerId ? eq(owOrders.customerId,            filters.customerId) : undefined,
        filters.tenantId   ? eq(owOrders.tenantId,              filters.tenantId)   : undefined,
        filters.actorId    ? eq(owOrders.assignedSalesManager,  filters.actorId)    : undefined,
      ]?.filter((c): c is NonNullable<typeof c> => c !== undefined);

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db.select().from(owOrders)
        .where(where)
        .limit(filters.limit)
        .offset(filters.offset);

      const [countRow] = await db.select({ cnt: sql<number>`count(*)` })
        .from(owOrders)
        .where(where);

      return {
        items: (rows ?? []).map((r) => this.toAggregate(r)),
        total: Number(countRow?.cnt ?? 0),
      };
    }, 'DB_ERROR');
  }

  private toAggregate(row: DbRow): OrderAggregate {
    const statusResult = OrderStatusVo.create(row.status);
    if (!statusResult.ok) {
      this.logger.warn({ msg: 'DB\'da noto\'g\'ri holat, DRAFT ga qaytarildi', rowId: row.id, status: row.status });
      const fallback = OrderStatusVo.create(DRAFT_STATUS);
      if (!fallback.ok) throw new Error(`OrderStatusVo DRAFT yarata olmadi: ${fallback.error.message}`);
      return OrderAggregate.reconstitute({
        ...this.buildProps(row),
        status: fallback.data,
      });
    }
    return OrderAggregate.reconstitute({
      ...this.buildProps(row),
      status: statusResult.data,
    });
  }

  private buildProps(row: DbRow) {
    return {
      id:                   row.id,
      orderNumber:          row.orderNumber,
      customerId:           row.customerId ?? null,
      customerTier:         row.customerTier,
      stateVersion:         row.stateVersion,
      totalAmount:          Number(row.totalAmount),
      currency:             row.currency,
      assignedSalesManager: row.assignedSalesManager ?? null,
      tenantId:             row.tenantId ?? null,
      createdAt:            row.createdAt ?? new Date(),
      updatedAt:            row.updatedAt ?? new Date(),
    };
  }
}
