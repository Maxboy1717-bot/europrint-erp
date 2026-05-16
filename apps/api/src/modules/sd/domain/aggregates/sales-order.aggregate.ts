/**
 * @module sales-order.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { SoStatus } from '../value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';
import { CustomerId } from '@shared/domain/value-objects/customer-id.vo';
import { Result, Ok, Err } from '@common/types/result.type';
import type { OrderKind } from '@shared/domain/contracts/i-order-header';

// TODO PA2-16: Cannot add `implements IOrderHeader` here yet. SalesOrder's
// status field is a `SoStatus` value object (private), and its `id`,
// `orderNumber`, `createdAt`, `updatedAt`, `createdBy` are all private
// fields populated via `Object.assign`. Widening the interface to a union
// of every per-context status VO would defeat its purpose, and renaming
// the backing fields would break the constructor contract. Revisit when
// SalesOrder exposes a public string status getter and renames backing
// fields to `_id` / `_orderNumber` etc. so public getters can be added.
export class SalesOrder extends AggregateRoot {
  private id: number;
  private orderNumber: string;
  private status: SoStatus;
  private companyId: number;
  private customerId?: CustomerId;
  private totalAmount: Money;
  private advanceRequired: number = 70;
  private advancePaid: number = 0;
  private advanceStatus: 'pending' | 'partial' | 'approved' | 'bypassed' = 'pending';
  private advanceBypassBy?: number;
  private advanceBypassReason?: string;
  private designFlag: boolean = false;
  private sampleFlag: boolean = false;
  private techBomApproved: boolean = false;
  private techRoutingApproved: boolean = false;
  private techCardApproved: boolean = false;
  private createdBy: number;
  private createdAt: Date;
  private updatedAt: Date;
  private readonly paymentIds: Set<string> = new Set();
  private version: number = 0;

  constructor(props: {
    id: number;
    orderNumber: string;
    status: SoStatus;
    companyId: number;
    customerId?: CustomerId;
    totalAmount: Money;
    advanceRequired?: number;
    advancePaid?: number;
    advanceStatus?: 'pending' | 'partial' | 'approved' | 'bypassed';
    advanceBypassBy?: number;
    advanceBypassReason?: string;
    designFlag?: boolean;
    sampleFlag?: boolean;
    techBomApproved?: boolean;
    techRoutingApproved?: boolean;
    techCardApproved?: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }) {
    super();
    Object.assign(this, props);
    if (props.version !== undefined) this.version = props.version;
  }

  /**
   * VO-first factory. `customerId` is a `CustomerId` VO that the handler
   * must validate upstream via `CustomerId.create(...)`. `companyId` is the
   * tenant id and stays a primitive number.
   */
  static create(props: {
    orderNumber: string;
    status: SoStatus;
    companyId: number;
    customerId?: CustomerId;
    totalAmount: Money;
    advanceRequired?: number;
    advancePaid?: number;
    advanceStatus?: 'pending' | 'partial' | 'approved' | 'bypassed';
    advanceBypassBy?: number;
    advanceBypassReason?: string;
    designFlag?: boolean;
    sampleFlag?: boolean;
    techBomApproved?: boolean;
    techRoutingApproved?: boolean;
    techCardApproved?: boolean;
    createdBy: number;
  }): SalesOrder {
    return new SalesOrder({
      ...props,
      id: 0,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });
  }

  /**
   * Back-compat factory that takes a raw numeric customerId and validates it
   * via `CustomerId.create`. Useful for boundary code (controllers, handlers
   * that read raw DTOs).
   */
  static fromRaw(props: {
    orderNumber: string;
    status: SoStatus;
    companyId: number;
    customerId?: number;
    totalAmount: Money;
    advanceRequired?: number;
    advancePaid?: number;
    advanceStatus?: 'pending' | 'partial' | 'approved' | 'bypassed';
    advanceBypassBy?: number;
    advanceBypassReason?: string;
    designFlag?: boolean;
    sampleFlag?: boolean;
    techBomApproved?: boolean;
    techRoutingApproved?: boolean;
    techCardApproved?: boolean;
    createdBy: number;
  }): Result<SalesOrder> {
    let customerId: CustomerId | undefined;
    if (props.customerId !== undefined) {
      const r = CustomerId.create(props.customerId);
      if (!r.ok) return Err(r.error);
      customerId = r.data;
    }
    return Ok(SalesOrder.create({ ...props, customerId }));
  }

  checkAdvanceAndBlock(): { blocked: boolean; reason?: string } {
    const required = this.totalAmount.getAmount() * (this.advanceRequired / 100);
    if (this.advancePaid < required && this.advanceStatus !== 'bypassed') {
      return {
        blocked: true,
        reason: `Avans ${this.advanceRequired}% to'lanmagan. Talob: ${required}, To'landi: ${this.advancePaid}`,
      };
    }
    return { blocked: false };
  }

  isThreeCheckpointPassed(): boolean {
    return this.techBomApproved && this.techRoutingApproved && this.techCardApproved;
  }

  bypassAdvance(bypassBy: number, reason: string): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Err('Bypass reason is required');
    }
    this.advanceStatus = 'bypassed';
    this.advanceBypassBy = bypassBy;
    this.advanceBypassReason = reason;
    this.addDomainEvent({
      aggregateId: this.id,
      aggregateName: 'SalesOrder',
      eventName: 'AdvanceBypassApproved',
      timestamp: _time.now(),
      data: {
        orderId: this.id,
        bypassBy,
        reason,
      },
    });
    return Ok();
  }

  confirmAdvancePayment(amount: number, idempotencyKey?: string): Result<void> {
    if (amount <= 0) {
      return Err('To\'lov summasi musbat bo\'lishi kerak');
    }
    if (idempotencyKey) {
      if (this.paymentIds.has(idempotencyKey)) {
        return Err(`Duplicate to'lov: idempotency_key '${idempotencyKey}' allaqachon ishlatilgan`);
      }
      this.paymentIds.add(idempotencyKey);
    }
    const total         = this.totalAmount.getAmount();
    const newAdvancePaid = this.advancePaid + amount;
    if (newAdvancePaid > total) {
      return Err(`Avans to'lov (${newAdvancePaid}) buyurtma summasidan (${total}) oshib ketdi`);
    }
    const required = total * (this.advanceRequired / 100);
    const applied  = amount;
    this.advancePaid += applied;
    this.version += 1;
    if (this.advancePaid >= required) {
      this.advanceStatus = 'approved';
    } else if (this.advancePaid > 0) {
      this.advanceStatus = 'partial';
    }
    this.addDomainEvent({
      aggregateId: this.id,
      aggregateName: 'SalesOrder',
      eventName: 'AdvancePaymentConfirmed',
      timestamp: _time.now(),
      data: {
        orderId: this.id,
        amountPaid: applied,
        totalPaid: this.advancePaid,
        advanceStatus: this.advanceStatus,
        version: this.version,
        idempotencyKey: idempotencyKey ?? null,
      },
    });
    return Ok();
  }

  getVersion(): number { return this.version; }

  approveTechCheckpoint(type: 'bom' | 'routing' | 'card'): Result<void> {
    if (type === 'bom') {
      this.techBomApproved = true;
    } else if (type === 'routing') {
      this.techRoutingApproved = true;
    } else if (type === 'card') {
      this.techCardApproved = true;
    }

    if (this.isThreeCheckpointPassed()) {
      this.addDomainEvent({
        aggregateId: this.id,
        aggregateName: 'SalesOrder',
        eventName: 'DesignAndLabCompleted',
        timestamp: _time.now(),
        data: { orderId: this.id },
      });
    }

    return Ok();
  }

  updateStatus(newStatus: string): Result<void> {
    const validStatuses = [
      'draft',
      'pending_approval',
      'approved',
      'pending_advance',
      'ready_for_planning',
      'in_planning',
      'completed_planning',
      'ready_for_production',
      'in_production',
      'ready_for_shipment',
      'shipped',
      'delivered',
      'closed',
      'cancelled',
      'on_hold',
    ];

    if (!validStatuses.includes(newStatus)) {
      return Err('Invalid status');
    }

    const statusResult = SoStatus.create(newStatus);
    if (statusResult.ok) {
      this.status = statusResult.data;
    }
    return Ok();
  }

  /**
   * State-machine guard for status transitions (§12). Delegates the actual
   * status mutation to `updateStatus`, but rejects illegal hops up front and
   * emits the previous status so the caller can publish a domain event with
   * full context.
   */
  transitionStatus(newStatus: string): Result<{ previousStatus: string }> {
    const currentStatus = this.status.getValue();
    const allowed = SalesOrder.VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return Err(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
    const update = this.updateStatus(newStatus);
    if (!update.ok) {
      return Err(update.error?.message ?? 'Invalid status');
    }
    return Ok({ previousStatus: currentStatus });
  }

  /**
   * Valid state transitions (§12). Public-static so command handlers / tests
   * can introspect the graph without bypassing the aggregate.
   */
  static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['pending_approval', 'cancelled'],
    pending_approval: ['approved', 'rejected', 'cancelled'],
    approved: ['pending_advance', 'on_hold', 'cancelled'],
    pending_advance: ['ready_for_planning', 'on_hold', 'cancelled'],
    ready_for_planning: ['in_planning', 'on_hold', 'cancelled'],
    in_planning: ['completed_planning', 'on_hold', 'cancelled'],
    completed_planning: ['ready_for_production', 'on_hold', 'cancelled'],
    ready_for_production: ['in_production', 'on_hold', 'cancelled'],
    in_production: ['ready_for_shipment', 'on_hold', 'cancelled'],
    ready_for_shipment: ['shipped', 'on_hold', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['closed', 'cancelled'],
    closed: [],
    cancelled: [],
    on_hold: ['pending_approval', 'pending_advance', 'ready_for_planning', 'cancelled'],
  };

  getAdvanceRequired(): number {
    return this.advanceRequired;
  }

  getId(): number {
    return this.id;
  }

  getStatus(): string {
    return this.status.getValue();
  }

  getTotalAmount(): number {
    return this.totalAmount.getAmount();
  }

  getCompanyId(): number {
    return this.companyId;
  }

  getCustomerId(): number | undefined {
    return this.customerId?.value;
  }

  getCustomerIdVO(): CustomerId | undefined {
    return this.customerId;
  }

  getOrderNumber(): string {
    return this.orderNumber;
  }

  getAdvanceStatus(): string {
    return this.advanceStatus;
  }

  getAdvancePaid(): number {
    return this.advancePaid;
  }

  // --- IOrderHeader marker (cross-context "an order" shape) ---
  get kind(): OrderKind { return 'sales'; }
}
