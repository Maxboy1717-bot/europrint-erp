/**
 * @module position.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
import { Ok, Err, AppErr, Result } from '@common/result';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { PositionCreatedEvent, PositionRenamedEvent } from '../events';

const _time = new TashkentTimeService();

export class Position extends AggregateRoot {
  public title: string;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    title: string,
    public readonly code: string,
    public readonly departmentId: string,
    public readonly level: number,
    public readonly minSalary: number,
    public readonly maxSalary: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this.title = title;
    this.updatedAt = updatedAt;
  }

  static create(
    id: string,
    title: string,
    code: string,
    departmentId: string,
    level: number,
    minSalary: number,
    maxSalary: number,
  ): Result<Position> {
    if (!title || title.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'Position title is required'));
    }
    if (minSalary < 0 || maxSalary < 0) {
      return Err(AppErr('VALIDATION', 'Salary bounds must be non-negative'));
    }
    if (minSalary > maxSalary) {
      return Err(AppErr('VALIDATION', 'minSalary cannot exceed maxSalary'));
    }
    const now = _time.now();
    const pos = new Position(id, title, code, departmentId, level, minSalary, maxSalary, true, now, now);
    pos.addDomainEvent(new PositionCreatedEvent(id, title, code, now));
    return Ok(pos);
  }

  rename(newName: string): Result<void> {
    if (typeof newName !== 'string' || newName.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'Position title must be a non-empty string'));
    }
    if (newName === this.title) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'New title is identical to current title'));
    }
    const oldTitle = this.title;
    this.title = newName;
    this.updatedAt = _time.now();
    this.addDomainEvent(new PositionRenamedEvent(this.id, oldTitle, newName));
    return Ok<void>();
  }
}
