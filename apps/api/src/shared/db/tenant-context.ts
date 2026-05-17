/**
 * @module tenant-context
 * @description Per-request tenant scope, propagated via AsyncLocalStorage.
 *
 *   Phase 2 / Task 2.1: every HR-owned table now carries a `tenant_id`
 *   column (migration 0016). For multi-tenant isolation, every query that
 *   touches those tables MUST filter by the caller's tenant. Threading a
 *   tenantId parameter through every service signature is invasive and
 *   easy to forget; an AsyncLocalStorage-backed context lets handlers,
 *   services, and repositories read the current tenant without changing
 *   their signatures.
 *
 *   Lifecycle:
 *     1. `TenantContextMiddleware` reads `tenantId` from the JWT payload
 *        (defaults to 1 — the "single-tenant compatibility" tenant — when
 *        the token has no claim, which matches the migration default).
 *     2. The middleware calls `tenantContext.run(tenantId, next)`, scoping
 *        every downstream async hop to that value.
 *     3. Anywhere in the request, `getTenantId()` returns the active id
 *        (or the configured default outside a request, e.g. cron jobs,
 *        seed scripts, test setup).
 *
 *   Why a small module not a NestJS provider:
 *     - AsyncLocalStorage is process-wide singleton; wrapping in a Provider
 *       would force callers to inject it, defeating the point.
 *     - Repositories at `infrastructure/repositories/*.repo.ts` would
 *       otherwise need to declare a dependency on a context service just
 *       to read the tenant — a textbook leaky abstraction.
 *
 *   Caveats:
 *     - DEFAULT_TENANT_ID = 1 mirrors the migration default. If you change
 *       one, change both.
 *     - Always invoke `tenantContext.run(...)` at the request boundary.
 *       Code paths that bypass the middleware (cron jobs, seed scripts,
 *       worker queues) MUST call `tenantContext.run(...)` themselves or
 *       accept that reads will use the default tenant.
 *
 * @see apps/api/src/shared/db/tenant-context.middleware.ts — request wiring
 * @see lib/db/drizzle/0016_add_tenant_id_to_hr_tables.sql — column source
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Sentinel tenant id used when no JWT-supplied tenant is present.
 * Matches the DEFAULT 1 set by migration 0016 so legacy rows remain
 * queryable without any code change at the call site.
 */
export const DEFAULT_TENANT_ID = 1;

/**
 * Per-request payload carried in the async context. A single field today;
 * room to grow (locale, feature flags) without changing the API.
 */
export interface TenantContextState {
  readonly tenantId: number;
}

/**
 * Process-wide AsyncLocalStorage instance. Exported so the middleware can
 * call `.run()` and so tests can drive `.enterWith()` for setup.
 *
 * Prefer the helpers below in application / repository code; touching
 * the storage directly couples callers to the implementation detail.
 */
export const tenantContext = new AsyncLocalStorage<TenantContextState>();

/**
 * Read the active tenant id. Falls back to `DEFAULT_TENANT_ID` when called
 * outside a request scope (cron, seed, test bootstrap) — the same value
 * the DEFAULT clause uses, so reads remain consistent.
 *
 * @returns active tenantId, or DEFAULT_TENANT_ID when no scope is active
 */
export function getTenantId(): number {
  const state = tenantContext.getStore();
  return state?.tenantId ?? DEFAULT_TENANT_ID;
}

/**
 * Convenience runner — wraps a unit of work in a tenant scope. Useful for
 * cron / queue handlers that need to act on behalf of a specific tenant.
 *
 * @param tenantId - integer tenant identifier (1+; matches DB column type)
 * @param fn       - async work to run inside the scope
 * @returns whatever `fn` resolves to
 */
export async function runWithTenant<T>(
  tenantId: number,
  fn: () => Promise<T>,
): Promise<T> {
  return tenantContext.run({ tenantId }, fn);
}
