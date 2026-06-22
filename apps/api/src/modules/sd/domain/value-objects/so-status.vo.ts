/**
 * @module so-status.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { ValueObject } from '@shared/domain/value-object.base';
import { Result, Ok, Err } from '@common/types/result.type';

export type SoStatusType =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'confirmed'
  | 'pending_advance'
  | 'ready_for_planning'
  | 'in_planning'
  | 'completed_planning'
  | 'ready_for_production'
  | 'in_production'
  | 'in_progress'
  | 'ready_for_shipment'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'on_hold';

export class SoStatus extends ValueObject<SoStatusType> {
  private constructor(value: SoStatusType) {
    super(value);
  }

  static create(value: string): Result<SoStatus> {
    const validStatuses: SoStatusType[] = [
      'draft', 'pending_approval', 'approved', 'confirmed', 'pending_advance',
      'ready_for_planning', 'in_planning', 'completed_planning',
      'ready_for_production', 'in_production', 'in_progress', 'ready_for_shipment',
      'shipped', 'delivered', 'closed', 'cancelled', 'on_hold',
    ];
    if (!validStatuses.includes(value as SoStatusType)) {
      return Err(`Invalid SO status: ${value}`);
    }
    return Ok(new SoStatus(value as SoStatusType));
  }

  getValue(): SoStatusType {
    return this._value;
  }

  equals(other: SoStatus): boolean {
    return this._value === other._value;
  }
}
