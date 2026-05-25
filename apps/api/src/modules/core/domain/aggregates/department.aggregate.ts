/**
 * @module department.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
import { Ok, Err, AppErr, Result } from '@common/result';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { DepartmentCreatedEvent, DepartmentRenamedEvent } from '../events';

const _time = new TashkentTimeService();

export class Department extends AggregateRoot {
  public name: string;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    name: string,
    public readonly code: string,
    public readonly headId: string | null,
    public readonly parentId: string | null,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this.name = name;
    this.updatedAt = updatedAt;
  }

  static create(
    id: string,
    name: string,
    code: string,
    headId: string | null = null,
    parentId: string | null = null,
    description: string | null = null,
  ): Department {
    const now = _time.now();
    const dept = new Department(id, name, code, headId, parentId, description, true, now, now);
    dept.addDomainEvent(new DepartmentCreatedEvent(id, name, code, now));
    return dept;
  }

  rename(newName: string): Result<void> {
    if (typeof newName !== 'string' || newName.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'Department name must be a non-empty string'));
    }
    if (newName === this.name) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'New name is identical to current name'));
    }
    const oldName = this.name;
    this.name = newName;
    this.updatedAt = _time.now();
    this.addDomainEvent(new DepartmentRenamedEvent(this.id, oldName, newName));
    return Ok<void>();
  }
}
