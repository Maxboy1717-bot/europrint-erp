import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { SoStatus } from '../value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';
import { Result, Ok, Err } from '@common/types/result.type';

export class SalesOrder extends AggregateRoot {
  private id: number;
  private orderNumber: string;
  private status: SoStatus;
  private companyId: number;
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

  static create(props: {
    orderNumber: string;
    status: SoStatus;
    companyId: number;
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

  getOrderNumber(): string {
    return this.orderNumber;
  }

  getAdvanceStatus(): string {
    return this.advanceStatus;
  }

  getAdvancePaid(): number {
    return this.advancePaid;
  }
}
