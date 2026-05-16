/**
 * @module customer-id.vo
 * @description Identity value object for Customer aggregate. Wraps a positive
 * integer DB primary key behind a constructor that rejects zero, negative,
 * and non-integer inputs. Use `CustomerId.create(raw)` at the boundary
 * (handlers, DTOs) and pass the VO through the domain layer.
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

export class CustomerId {
  private constructor(public readonly value: number) {}

  /**
   * Validate raw input and wrap as a CustomerId.
   * @param raw - number (DB PK) or numeric string (URL/route param)
   * @returns Ok(CustomerId) on a positive integer; Err(VALIDATION) otherwise
   */
  static create(raw: number | string): Result<CustomerId, AppError> {
    const n = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isInteger(n) || n <= 0) {
      return Err(AppErr('VALIDATION', `Invalid CustomerId: ${raw}`));
    }
    return Ok(new CustomerId(n));
  }

  /**
   * Escape hatch for callers that already validated upstream (e.g. repository
   * hydration from trusted DB rows). Skips validation; use sparingly.
   */
  static fromRaw(value: number): CustomerId {
    return new CustomerId(value);
  }

  equals(other: CustomerId): boolean {
    return other instanceof CustomerId && this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
