/**
 * @module order.aggregate
 * @description Source module. See exports for details.
 */

import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { OrderStatusVo, OrderStatusCode } from '../value-objects/order-status.vo';
import type { IOrderHeader, OrderKind } from '@shared/domain/contracts/i-order-header';

export interface OrderProps {
  id: string;
  orderNumber: string;
  customerId: number | null;
  customerTier: string;
  status: OrderStatusVo;
  stateVersion: number;
  totalAmount: number;
  currency: string;
  assignedSalesManager: number | null;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderProps {
  id: string;
  orderNumber: string;
  customerId: number | null;
  totalAmount: number;
  currency: string;
  assignedSalesManager?: number | null;
  tenantId?: string | null;
}

export class OrderAggregate implements IOrderHeader {
  private readonly domainEvents: unknown[] = [];

  private constructor(private readonly props: OrderProps) {}

  static create(input: CreateOrderProps): Result<OrderAggregate> {
    const statusResult = OrderStatusVo.create('DRAFT');
    if (!statusResult.ok) return Err(statusResult.error);

    const now = new Date();
    const props: OrderProps = {
      id: input.id,
      orderNumber: input.orderNumber,
      customerId: input.customerId ?? null,
      customerTier: 'NEW',
      status: statusResult.data,
      stateVersion: 0,
      totalAmount: input.totalAmount,
      currency: input.currency,
      assignedSalesManager: input.assignedSalesManager ?? null,
      tenantId: input.tenantId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    return Ok(new OrderAggregate(props));
  }

  static reconstitute(props: OrderProps): OrderAggregate {
    return new OrderAggregate(props);
  }

  canTransitionTo(toStatus: string): Result<void> {
    if (this.props.status.isTerminal()) {
      return Err(AppErr('INVALID_TRANSITION', 'Terminal holatdan chiqib bo\'lmaydi'));
    }
    const nextResult = this.props.status.canTransitionTo(toStatus);
    if (!nextResult.ok) return Err(nextResult.error);
    return Ok();
  }

  transition(toStatus: string): Result<void> {
    const check = this.canTransitionTo(toStatus);
    if (!check.ok) return Err(check.error);
    const nextResult = this.props.status.canTransitionTo(toStatus);
    if (!nextResult.ok) return Err(nextResult.error);
    this.props.status = nextResult.data;
    this.props.stateVersion += 1;
    this.props.updatedAt = new Date();
    return Ok();
  }

  getId():           string           { return this.props.id; }
  getOrderNumber():  string           { return this.props.orderNumber; }
  getStatus():       OrderStatusCode  { return this.props.status.getValue(); }
  getCustomerId():   number | null    { return this.props.customerId; }
  getTotalAmount():  number           { return this.props.totalAmount; }
  getCurrency():     string           { return this.props.currency; }
  getStateVersion(): number           { return this.props.stateVersion; }
  getCustomerTier(): string           { return this.props.customerTier; }
  getSalesManager(): number | null    { return this.props.assignedSalesManager; }
  getTenantId():     string | null    { return this.props.tenantId; }
  getCreatedAt():    Date             { return this.props.createdAt; }
  getDomainEvents(): unknown[]        { return [...this.domainEvents]; }
  clearEvents():     void             { this.domainEvents.length = 0; }

  toJSON() {
    return {
      id:                   this.props.id,
      orderNumber:          this.props.orderNumber,
      customerId:           this.props.customerId,
      customerTier:         this.props.customerTier,
      status:               this.props.status.getValue(),
      stateVersion:         this.props.stateVersion,
      totalAmount:          this.props.totalAmount,
      currency:             this.props.currency,
      assignedSalesManager: this.props.assignedSalesManager,
      createdAt:            this.props.createdAt,
      updatedAt:            this.props.updatedAt,
    };
  }

  // --- IOrderHeader marker (cross-context "an order" shape) ---
  get id(): string { return this.props.id; }
  get orderNumber(): string { return this.props.orderNumber; }
  get status(): string { return this.props.status.getValue(); }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get kind(): OrderKind { return 'workflow'; }
}
