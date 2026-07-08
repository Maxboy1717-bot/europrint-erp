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
import { auditLogs as auditLogsTable } from '@shared/db/schema-rbac';
import { randomUUID } from 'crypto';

const SKIP_METHODS = ['GET'];

const SENSITIVE_KEYS = new Set([
  'token', 'accessToken', 'refreshToken',
  'access_token', 'refresh_token',
  'password', 'oldPassword', 'newPassword', 'secret',
]);

// WHY: salary/razryad/reject DTO'lari sabab-matnini turli kalitlarda yuboradi.
// Audit-log uchun shu kalitlardan birinchi topilgani 'reason' ustuniga yoziladi
// (placeholder 'success • PATCH undefined' o'rniga real foydalanuvchi sababi).
// Exported (VISION-3340 #24) so controllers/repos that need to REQUIRE or THREAD a
// caller-supplied reason (sensitive karta-field edits) reuse this exact list instead
// of hardcoding a second copy that could drift from what this interceptor extracts.
export const REASON_KEYS = ['reason', 'justification', 'comment', 'note', 'description'] as const;

function extractReason(body: Record<string, unknown>): string | null {
  for (const k of REASON_KEYS) {
    const v = body[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim().slice(0, 2000);
  }
  return null;
}

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
    const rawPath     = (request.path as string | undefined)
                        ?? (request.originalUrl as string | undefined)
                        ?? (request.url as string | undefined)
                        ?? 'unknown';
    const endpoint    = httpMethod + ' ' + rawPath;
    const deviceInfo  = (request.headers?.['user-agent'] as string | undefined) ?? 'unknown';
    const ipAddress   = ((request.headers?.['x-forwarded-for'] as string | undefined) ?? request.ip as string | undefined ?? 'unknown').split(',')[0].trim();
    const timestamp   = Date.now();
    const requestBody = redact(request.body);
    const userReason  = extractReason(requestBody);

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
          // WHY: real DTO sababi bo'lsa shu yoziladi; bo'lmasa eski placeholder
          // (audit-log hech qachon bo'sh qolmasin, lekin sabab bor bo'lsa = haqiqiy).
          reason:        userReason ?? `${result} • ${endpoint}`,
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
