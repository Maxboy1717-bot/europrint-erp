/**
 * @module audit.interceptor
 * @description NestJS interceptor. Wraps request/response pipeline.
 */


import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { db } from '@shared/db';
import { pgTable, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

const auditLogsTable = pgTable('audit_logs', {
  id:            varchar('id').primaryKey(),
  tableName:     varchar('table_name', { length: 100 }).notNull(),
  recordId:      varchar('record_id', { length: 100 }).notNull(),
  action:        varchar('action', { length: 255 }).notNull(),
  oldValues:     jsonb('old_values'),
  newValues:     jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  reason:        text('reason'),
  userId:        varchar('user_id'),
  userFullName:  text('user_full_name'),
  userRole:      varchar('user_role', { length: 50 }),
  ipAddress:     varchar('ip_address', { length: 50 }),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});

const SKIP_METHODS = ['GET'];

const SENSITIVE_KEYS = new Set([
  'token', 'accessToken', 'refreshToken',
  'access_token', 'refresh_token',
  'password', 'oldPassword', 'newPassword', 'secret',
]);

const METHOD_TO_ACTION: Record<string, string> = {
  POST:   'CREATE',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE',
  GET:    'READ',
};

function redact(data: unknown): Record<string, unknown> {
  if (data == null || typeof data !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : v;
  }
  return out;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (SKIP_METHODS.includes(request.method as string)) return next.handle();

    const user = request['user'] as { id?: string | number; sub?: string | number; role?: string; fullName?: string } | undefined;
    const userId      = user?.id ?? user?.sub;
    const httpMethod  = request.method as string;
    const action      = METHOD_TO_ACTION[httpMethod] ?? httpMethod;
    const endpoint    = httpMethod + ' ' + (request.path as string);
    const deviceInfo  = (request.headers?.['user-agent'] as string | undefined) ?? 'unknown';
    const ipAddress   = ((request.headers?.['x-forwarded-for'] as string | undefined) ?? request.ip as string | undefined ?? 'unknown').split(',')[0].trim();
    const timestamp   = Date.now();
    const requestBody = redact(request.body);

    const controllerClass = context.getClass();
    const module: string =
      (Reflect.getMetadata('audit:table', controllerClass) as string | undefined) ??
      controllerClass.name.replace(/Controller$/, '').toLowerCase();

    const persist = async (
      result: 'success' | 'error',
      afterValue?: unknown,
    ): Promise<void> => {
      try {
        const afterObj  = redact(afterValue);
        const recordId  = afterObj?.['id']?.toString() ?? requestBody?.['id']?.toString() ?? 'unknown';

        await db.insert(auditLogsTable).values({
          id:            randomUUID(),
          userId:        userId != null ? String(userId) : undefined,
          userFullName:  user?.fullName,
          userRole:      user?.role,
          action,
          tableName:     module,
          recordId,
          oldValues:     Object.keys(requestBody).length > 0 ? { _beforeRequest: requestBody, _timestamp: timestamp, _endpoint: endpoint } : null,
          newValues:     Object.keys(afterObj).length > 0 ? afterObj : null,
          changedFields: [
            `result:${result}`,
            `action:${action}`,
            `module:${module}`,
            `ua:${deviceInfo.slice(0, 80)}`,
          ],
          reason:        `${result} • ${endpoint}`,
          ipAddress,
        });
      } catch (e) {
        // WHY: audit-log persistence failure must NEVER break the request
        // pipeline. Best-effort logging only; the request continues.
        Logger.warn(`AuditInterceptor persist failed: ${String(e)}`, 'AuditInterceptor');
      }
    };

    return next.handle().pipe(
      tap(async (data) => { await persist('success', data); }),
      catchError((err: unknown) => {
        void persist('error');
        return throwError(() => err);
      }),
    );
  }
}
