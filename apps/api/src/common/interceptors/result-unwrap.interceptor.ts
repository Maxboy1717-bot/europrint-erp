import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * TIP A — shared/domain/result.ts:
 *   Result<T> klassi: { isSuccess: boolean, isFailure: boolean, value?, error? }
 *
 * TIP B — @common/result (shared/result/index.ts):
 *   Success<T>: { value: T, isOk(): true, isErr(): false }
 *   Failure:    { error: string, isOk(): false, isErr(): true }
 *
 * Ikki tip ham interceptorda tanilishi kerak.
 */

/** Tip A tekshiruvi */
function isTipA(val: unknown): val is {
  isSuccess: boolean;
  isFailure: boolean;
  value?: unknown;
  error?: string;
} {
  if (val === null || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return typeof o['isSuccess'] === 'boolean' && typeof o['isFailure'] === 'boolean';
}

/** Tip B tekshiruvi — Success<T> yoki Failure */
function isTipB(val: unknown): val is { isOk(): boolean; value?: unknown; error?: string } {
  if (val === null || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return typeof o['isOk'] === 'function' && typeof o['isErr'] === 'function';
}

/**
 * ResultUnwrapInterceptor — Global NestJS interceptor.
 *
 * Muammo:
 *   Controller → service Result<T> (Tip A yoki B) qaytaradi
 *   Frontend: { isSuccess: true, value: [...] } yoki { value: [...], isOk: fn }
 *   Frontend: (data ?? []).map(...) → TypeError!
 *
 * Yechim — Ikki tip ham unwrap qilinadi:
 *   Tip A: isSuccess === true  → value  |  isSuccess === false → 500
 *   Tip B: isOk() === true     → value  |  isOk() === false    → 500
 *   Oddiy qiymat → o'zgartirmaydi
 *
 * Ro'yxatdan o'tkazish: app.module.ts APP_INTERCEPTOR (AuditInterceptor DAN KEYIN)
 */
@Injectable()
export class ResultUnwrapInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((val: unknown) => {
        // ── Tip A: shared/domain/result.ts ──────────────────────
        if (isTipA(val)) {
          if (val.isSuccess) return val.value ?? null;
          throw new InternalServerErrorException(val.error ?? 'Service xatosi (Result.fail)');
        }

        // ── Tip B: @common/result — Success<T> | Failure ────────
        if (isTipB(val)) {
          if (val.isOk()) return val.value ?? null;
          throw new InternalServerErrorException(
            (val as { error?: string }).error ?? 'Service xatosi (Failure)',
          );
        }

        return val;
      }),
    );
  }
}
