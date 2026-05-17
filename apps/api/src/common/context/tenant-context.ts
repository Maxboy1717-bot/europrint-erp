/**
 * @module tenant-context
 * @description Per-request multi-tenant scope, propagated via Node's
 *   `AsyncLocalStorage`. This is the scaffolding for column-based
 *   multi-tenancy described in `docs/multi-tenancy-decision.md` (ADR-006).
 *
 *   Lifecycle:
 *     1. `TenantMiddleware` (see `@common/middleware/tenant.middleware`)
 *        reads the `tenant_id` claim from `req.user`, falling back to
 *        `DEFAULT_TENANT_ID` when absent.
 *     2. The middleware invokes `tenantContext.run({ tenantId }, next)`,
 *        scoping every downstream async hop in the request to that value.
 *     3. Anywhere in the request — controller, service, repository —
 *        `getTenantId()` returns the active id, or `null` when the request
 *        is running inside `withTenantBypass()` (cross-tenant aggregation
 *        for elevated-role endpoints).
 *
 *   Why a small module not a NestJS provider:
 *     `AsyncLocalStorage` is a process-wide singleton; wrapping it in an
 *     injectable provider forces every consumer to declare a constructor
 *     dependency, which defeats the purpose of having an implicit ambient
 *     context. Repositories in particular would otherwise leak this
 *     dependency through every layer above them.
 *
 *   Distinct from `apps/api/src/shared/db/tenant-context.ts` — that file is
 *   the existing **integer**-tenant scaffolding used by the HR module,
 *   created by migration `0016_add_tenant_id_to_hr_tables.sql`. The two
 *   coexist during the rollout (see ADR phases P2–P3); P3 unifies them
 *   onto this UUID-string form.
 *
 * @see docs/multi-tenancy-decision.md — full ADR
 * @see apps/api/src/common/middleware/tenant.middleware.ts — request wiring
 * @see apps/api/src/modules/shared/domain/value-objects/tenant-id.vo.ts — VO
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request payload carried in the async context.
 *
 * A single field today; room to grow (request id, locale, feature flags)
 * without changing the consumer API.
 */
export interface TenantContextState {
  readonly tenantId: string;
}

/**
 * Process-wide AsyncLocalStorage instance. Exported so the middleware can
 * call `.run()` and so tests can drive `.enterWith()` for setup.
 *
 * Prefer the helpers below in application / repository code; touching the
 * storage directly couples callers to the implementation detail.
 */
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

/**
 * Read the active tenant id.
 *
 * Returns `null` when:
 *   - no scope is active (cron job, seed script, test bootstrap outside a
 *     `runWithTenant(...)` block);
 *   - the request is inside `withTenantBypass(...)` (cross-tenant
 *     aggregation for elevated-role endpoints).
 *
 * Repositories interpret `null` as "no `WHERE tenant_id` filter" — see
 * ADR-006 for the elevation policy. Application code that requires a
 * tenant id (most reads) should treat `null` as a programmer error and
 * either reject the request or refuse to proceed; the reviewer script
 * `scripts/reviewer-tenant-isolation.sh` flags missing filters at PR time.
 */
export function getTenantId(): string | null {
  const state = tenantContext.getStore();
  return state?.tenantId ?? null;
}

/**
 * Convenience runner — wraps a unit of work in a tenant scope. Useful for
 * cron / queue handlers that need to act on behalf of a specific tenant
 * without going through the HTTP middleware.
 *
 * @param tenantId - tenant identifier (UUID string preferred; opaque string
 *                   accepted for legacy/integer-tenant compatibility)
 * @param fn       - synchronous or asynchronous work to run inside the scope
 * @returns whatever `fn` returns (including promises, if any)
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantContext.run({ tenantId }, fn);
}

/**
 * Elevated-role escape hatch for cross-tenant aggregation.
 *
 * Runs `fn` with the tenant context set to a state where `getTenantId()`
 * returns `null`, signalling repositories to omit the `WHERE tenant_id`
 * filter. Intended for:
 *   - CFO consolidated dashboards spanning subsidiaries;
 *   - platform-admin audit queries;
 *   - nightly aggregation / reporting jobs.
 *
 * **The caller is responsible for the role check.** This helper is a
 * mechanism, not a policy: the controller invoking it MUST be guarded
 * by an elevated role (`PLATFORM_ADMIN` or `CFO_CONSOLIDATED`).
 *
 * Implementation note: we store `{ tenantId: '' }` and treat the empty
 * string as "bypass" so consumers of `getTenantId()` still receive `null`
 * (the empty-string check happens inside the accessor — keeping the
 * `AsyncLocalStorage` payload non-nullable simplifies type narrowing
 * elsewhere). Actually we store no scope at all by running outside the
 * `run()` wrapper, so `getStore()` returns `undefined` and the accessor
 * returns `null` via its existing fallback. See the body for the trick.
 *
 * @param fn - work to run with tenant filtering disabled
 * @returns whatever `fn` returns
 */
export function withTenantBypass<T>(fn: () => T): T {
  // Running with an empty store-less scope: `AsyncLocalStorage.exit()`
  // disables the current store for the duration of the callback, so any
  // nested `getStore()` returns `undefined` and `getTenantId()` returns
  // `null` (the documented "bypass" signal). This is safer than running
  // with an explicit sentinel because no consumer can accidentally match
  // the sentinel as a real tenant id.
  return tenantContext.exit(fn);
}
