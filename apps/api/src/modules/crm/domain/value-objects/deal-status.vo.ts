import { ValueObject } from '@shared/domain/value-object.base';
import { Result, Ok, Err } from '@common/types/result.type';

export type DealStatusType = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export class DealStatus extends ValueObject<DealStatusType> {
  private constructor(value: DealStatusType) {
    super(value);
  }

  static create(value: string): Result<DealStatus> {
    const validStatuses: DealStatusType[] = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStatuses.includes(value as DealStatusType)) {
      return Err(`Invalid deal status: ${value}`);
    }
    return Ok(new DealStatus(value as DealStatusType));
  }

  getValue(): DealStatusType {
    return this.value;
  }

  equals(other: DealStatus): boolean {
    return this.value === other.value;
  }
}
