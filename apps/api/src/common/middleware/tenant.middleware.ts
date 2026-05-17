/**
 * @module tenant.middleware
 * @description NestJS middleware that establishes the per-request multi-tenant
 *   async scope. Reads the `tenant_id` claim from `req.user` (which the
 *   `JwtAuthGuard` is expected to have populated upstream), falls back to
 *   `DEFAULT_TENANT_ID` when the claim is absent, and runs the remainder of
 *   the request inside `tenantContext.run({ tenantId }, next)`.
 *
 *   Wiring (NOT done in this commit — Wave 6 ships scaffolding only):
 *     - per the ADR rollout plan (`docs/multi-tenancy-decision.md`, phase P2)
 *       this middleware is opted in **per module**, not registered globally,
 *       so each module's migration to column-based tenancy can be reviewed
 *       independently. Example wiring (for future use):
 *
 *           // module.configure(consumer)
 *           consumer.apply(TenantMiddleware).forRoutes('*');
 *
 *   Order requirement:
 *     This middleware must run **after** the JWT auth guard / strategy so
 *     `req.user` is populated. In NestJS, guards execute after middleware by
 *     default, so the recommended wiring is either:
 *       (a) attach this as an interceptor (post-guard), or
 *       (b) keep it as middleware but rely on a passport strategy that
 *           parses the JWT in middleware itself (current EuroPrint setup).
 *     The existing `TenantContextInterceptor` in `shared/db/` uses pattern
 *     (a) for the legacy integer-tenant system; this file uses pattern (b)
 *     for the new UUID-tenant scaffolding. Either is correct; pick one
 *     consistently per module at opt-in time.
 *
 * @see docs/multi-tenancy-decision.md — ADR-006
 * @see apps/api/src/common/context/tenant-context.ts — the async scope
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { tenantContext } from '@common/context/tenant-context';
import { DEFAULT_TENANT_ID } from '@common/constants/business.constants';

/**
 * Minimal shape of the request object this middleware reads. Kept
 * framework-agnostic (no direct `express` / `fastify` import) because the
 * NestJS adapter normalizes both to a similar shape and we only need
 * `user` and a passthrough for `next`. The downstream HTTP-server type
 * still satisfies this interface structurally.
 *
 * Both camelCase (`tenantId`) and snake_case (`tenant_id`) are accepted
 * because the JWT claim is `tenant_id` by convention but the passport
 * strategy may rename it during deserialization.
 */
interface RequestWithUser {
  user?: {
    tenantId?: string;
    tenant_id?: string;
  };
}

/** Minimal `next` callback shape — matches both Express and Fastify. */
type NextHandler = (err?: unknown) => void;

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  /**
   * Resolve the active tenant id from the inbound request. Empty string or
   * whitespace-only claim is treated as absent (and falls back to the
   * default) so a malformed JWT cannot establish a "blank tenant" scope.
   */
  private resolveTenantId(req: RequestWithUser): string {
    const raw = req.user?.tenantId ?? req.user?.tenant_id;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.length > 0) return trimmed;
    }
    return DEFAULT_TENANT_ID;
  }

  use(req: RequestWithUser, _res: unknown, next: NextHandler): void {
    const tenantId = this.resolveTenantId(req);
    tenantContext.run({ tenantId }, () => next());
  }
}
