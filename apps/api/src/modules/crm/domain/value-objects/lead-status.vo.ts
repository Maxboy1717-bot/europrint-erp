/**
 * @module lead-status.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { ValueObject } from '@shared/domain/value-object.base';
import { Result, Ok, Err } from '@common/types/result.type';

export type LeadStatusType = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';

export class LeadStatus extends ValueObject<LeadStatusType> {
  private constructor(value: LeadStatusType) {
    super(value);
  }

  static create(value: string): Result<LeadStatus> {
    const validStatuses: LeadStatusType[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
    if (!validStatuses.includes(value as LeadStatusType)) {
      return Err(`Invalid lead status: ${value}`);
    }
    return Ok(new LeadStatus(value as LeadStatusType));
  }

  getValue(): LeadStatusType {
    return this._value;
  }

  equals(other: LeadStatus): boolean {
    return this._value === other._value;
  }
}
