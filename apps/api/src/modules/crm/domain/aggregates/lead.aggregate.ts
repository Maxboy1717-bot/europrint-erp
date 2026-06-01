/**
 * @module lead.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { LeadStatus } from '../value-objects/lead-status.vo';
import { AIScore } from '../value-objects/ai-score.vo';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { CustomerId } from '@shared/domain/value-objects/customer-id.vo';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';

/**
 * VO-typed creation props. Preferred for new call sites — the handler is
 * responsible for running `Email.create(...)`, `PhoneNumber.create(...)` and
 * (optionally) `CustomerId.create(...)` and combining failures.
 */
export interface LeadCreateProps {
  companyId: number;
  firstName: string;
  lastName: string;
  email: Email;
  phone: PhoneNumber;
  status: LeadStatus;
  aiScore: AIScore;
  createdBy: number;
  assignedTo?: number;
  customerId?: CustomerId;
  source: string;
  notes?: string;
}

/**
 * Back-compat shape that accepts raw primitives. Used by `Lead.fromRaw` so
 * legacy hydration paths (e.g. repository → aggregate) keep compiling while
 * call sites migrate.
 */
export interface LeadCreateRawProps {
  companyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  aiScore: AIScore;
  createdBy: number;
  assignedTo?: number;
  customerId?: number;
  source: string;
  notes?: string;
}

export class Lead extends AggregateRoot {
  private id: number;
  private companyId: number;
  private firstName: string;
  private lastName: string;
  private email: Email;
  private phone: PhoneNumber;
  private status: LeadStatus;
  private aiScore: AIScore;
  private createdBy: number;
  private assignedTo?: number;
  private customerId?: CustomerId;
  private source: string;
  private notes?: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: {
    id: number;
    companyId: number;
    firstName: string;
    lastName: string;
    email: Email;
    phone: PhoneNumber;
    status: LeadStatus;
    aiScore: AIScore;
    createdBy: number;
    assignedTo?: number;
    customerId?: CustomerId;
    source: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    Object.assign(this, props);
  }

  /**
   * VO-first factory. The handler must build `Email` / `PhoneNumber` /
   * `CustomerId` VOs upstream and combine their `Result`s; this method
   * therefore cannot fail and returns `Lead` directly.
   */
  static create(props: LeadCreateProps): Lead {
    const lead = new Lead({
      ...props,
      id: 0,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });
    return lead;
  }

  /**
   * Back-compat factory that takes raw primitives, validates them via the
   * VO factories, and returns `Result<Lead>`. Use this from boundary code
   * (controllers, handlers reading DTOs) when the VOs are not already
   * constructed upstream.
   */
  static fromRaw(props: LeadCreateRawProps): Result<Lead> {
    const emailR = Email.create(props.email);
    if (!emailR.ok) return Err(emailR.error);
    const phoneR = PhoneNumber.create(props.phone);
    if (!phoneR.ok) return Err(phoneR.error);

    let customerId: CustomerId | undefined;
    if (props.customerId !== undefined) {
      const cidR = CustomerId.create(props.customerId);
      if (!cidR.ok) return Err(cidR.error);
      customerId = cidR.data;
    }

    return Ok(
      Lead.create({
        companyId: props.companyId,
        firstName: props.firstName,
        lastName: props.lastName,
        email: emailR.data,
        phone: phoneR.data,
        status: props.status,
        aiScore: props.aiScore,
        createdBy: props.createdBy,
        assignedTo: props.assignedTo,
        customerId,
        source: props.source,
        notes: props.notes,
      }),
    );
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

  /** Whether this lead may be converted — lets callers pre-validate before creating a
   *  deal, so a non-qualified lead never leaves an orphan deal behind. */
  canBeConverted(): boolean {
    return this.status.getValue() === 'qualified';
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
    return this.email.value;
  }

  getEmailVO(): Email {
    return this.email;
  }

  getPhone(): string {
    return this.phone.value;
  }

  getPhoneVO(): PhoneNumber {
    return this.phone;
  }

  getCustomerId(): number | undefined {
    return this.customerId?.value;
  }

  getCustomerIdVO(): CustomerId | undefined {
    return this.customerId;
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
