/**
 * @module i-acl-translator
 * @description Anti-Corruption Layer contract. Legacy modules (compatibility/,
 * remaining/, general/) must NOT leak legacy data shapes into new domain
 * aggregates. Implement IAclTranslator<LegacyShape, DomainShape> per concern
 * and place under <legacy-module>/acl/ as a thin adapter:
 *
 *   - toDomain(legacy): Result<Domain>  — map legacy row to validated domain DTO/aggregate
 *   - toLegacy(domain): LegacyShape       — used only by legacy controllers that
 *                                            still serve old API contracts
 *
 * Goal: zero raw SQL in legacy controllers. Repository + ACL pair replaces it.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 * @see docs/ddd-deep-audit-strategic.md Step 4 — ACL gap finding
 */

import type { Result } from '@common/result';

/**
 * Generic translator contract. Both directions must be pure functions —
 * no I/O, no DB calls, no `Date.now()`. Failures in `toDomain` are encoded
 * as `Result.err`; `toLegacy` is total (no failure path) because the domain
 * type is already validated.
 *
 * @template TLegacy - raw row shape from a pre-Drizzle / un-migrated table
 *                     (typically `Record<string, unknown>` widened by the SQL helper)
 * @template TDomain - validated domain DTO or aggregate accepted by new code
 */
export interface IAclTranslator<TLegacy, TDomain> {
  /** Validate + map a legacy row to its domain counterpart. */
  toDomain(legacy: TLegacy): Result<TDomain>;
  /** Reverse-map a domain instance to the legacy row shape for old API consumers. */
  toLegacy(domain: TDomain): TLegacy;
}
