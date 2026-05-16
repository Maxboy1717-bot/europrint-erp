/**
 * @module product-id.vo
 * @description Identity value object for Product aggregate. Wraps a positive
 * integer DB primary key. Same shape as CustomerId/EmployeeId; the distinct
 * class name keeps the type system honest across module boundaries.
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

export class ProductId {
  private constructor(public readonly value: number) {}

  /**
   * Validate raw input and wrap as a ProductId.
   * @param raw - number (DB PK) or numeric string (URL/route param)
   * @returns Ok(ProductId) on a positive integer; Err(VALIDATION) otherwise
   */
  static create(raw: number | string): Result<ProductId, AppError> {
    const n = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isInteger(n) || n <= 0) {
      return Err(AppErr('VALIDATION', `Invalid ProductId: ${raw}`));
    }
    return Ok(new ProductId(n));
  }

  /**
   * Escape hatch for trusted-source hydration (repository → aggregate).
   */
  static fromRaw(value: number): ProductId {
    return new ProductId(value);
  }

  equals(other: ProductId): boolean {
    return other instanceof ProductId && this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
