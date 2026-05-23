/**
 * @module audit-all.interceptor
 * @description Writes one row to `audit_log` for every controller method
 *   invocation when the controller has `@AuditAll()`. Method-level `@SkipAudit()`
 *   opts out (e.g., health checks, high-frequency reads).
 */

import {
  CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { SKIP_AUDIT_KEY } from '../decorators/audit-all.decorator';

@Injectable()
export class AuditAllInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditAllInterceptor.name);
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (skip) return next.handle();

    const req = ctx.switchToHttp().getRequest<{
      method: string; url: string; ip?: string;
      headers: Record<string, string | undefined>;
      user?: { id?: number; userId?: number };
    }>();

    const action = `${req.method} ${req.url}`;
    const controllerName = ctx.getClass().name;
    const methodName = ctx.getHandler().name;
    const userId = req.user?.id ?? req.user?.userId ?? null;
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? null;
    const userAgent = req.headers['user-agent'] ?? null;

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget — don't block the response
        db.execute(sql`
          INSERT INTO audit_log (user_id, action, controller, method, ip, user_agent, ts)
          VALUES (${userId}, ${action}, ${controllerName}, ${methodName}, ${ip}, ${userAgent}, NOW())
        `).catch((err: unknown) => {
          this.logger.warn(`Audit insert failed for ${action}: ${String(err)}`);
        });
      }),
    );
  }
}
