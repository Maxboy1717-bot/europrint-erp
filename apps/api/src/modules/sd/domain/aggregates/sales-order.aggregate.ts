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
import type { IOrderHeader, OrderKind } from '@shared/domain/contracts/i-order-header';

export class SalesOrder extends AggregateRoot implements IOrderHeader {
  private _id: number;
  private _orderNumber: string;
  private _status: SoStatus;
  private _companyId: number;
  private _customerId?: CustomerId;
  private _totalAmount: Money;
  private _advanceRequired: number = 70;
  private _advancePaid: number = 0;
  private _advanceStatus: 'pending' | 'partial' | 'approved' | 'bypassed' = 'pending';
  private _advanceBypassBy?: number;
  private _advanceBypassReason?: string;
  private _designFlag: boolean = false;
  private _sampleFlag: boolean = false;
  private _techBomApproved: boolean = false;
  private _techRoutingApproved: boolean = false;
  private _techCardApproved: boolean = false;
  private _createdBy: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private readonly _paymentIds: Set<string> = new Set();
  private _version: number = 0;

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
    this._id = props.id;
    this._orderNumber = props.orderNumber;
    this._status = props.status;
    this._companyId = props.companyId;
    this._customerId = props.customerId;
    this._totalAmount = props.totalAmount;
    if (props.advanceRequired !== undefined) this._advanceRequired = props.advanceRequired;
    if (props.advancePaid !== undefined) this._advancePaid = props.advancePaid;
    if (props.advanceStatus !== undefined) this._advanceStatus = props.advanceStatus;
    this._advanceBypassBy = props.advanceBypassBy;
    this._advanceBypassReason = props.advanceBypassReason;
    if (props.designFlag !== undefined) this._designFlag = props.designFlag;
    if (props.sampleFlag !== undefined) this._sampleFlag = props.sampleFlag;
    if (props.techBomApproved !== undefined) this._techBomApproved = props.techBomApproved;
    if (props.techRoutingApproved !== undefined) this._techRoutingApproved = props.techRoutingApproved;
    if (props.techCardApproved !== undefined) this._techCardApproved = props.techCardApproved;
    this._createdBy = props.createdBy;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    if (props.version !== undefined) this._version = props.version;
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
    const required = this._totalAmount.getAmount() * (this._advanceRequired / 100);
    if (this._advancePaid < required && this._advanceStatus !== 'bypassed') {
      return {
        blocked: true,
        reason: `Avans ${this._advanceRequired}% to'lanmagan. Talob: ${required}, To'landi: ${this._advancePaid}`,
      };
    }
    return { blocked: false };
  }

  isThreeCheckpointPassed(): boolean {
    return this._techBomApproved && this._techRoutingApproved && this._techCardApproved;
  }

  bypassAdvance(bypassBy: number, reason: string): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Err('Bypass reason is required');
    }
    this._advanceStatus = 'bypassed';
    this._advanceBypassBy = bypassBy;
    this._advanceBypassReason = reason;
    this.addDomainEvent({
      aggregateId: this._id,
      aggregateName: 'SalesOrder',
      eventName: 'AdvanceBypassApproved',
      timestamp: _time.now(),
      data: {
        orderId: this._id,
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
      if (this._paymentIds.has(idempotencyKey)) {
        return Err(`Duplicate to'lov: idempotency_key '${idempotencyKey}' allaqachon ishlatilgan`);
      }
      this._paymentIds.add(idempotencyKey);
    }
    const total         = this._totalAmount.getAmount();
    const newAdvancePaid = this._advancePaid + amount;
    if (newAdvancePaid > total) {
      return Err(`Avans to'lov (${newAdvancePaid}) buyurtma summasidan (${total}) oshib ketdi`);
    }
    const required = total * (this._advanceRequired / 100);
    const applied  = amount;
    this._advancePaid += applied;
    this._version += 1;
    if (this._advancePaid >= required) {
      this._advanceStatus = 'approved';
    } else if (this._advancePaid > 0) {
      this._advanceStatus = 'partial';
    }
    this.addDomainEvent({
      aggregateId: this._id,
      aggregateName: 'SalesOrder',
      eventName: 'AdvancePaymentConfirmed',
      timestamp: _time.now(),
      data: {
        orderId: this._id,
        amountPaid: applied,
        totalPaid: this._advancePaid,
        advanceStatus: this._advanceStatus,
        version: this._version,
        idempotencyKey: idempotencyKey ?? null,
      },
    });
    return Ok();
  }

  getVersion(): number { return this._version; }

  approveTechCheckpoint(type: 'bom' | 'routing' | 'card'): Result<void> {
    if (type === 'bom') {
      this._techBomApproved = true;
    } else if (type === 'routing') {
      this._techRoutingApproved = true;
    } else if (type === 'card') {
      this._techCardApproved = true;
    }

    if (this.isThreeCheckpointPassed()) {
      this.addDomainEvent({
        aggregateId: this._id,
        aggregateName: 'SalesOrder',
        eventName: 'DesignAndLabCompleted',
        timestamp: _time.now(),
        data: { orderId: this._id },
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
      this._status = statusResult.data;
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
    const currentStatus = this._status.getValue();
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
    return this._advanceRequired;
  }

  getId(): number {
    return this._id;
  }

  /**
   * Assign the DB-generated id after the row is persisted. The create() factory
   * starts a new aggregate at id 0; the repository calls this once with the
   * serial id returned by the INSERT so the aggregate (and the outbox entries
   * built from it) carry the real id. Guarded: only a still-unpersisted (id 0)
   * aggregate can be assigned, so an existing id is never silently overwritten.
   */
  assignPersistedId(id: number): void {
    if (this._id === 0 && Number.isInteger(id) && id > 0) {
      this._id = id;
    }
  }

  getStatus(): string {
    return this._status.getValue();
  }

  getTotalAmount(): number {
    return this._totalAmount.getAmount();
  }

  getCompanyId(): number {
    return this._companyId;
  }

  getCustomerId(): number | undefined {
    return this._customerId?.value;
  }

  getCustomerIdVO(): CustomerId | undefined {
    return this._customerId;
  }

  getOrderNumber(): string {
    return this._orderNumber;
  }

  getAdvanceStatus(): string {
    return this._advanceStatus;
  }

  getAdvancePaid(): number {
    return this._advancePaid;
  }

  // --- IOrderHeader marker (cross-context "an order" shape) ---
  get id(): number { return this._id; }
  get orderNumber(): string { return this._orderNumber; }
  get status(): string { return this._status.getValue(); }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get createdBy(): number { return this._createdBy; }
  get kind(): OrderKind { return 'sales'; }

  // Stable JSON shape consumed by the FE SD pages.
  // Without this, JSON.stringify leaks every private `_field` and the FE sees
  // `_id` / `_orderNumber` instead of `id` / `orderNumber`, breaking list keys.
  // Defensive on VO access: legacy DB rows occasionally hydrate without a
  // valid SoStatus / Money — never throw from a serializer.
  toJSON(): Record<string, unknown> {
    const total = typeof this._totalAmount?.getAmount === 'function' ? this._totalAmount.getAmount() : 0;
    const currency = typeof this._totalAmount?.getCurrency === 'function' ? this._totalAmount.getCurrency() : 'UZS';
    const status = typeof this._status?.getValue === 'function' ? this._status.getValue() : 'draft';
    return {
      id: this._id,
      orderNumber: this._orderNumber,
      documentNumber: this._orderNumber,
      status,
      moduleStatus: status,
      overallStatus: status,
      companyId: this._companyId,
      customerId: this._customerId?.value ?? null,
      totalAmount: total,
      totalValue: total,
      currency,
      advanceRequired: this._advanceRequired,
      advancePaid: this._advancePaid,
      advancePaidAmount: this._advancePaid,
      advanceStatus: this._advanceStatus,
      balanceDueAmount: Math.max(0, total - this._advancePaid),
      advanceBypassBy: this._advanceBypassBy ?? null,
      advanceBypassReason: this._advanceBypassReason ?? null,
      designFlag: this._designFlag,
      sampleFlag: this._sampleFlag,
      techBomApproved: this._techBomApproved,
      techRoutingApproved: this._techRoutingApproved,
      techCardApproved: this._techCardApproved,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
    };
  }
}
