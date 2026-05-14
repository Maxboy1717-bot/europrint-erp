/**
 * @module deal.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from 'shared/domain/aggregate-root.base';
import { DealStatus } from '../value-objects/deal-status.vo';
import { Money } from 'shared/domain/value-objects/money.vo';

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

  markAsWon(): boolean {
    if (!this.canMarkAsWon()) {
      return false;
    }
    const statusResult = DealStatus.create('won');
    if (!statusResult.ok) return false;
    this.status = statusResult.data;
    this.closedAt = _time.now();
    return true;
  }

  markAsLost(_reason: string): boolean {
    if (this.status.getValue() === 'lost' || this.status.getValue() === 'won') {
      return false;
    }
    const statusResult = DealStatus.create('lost');
    if (!statusResult.ok) return false;
    this.status = statusResult.data;
    this.closedAt = _time.now();
    return true;
  }

  updateStatus(newStatus: string): boolean {
    const validStatuses = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStatuses.includes(newStatus)) {
      return false;
    }
    const statusResult = DealStatus.create(newStatus);
    if (!statusResult.ok) return false;
    this.status = statusResult.data;
    return true;
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
