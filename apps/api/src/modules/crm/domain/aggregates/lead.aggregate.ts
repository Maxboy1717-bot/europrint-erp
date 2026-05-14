/**
 * @module lead.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { LeadStatus } from '../value-objects/lead-status.vo';
import { AIScore } from '../value-objects/ai-score.vo';
import { Result, Ok, Err } from '@common/types/result.type';

export interface LeadCreateProps {
  companyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  aiScore: AIScore;
  createdBy: number;
  assignedTo?: number;
  source: string;
  notes?: string;
}

export class Lead extends AggregateRoot {
  private id: number;
  private companyId: number;
  private firstName: string;
  private lastName: string;
  private email: string;
  private phone: string;
  private status: LeadStatus;
  private aiScore: AIScore;
  private createdBy: number;
  private assignedTo?: number;
  private source: string;
  private notes?: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: {
    id: number;
    companyId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: LeadStatus;
    aiScore: AIScore;
    createdBy: number;
    assignedTo?: number;
    source: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    Object.assign(this, props);
  }

  static create(props: LeadCreateProps): Lead {
    const lead = new Lead({
      ...props,
      id: 0,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });
    return lead;
  }

  qualify(): Result<void> {
    if (!this.canQualify()) {
      return Err('Lead cannot be qualified from current status');
    }
    const statusResult = LeadStatus.create('qualified');
    if (!statusResult.ok) return Err('Invalid status transition');
    this.status = statusResult.data;
    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'LeadQualified',
    });
    return Ok();
  }

  convertToDeal(dealId: number): Result<void> {
    if (this.status.getValue() !== 'qualified') {
      return Err('Only qualified leads can be converted to deals');
    }
    const statusResult = LeadStatus.create('converted');
    if (!statusResult.ok) return Err('Invalid status transition');
    this.status = statusResult.data;
    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'LeadConverted',
      data: { leadId: this.id, dealId, companyId: this.companyId, totalAmount: 0 },
    });
    return Ok();
  }

  markAsLost(reason: string): Result<void> {
    if (this.status.getValue() === 'lost' || this.status.getValue() === 'converted') {
      return Err('Cannot mark this lead as lost');
    }
    const statusResult = LeadStatus.create('lost');
    if (!statusResult.ok) return Err('Invalid status transition');
    this.status = statusResult.data;
    this.addDomainEvent({
      aggregateId: this.id,
      eventName: 'LeadLost',
      data: { leadId: this.id, reason },
    });
    return Ok();
  }

  private canQualify(): boolean {
    const validStatuses = ['new', 'contacted'];
    return validStatuses.includes(this.status.getValue());
  }

  getId(): number {
    return this.id;
  }

  getStatus(): string {
    return this.status.getValue();
  }

  getAiScore(): number {
    return this.aiScore.value;
  }

  getCompanyId(): number {
    return this.companyId;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getEmail(): string {
    return this.email;
  }

  getPhone(): string {
    return this.phone;
  }

  getSource(): string {
    return this.source;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  getAssignedTo(): number | undefined {
    return this.assignedTo;
  }

  getCreatedBy(): number {
    return this.createdBy;
  }
}
