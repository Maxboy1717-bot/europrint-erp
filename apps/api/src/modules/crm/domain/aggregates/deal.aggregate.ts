/**
 * @module deal.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from 'shared/domain/aggregate-root.base';
import { DealStatus } from '../value-objects/deal-status.vo';
import { Money } from 'shared/domain/value-objects/money.vo';
import { Result, Ok, Err } from '@common/types/result.type';

export interface DealCreateProps {
  leadId: number;
  companyId: number;
  dealNumber: string;
  status: DealStatus;
  totalAmount: Money;
  currency: string;
  assignedTo: number;
  createdBy: number;
  description?: string;
  expectedClosureDate: Date;
  closedAt?: Date;
}

export class Deal extends AggregateRoot {
  private id: number;
  private leadId: number;
  private companyId: number;
  private dealNumber: string;
  private status: DealStatus;
  private totalAmount: Money;
  private currency: string;
  private assignedTo: number;
  private createdBy: number;
  private description?: string;
  private expectedClosureDate: Date;
  private closedAt?: Date;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: {
    id: number;
    leadId: number;
    companyId: number;
    dealNumber: string;
    status: DealStatus;
    totalAmount: Money;
    currency: string;
    assignedTo: number;
    createdBy: number;
    description?: string;
    expectedClosureDate: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    Object.assign(this, props);
  }

  static create(props: DealCreateProps): Deal {
    return new Deal({
      ...props,
      id: 0,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });
  }

  // Sprint 2 A.6 — markAsWon must transition only from proposal/negotiation and
  // returns Result<void> per Rule 1. Domain event publishing is the handler's
  // job (event bus is application concern, not domain).
  markAsWon(actualAmount?: number): Result<void> {
    if (!this.canMarkAsWon()) {
      return Err(`Cannot mark deal as won from status '${this.status.getValue()}'`);
    }
    const statusResult = DealStatus.create('won');
    if (!statusResult.ok) return Err('Invalid status transition: won');
    this.status = statusResult.data;
    this.closedAt = _time.now();
    if (actualAmount != null) {
      const moneyR = Money.of(actualAmount, this.currency);
      if (!moneyR.ok) {
        return Err('Invalid actual amount');
      }
      this.totalAmount = moneyR.data;
    }
    this.addDomainEvent({ aggregateId: this.id, eventName: 'DealWon', data: { dealId: this.id, companyId: this.companyId, totalAmount: this.totalAmount.getAmount() } });
    return Ok();
  }

  // Sprint 2 A.7 — markAsLost cannot be called once already lost or won.
  markAsLost(reason: string): Result<void> {
    if (this.status.getValue() === 'lost' || this.status.getValue() === 'won') {
      return Err(`Cannot mark deal as lost from terminal status '${this.status.getValue()}'`);
    }
    if (!reason || reason.trim().length === 0) {
      return Err('Loss reason is required');
    }
    const statusResult = DealStatus.create('lost');
    if (!statusResult.ok) return Err('Invalid status transition: lost');
    this.status = statusResult.data;
    this.closedAt = _time.now();
    this.addDomainEvent({ aggregateId: this.id, eventName: 'DealLost', data: { dealId: this.id, companyId: this.companyId, reason } });
    return Ok();
  }

  // updateStatus is the non-terminal-transition path (qualification → proposal →
  // negotiation). It is INTENTIONALLY forbidden from transitioning to 'won' or
  // 'lost' — those must go through markAsWon() / markAsLost() so the invariants
  // (closedAt, domain events, business rules) are enforced.
  updateStatus(newStatus: string): Result<void> {
    if (newStatus === 'won' || newStatus === 'lost') {
      return Err(`Use markAsWon()/markAsLost() to transition to '${newStatus}', not updateStatus()`);
    }
    const validStatuses = ['qualification', 'proposal', 'negotiation'];
    if (!validStatuses.includes(newStatus)) {
      return Err(`Invalid deal status '${newStatus}'`);
    }
    const statusResult = DealStatus.create(newStatus);
    if (!statusResult.ok) return Err('Invalid status value');
    this.status = statusResult.data;
    return Ok();
  }

  private canMarkAsWon(): boolean {
    const winningStatuses = ['proposal', 'negotiation'];
    return winningStatuses.includes(this.status.getValue());
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

  getLeadId(): number {
    return this.leadId;
  }

  getAssignedTo(): number {
    return this.assignedTo;
  }
}
