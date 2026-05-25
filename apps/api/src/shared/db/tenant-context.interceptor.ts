/**
 * @module tenant-context.interceptor
 * @description Wraps each request handler in an AsyncLocalStorage tenant scope.
 *
 *   Order matters: this interceptor runs AFTER guards (so `request.user` is
 *   already populated by `JwtAuthGuard`) and BEFORE the route handler, which
 *   means every downstream `await` — controllers, services, repositories —
 *   observes the correct `tenantId` via `getTenantId()`.
 *
 *   Wiring: registered globally as an APP_INTERCEPTOR in `app.module.ts`.
 *   Per-request cost: a single object allocation + AsyncLocalStorage.run().
 *
 *   Fallback policy: when `request.user.tenantId` is missing (legacy tokens,
 *   public endpoints) the interceptor uses `DEFAULT_TENANT_ID` so reads
 *   continue to hit the "tenant 1" backfill rows. This matches the DB
 *   default set by migration 0016.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of, defer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DEFAULT_TENANT_ID, tenantContext } from './tenant-context';

interface RequestWithUser {
  user?: {
    tenantId?: number;
    tenant_id?: number;
  };
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  /**
   * Extract tenantId from JWT-attached request user. Supports both camelCase
   * (`tenantId`) and snake_case (`tenant_id`) JWT claims; legacy tokens that
   * carry neither fall back to the default tenant.
   */
  private resolveTenantId(req: RequestWithUser): number {
    const raw = req.user?.tenantId ?? req.user?.tenant_id;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return Math.trunc(raw);
    }
    if (typeof raw === 'string') {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_TENANT_ID;
  }

  /**
   * Bridge AsyncLocalStorage with rxjs. `tenantContext.run` only scopes
   * synchronous work inside its callback; the trick is to subscribe to
   * `next.handle()` from inside that callback so every async hop inherits
   * the store.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const tenantId = this.resolveTenantId(req);
    return defer(() =>
      new Observable<unknown>((subscriber) => {
        tenantContext.run({ tenantId }, () => {
          next
            .handle()
            .subscribe({
              next:     (v) => subscriber.next(v),
              error:    (e) => subscriber.error(e),
              complete: () => subscriber.complete(),
            });
        });
      }),
    ).pipe(mergeMap((v) => of(v)));
  }
}
