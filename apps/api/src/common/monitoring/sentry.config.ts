/**
 * @module sentry.config
 * @description Sentry SDK initialization + global NestJS interceptor.
 *
 * Graceful degradation contract (matches AishaConfig):
 *   If `SENTRY_DSN` is not set, init is skipped and only a `warn` log is emitted.
 *   The app must still boot — Sentry is OPTIONAL.
 *
 * Env vars consumed:
 *   SENTRY_DSN          — Project DSN from sentry.io (REQUIRED to enable)
 *   SENTRY_ENVIRONMENT  — tag attached to every event (default: NODE_ENV)
 *   SENTRY_RELEASE      — release identifier for source-map / regression tracking
 *   NODE_ENV            — controls tracesSampleRate (production = 0.1, else 1.0)
 *
 * Filtering: 401 / 403 / 404 HTTP errors are dropped in `beforeSend` so auth /
 * not-found noise never reaches Sentry quotas.
 */

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const IGNORED_HTTP_STATUSES = new Set([401, 403, 404]);

let sentryInitialized = false;
const bootstrapLogger = new Logger('SentryInit');

/**
 * Initialise the Sentry SDK exactly once.
 *
 * Safe to call before `NestFactory.create()` — does not require any Nest DI.
 * If `SENTRY_DSN` is empty, logs a warning and returns false.
 */
export function initSentry(): boolean {
  if (sentryInitialized) return true;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    bootstrapLogger.warn(
      'SENTRY_DSN not set — error monitoring is DISABLED (graceful degradation). ' +
        'Set SENTRY_DSN in /etc/europrint.env to enable.',
    );
    return false;
  }

  const environment =
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.NODE_ENV?.trim() ||
    'development';
  const release = process.env.SENTRY_RELEASE?.trim() || undefined;
  const isProduction = process.env.NODE_ENV === 'production';

  // Cast to NodeOptions — Sentry v9 types are still settling around dsn placement.
  const sentryOptions = {
    dsn,
    environment,
    release,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
      // Drop auth-failure noise. HttpException stores status in originalException.
      const exc = hint?.originalException;
      if (exc instanceof HttpException) {
        if (IGNORED_HTTP_STATUSES.has(exc.getStatus())) return null;
      }
      // Sentry also tags via event.contexts; fall back to HTTP response status.
      const status =
        (event.contexts?.response as { status_code?: number } | undefined)
          ?.status_code ?? undefined;
      if (typeof status === 'number' && IGNORED_HTTP_STATUSES.has(status)) {
        return null;
      }
      return event;
    },
  } as Sentry.NodeOptions;
  Sentry.init(sentryOptions);

  sentryInitialized = true;
  bootstrapLogger.log(
    `Sentry initialised (env=${environment}${release ? `, release=${release}` : ''}, ` +
      `tracesSampleRate=${isProduction ? 0.1 : 1.0})`,
  );
  return true;
}

/** True if `initSentry()` ran successfully. */
export function isSentryEnabled(): boolean {
  return sentryInitialized;
}

/**
 * Captures every thrown exception from controllers, enriches it with request
 * context (method, URL, IP, user id when available), and re-throws so NestJS's
 * `GlobalExceptionFilter` can format the HTTP response as usual.
 *
 * Wire up via `app.useGlobalInterceptors(new SentryInterceptor())` in main.ts.
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (!sentryInitialized) return throwError(() => err);

        // Drop ignored HTTP statuses before we even build the scope.
        if (err instanceof HttpException && IGNORED_HTTP_STATUSES.has(err.getStatus())) {
          return throwError(() => err);
        }

        try {
          const http = context.switchToHttp();
          const req = http.getRequest<{
            method?: string;
            url?: string;
            ip?: string;
            headers?: Record<string, string | string[] | undefined>;
            user?: { id?: number | string; sub?: number | string };
          }>();

          Sentry.withScope((scope: Sentry.Scope) => {
            scope.setTag('http.method', req?.method ?? 'unknown');
            scope.setTag('http.url', req?.url ?? 'unknown');
            const requestId = req?.headers?.['x-request-id'];
            if (typeof requestId === 'string') scope.setTag('request.id', requestId);

            const userId = req?.user?.id ?? req?.user?.sub;
            if (userId !== undefined && userId !== null) {
              scope.setUser({ id: String(userId) });
            }

            scope.setContext('request', {
              method: req?.method,
              url: req?.url,
              ip: req?.ip,
            });

            Sentry.captureException(err);
          });
        } catch (captureErr) {
          // Never let monitoring crash the request pipeline.
          bootstrapLogger.warn(
            `SentryInterceptor: capture failed: ${String(captureErr)}`,
          );
        }

        return throwError(() => err);
      }),
    );
  }
}
