/**
 * @module i-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';

export const ORDER_WF_REPO = 'ORDER_WF_REPO';

export interface PaymentPlanEntryRow {
  orderId: string;
  sequence: number;
  dueType: 'ADVANCE' | 'MILESTONE' | 'NET_30' | 'ON_DELIVERY';
  dueCondition: Record<string, unknown>;
  percent: string;
  amount: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface PaymentEntryReadRow {
  sequence: number;
  dueType: string;
  status: string;
  amount: string | number;
}

export interface CreateOrderRow {
  id: string;
  orderNumber: string;
  customerId: number | null;
  customerTier: string;
  status: string;
  stateVersion: number;
  totalAmount: string;
  currency: string;
  assignedSalesManager: number | null;
  tenantId?: string;
}

export interface CreateStatusHistoryRow {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: number;
  reason: string | null;
  stateVersion: number;
}

export interface GuardOrderRow {
  customerApproved: boolean | null;
  techCardConfirmedAt: Date | null;
  actualDeliveryAt: Date | null;
  customerSignatureUrl: string | null;
}

export interface MaterialRequirementRow {
  status: string;
  labPassed: boolean | null;
  qtyReserved: string | number;
  qtyRequired: string | number;
}

export interface IOrderRepo {
  save(order: OrderAggregate): Promise<Result<OrderAggregate>>;
  findById(id: string, actorTenantId?: string | null): Promise<Result<OrderAggregate | null>>;
  findAll(filters: {
    status?: string;
    customerId?: number;
    tenantId?: string | null;
    actorId?: number;
    limit: number;
    offset: number;
  }): Promise<Result<{ items: OrderAggregate[]; total: number }>>;

  /**
   * Replaces (DELETE + INSERT) the payment plan entries for an order in one
   * transaction. Used by CreatePaymentPlanHandler (PA1-10).
   */
  replacePaymentPlanEntries(
    orderId: string,
    entries: PaymentPlanEntryRow[],
  ): Promise<Result<void>>;

  /**
   * Inserts a new order plus an initial status-history entry transactionally.
   * Used by CreateOrderHandler (PA1-10).
   */
  insertOrderWithInitialStatus(
    order: CreateOrderRow,
    statusHistory: CreateStatusHistoryRow | null,
  ): Promise<Result<void>>;

  /**
   * Persists a status transition: updates owOrders.status/stateVersion AND
   * inserts a status-history row in one transaction.
   * Used by TransitionStatusHandler (PA1-10).
   */
  persistStatusTransition(
    orderId: string,
    newStatus: string,
    stateVersion: number,
    historyRow: CreateStatusHistoryRow,
  ): Promise<Result<void>>;

  /**
   * Returns the columns required by the production-scheduled / closed guards.
   * Used by TransitionStatusHandler (PA1-10).
   */
  findOrderGuardFields(orderId: string): Promise<Result<GuardOrderRow | null>>;

  /**
   * Returns payment plan entries for guard checks.
   * Used by TransitionStatusHandler (PA1-10).
   */
  findPaymentPlanEntries(orderId: string): Promise<Result<PaymentEntryReadRow[]>>;

  /**
   * Returns material requirements for production-readiness guard.
   * Used by TransitionStatusHandler (PA1-10).
   */
  findMaterialRequirements(orderId: string): Promise<Result<MaterialRequirementRow[]>>;
}
