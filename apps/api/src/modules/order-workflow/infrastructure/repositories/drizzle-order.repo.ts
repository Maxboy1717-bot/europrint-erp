/**
 * @module drizzle-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { eq, sql, and } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { safeCall } from '@common/types/result.type';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';
import { OrderStatusVo } from '../../domain/value-objects/order-status.vo';
import {
  IOrderRepo,
  PaymentPlanEntryRow,
  PaymentEntryReadRow,
  CreateOrderRow,
  CreateStatusHistoryRow,
  GuardOrderRow,
  MaterialRequirementRow,
} from './i-order.repo';
import {
  owOrders,
  owOrderStatusHistory,
  owPaymentPlanEntries,
  owMaterialRequirements,
} from '@shared/db';

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
        items: (Array.isArray(rows) ? rows : []).map((r) => this.toAggregate(r)),
        total: Number(countRow?.cnt ?? 0),
      };
    }, 'DB_ERROR');
  }

  async replacePaymentPlanEntries(
    orderId: string,
    entries: PaymentPlanEntryRow[],
  ): Promise<Result<void>> {
    try {
      await db.transaction(async (tx) => {
        await tx.delete(owPaymentPlanEntries)
          .where(eq(owPaymentPlanEntries.orderId, orderId));
        if (entries.length > 0) {
          await tx.insert(owPaymentPlanEntries).values(entries);
        }
      });
      return Ok();
    } catch (e) {
      this.logger.error({ msg: 'replacePaymentPlanEntries failed', err: String(e), orderId });
      return Err(AppErr('DB_ERROR', "To'lov rejasi saqlanmadi"));
    }
  }

  async insertOrderWithInitialStatus(
    order: CreateOrderRow,
    statusHistory: CreateStatusHistoryRow | null,
  ): Promise<Result<void>> {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(owOrders).values(order);
        if (statusHistory) {
          await tx.insert(owOrderStatusHistory).values(statusHistory);
        }
      });
      return Ok();
    } catch (e) {
      this.logger.error({ msg: 'insertOrderWithInitialStatus failed', err: String(e), orderId: order.id });
      return Err(AppErr('DB_ERROR', 'Buyurtma saqlanmadi'));
    }
  }

  async persistStatusTransition(
    orderId: string,
    newStatus: string,
    stateVersion: number,
    historyRow: CreateStatusHistoryRow,
  ): Promise<Result<void>> {
    try {
      await db.transaction(async (tx) => {
        await tx.update(owOrders)
          .set({ status: newStatus, stateVersion, updatedAt: sql`now()` })
          .where(eq(owOrders.id, orderId));
        await tx.insert(owOrderStatusHistory).values(historyRow);
      });
      return Ok();
    } catch (e) {
      this.logger.error({ msg: 'persistStatusTransition failed', err: String(e), orderId });
      return Err(AppErr('DB_ERROR', 'Status yangilanishida xato'));
    }
  }

  async findOrderGuardFields(orderId: string): Promise<Result<GuardOrderRow | null>> {
    return safeCall(async () => {
      const [row] = await db.select({
        customerApproved:     owOrders.customerApproved,
        techCardConfirmedAt:  owOrders.techCardConfirmedAt,
        actualDeliveryAt:     owOrders.actualDeliveryAt,
        customerSignatureUrl: owOrders.customerSignatureUrl,
      }).from(owOrders).where(eq(owOrders.id, orderId)).limit(1);
      if (!row) return null;
      return {
        customerApproved:     row.customerApproved,
        techCardConfirmedAt:  row.techCardConfirmedAt,
        actualDeliveryAt:     row.actualDeliveryAt,
        customerSignatureUrl: row.customerSignatureUrl,
      } as GuardOrderRow;
    }, 'DB_ERROR');
  }

  async findPaymentPlanEntries(orderId: string): Promise<Result<PaymentEntryReadRow[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(owPaymentPlanEntries)
        .where(eq(owPaymentPlanEntries.orderId, orderId));
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        sequence: r.sequence,
        dueType:  r.dueType,
        status:   r.status,
        amount:   r.amount,
      })) as PaymentEntryReadRow[];
    }, 'DB_ERROR');
  }

  async findMaterialRequirements(orderId: string): Promise<Result<MaterialRequirementRow[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(owMaterialRequirements)
        .where(eq(owMaterialRequirements.orderId, orderId));
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        status:      r.status,
        labPassed:   r.labPassed,
        qtyReserved: r.qtyReserved,
        qtyRequired: r.qtyRequired,
      })) as MaterialRequirementRow[];
    }, 'DB_ERROR');
  }

  private toAggregate(row: DbRow): OrderAggregate {
    const statusResult = OrderStatusVo.create(row.status);
    if (!statusResult.ok) {
      this.logger.warn({ msg: 'DB\'da noto\'g\'ri holat, DRAFT ga qaytarildi', rowId: row.id, status: row.status });
      const fallback = OrderStatusVo.create(DRAFT_STATUS);
      // DRAFT har doim ORDER_STATUSES ichida — ok=false bo'lishi mumkin emas (statik invariant)
      if (!fallback.ok) {
        this.logger.error({ msg: 'OrderStatusVo DRAFT yarata olmadi (invariant buzildi)', err: fallback.error.message });
      }
      return OrderAggregate.reconstitute({
        ...this.buildProps(row),
        // fallback.ok doim true chunki 'DRAFT' ORDER_STATUSES da bor
        status: (fallback.ok ? fallback : OrderStatusVo.create(DRAFT_STATUS)).data as OrderStatusVo,
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
