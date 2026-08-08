/**
 * @module current-tenant-filter.decorator
 * @description Param decorator. Surfaces the per-request tenant filter that
 *   `TenantFilterGuard` attached to `request.tenantFilter`.
 *
 *   Value semantics (set by TenantFilterGuard.canActivate):
 *     - `number` → scope tenant-owned queries to this tenant id.
 *     - `null`   → admin bypass (super_admin/admin/director): all tenants.
 *
 *   Usage:
 *
 *       @Get()
 *       async list(@CurrentTenantFilter() tenant: number | null) {
 *         // tenant === null → no WHERE tenant_id (admin); else scope to it.
 *         return this.svc.findAll({ tenantId: tenant });
 *       }
 *
 *   Returns `undefined` when `TenantFilterGuard` did not run on the route
 *   (the guard is opt-in per A93 — see tenant-filter.guard.ts wiring notes),
 *   so callers must treat `undefined` distinctly from `null` (bypass).
 *
 * @see apps/api/src/common/guards/tenant-filter.guard.ts — sets request.tenantFilter
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithTenantFilter } from '../guards/tenant-filter.guard';

export const CurrentTenantFilter = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | null | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenantFilter>();
    return request.tenantFilter;
  },
);
