/**
 * @module tenant-id.vo
 * @description Identity value object for the multi-tenant boundary. Wraps the
 * per-tenant identifier carried in the JWT `tenant_id` claim and propagated
 * through `tenantContext` (see `@common/context/tenant-context`).
 *
 * Semantics:
 *   - A `TenantId` represents *which organization owns this row*. Every
 *     tenant-scoped table (see ADR `docs/multi-tenancy-decision.md`) carries
 *     a `tenant_id` column; every query against such a table MUST filter by
 *     the active tenant.
 *   - The VO accepts both `string` (UUID, the canonical SaaS-future form)
 *     and `number` (legacy integer-tenant compatibility, matching the HR
 *     module's existing `shared/db/tenant-context.ts`). Internally it
 *     stores the value as a non-empty string — UUIDs pass through unchanged,
 *     integers stringify.
 *   - Equality is by string value (case-insensitive for UUIDs, exact for
 *     integers stringified).
 *
 * Use `TenantId.create(raw)` at the boundary (JWT claim parser, controller
 * `@Param`, repository hydration) and pass the VO through the domain layer.
 * Repositories convert back to the raw column type via `getValue()`.
 */
import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

export class TenantId {
  private constructor(public readonly value: string) {}

  /**
   * Validate raw input and wrap as a TenantId.
   *
   * Accepts:
   *   - non-empty string (UUID or any opaque tenant identifier)
   *   - finite positive integer (legacy compatibility; stringified)
   *
   * Rejects:
   *   - empty string, whitespace-only string
   *   - `NaN`, `Infinity`, `-Infinity`
   *   - zero or negative numbers
   *   - non-string / non-number inputs
   *
   * @param raw - string (UUID, JWT claim) or number (legacy integer tenant)
   * @returns Ok(TenantId) on valid input; Err(VALIDATION) otherwise
   */
  static create(raw: string | number): Result<TenantId, AppError> {
    if (typeof raw === 'number') {
      if (!Number.isFinite(raw) || raw <= 0) {
        return Err(AppErr('VALIDATION', `Invalid TenantId: ${raw}`));
      }
      return Ok(new TenantId(String(raw)));
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.length === 0) {
        return Err(AppErr('VALIDATION', `Invalid TenantId: empty string`));
      }
      return Ok(new TenantId(trimmed));
    }
    return Err(AppErr('VALIDATION', `Invalid TenantId: ${String(raw)}`));
  }

  /**
   * Escape hatch for callers that already validated upstream (e.g. repository
   * hydration from trusted DB rows, async-context bootstrap from a verified
   * JWT). Skips validation; use sparingly.
   */
  static fromRaw(value: string): TenantId {
    return new TenantId(value);
  }

  /**
   * Structural equality by string value. Two `TenantId`s are equal iff their
   * underlying values are the same (case-sensitive — callers normalize UUID
   * casing upstream if needed).
   */
  equals(other: TenantId): boolean {
    return other instanceof TenantId && this.value === other.value;
  }

  /**
   * Accessor for the raw string value. Use this when handing the tenant id
   * to a Drizzle `eq(...)` predicate or to `tenantContext.run(...)`.
   */
  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
