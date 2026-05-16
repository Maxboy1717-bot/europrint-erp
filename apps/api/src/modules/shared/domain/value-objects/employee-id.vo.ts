/**
 * @module employee-id.vo
 * @description Identity value object for Employee aggregate. Wraps a positive
 * integer DB primary key. Mirrors CustomerId/ProductId; the type-level
 * distinction prevents accidental cross-aggregate id mixups (e.g. passing
 * an EmployeeId where a CustomerId is expected fails at compile time).
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

export class EmployeeId {
  private constructor(public readonly value: number) {}

  /**
   * Validate raw input and wrap as an EmployeeId.
   * @param raw - number (DB PK) or numeric string (URL/route param)
   * @returns Ok(EmployeeId) on a positive integer; Err(VALIDATION) otherwise
   */
  static create(raw: number | string): Result<EmployeeId, AppError> {
    const n = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isInteger(n) || n <= 0) {
      return Err(AppErr('VALIDATION', `Invalid EmployeeId: ${raw}`));
    }
    return Ok(new EmployeeId(n));
  }

  /**
   * Escape hatch for trusted-source hydration (repository → aggregate).
   */
  static fromRaw(value: number): EmployeeId {
    return new EmployeeId(value);
  }

  equals(other: EmployeeId): boolean {
    return other instanceof EmployeeId && this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
