/**
 * @module http-result
 * @description Bridge between the Result pattern and NestJS HTTP responses.
 * Controllers should never `if (!r.ok) throw new ...` by hand — they invoke
 * one of these helpers, which map `AppErrorCode` to the appropriate HTTP
 * exception class and let the global exception filter render the response.
 *
 * Helper choice cheatsheet:
 *  - `unwrapOrThrow(r)` — return data, or throw mapped exception (404/409/422/…)
 *  - `unwrapOrBadRequest(r)` — return data, or 400
 *  - `unwrapOrNotFound(r)` — return data, or 404
 *  - `unwrapOrNotFoundDefined(r)` — like NotFound but also throws if data is null
 *  - `unwrapOrInternal(r)` — code-aware; falls back to 500
 *  - `unwrapOrDefault(r, fallback)` — never throws; returns fallback on Err
 *  - `unwrapOrWarn(r, log, fallback)` — never throws; logs then returns fallback
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isOk, Result, AppError } from './result';

/**
 * Translates an AppError to the matching NestJS HttpException and throws.
 * @param error - typed domain error
 * @throws NotFoundException for NOT_FOUND
 * @throws ConflictException for CONFLICT / INVALID_TRANSITION
 * @throws BadRequestException for VALIDATION / BAD_REQUEST
 * @throws ForbiddenException for FORBIDDEN
 * @throws UnauthorizedException for UNAUTHORIZED
 * @throws UnprocessableEntityException for BUSINESS_RULE_VIOLATION
 * @throws HttpException(402) for PAYMENT_REQUIRED
 * @throws InternalServerErrorException for any other code
 * @returns never — this function always throws
 */
export function throwFromError(error: AppError): never {
  const msg = error.message ?? 'Unknown error';
  switch (error.code) {
    case 'NOT_FOUND':
      throw new NotFoundException(msg);
    case 'CONFLICT':
      throw new ConflictException(msg);
    case 'VALIDATION':
    case 'BAD_REQUEST':
      throw new BadRequestException(msg);
    case 'FORBIDDEN':
      throw new ForbiddenException(msg);
    case 'UNAUTHORIZED':
      throw new UnauthorizedException(msg);
    case 'INVALID_TRANSITION':
      throw new ConflictException(msg);
    case 'PAYMENT_REQUIRED':
      throw new HttpException(msg, HttpStatus.PAYMENT_REQUIRED);
    case 'BUSINESS_RULE_VIOLATION':
      throw new UnprocessableEntityException(msg);
    case 'NOT_IMPLEMENTED':
      throw new HttpException(msg, HttpStatus.NOT_IMPLEMENTED);
    default:
      throw new InternalServerErrorException(msg);
  }
}

/**
 * Throws if the Result is a failure; otherwise no-op. Use when the value is
 * not needed (fire-and-forget mutations).
 * @param r - Result to check
 * @throws mapped NestJS HttpException — see {@link throwFromError}
 */
export function assertOk<T>(r: Result<T>): void {
  if (!r.ok) throwFromError(r.error);
}

/**
 * Returns Result data on success; throws an HTTP-mapped exception otherwise.
 * Idiomatic controller call: `return unwrapOrThrow(await this.service.find(id))`.
 * @param r - Result to unwrap
 * @returns the success payload
 * @throws mapped NestJS HttpException — see {@link throwFromError}
 */
export function unwrapOrThrow<T>(r: Result<T>): T {
  if (isOk(r)) return r.data;
  throwFromError(r.error);
}

/**
 * Unwraps a Result, forcing every failure to surface as HTTP 400.
 * Use only when ALL upstream errors are user-input issues; prefer
 * {@link unwrapOrThrow} for general use.
 * @throws BadRequestException on any Err
 */
export function unwrapOrBadRequest<T>(r: Result<T>): T {
  if (isOk(r)) return r.data;
  const msg = typeof r.error === 'string' ? r.error : r.error?.message ?? 'Request failed';
  throw new BadRequestException(msg);
}

/**
 * Unwraps a Result, forcing every failure to surface as HTTP 404.
 * Use on GET-by-id routes where any error means "no such resource".
 * @throws NotFoundException on any Err
 */
export function unwrapOrNotFound<T>(r: Result<T>): T {
  if (isOk(r)) return r.data;
  const msg = typeof r.error === 'string' ? r.error : r.error?.message ?? 'Not found';
  throw new NotFoundException(msg);
}

function _isResultShape(val: unknown): val is Result<unknown> {
  return (
    val !== null &&
    val !== undefined &&
    typeof val === 'object' &&
    'ok' in (val as object) &&
    typeof (val as Record<string, unknown>)['ok'] === 'boolean'
  );
}

/**
 * Like {@link unwrapOrNotFound} but also throws when `data` is null/undefined
 * even on `ok=true`. Use on GET-by-id where the repo returns Ok(null) for
 * "no row" rather than Err('NOT_FOUND').
 * @param r - Result whose payload may be null
 * @param msg - optional override for the 404 message
 * @returns the non-null success payload
 * @throws NotFoundException
 */
export function unwrapOrNotFoundDefined<T>(r: Result<T | null | undefined>, msg?: string): T {
  if (r.ok && r.data != null) return r.data as T;
  const errMsg = msg ?? (r.ok ? 'Not found' : (typeof r.error === 'string' ? r.error : (r.error as AppError)?.message ?? 'Not found'));
  throw new NotFoundException(errMsg);
}

/**
 * Returns data on success, or logs the error and returns fallback on failure.
 * Never throws — use for non-critical paths (analytics, dashboards) where a
 * downstream failure should degrade gracefully.
 * @param r - Result to unwrap
 * @param onError - callback invoked with the AppError before fallback returns
 * @param fallback - value returned when r is an Err
 */
export function unwrapOrWarn<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
  fallback: T,
): T {
  if (r.ok) return r.data;
  onError(r.error as AppError);
  return fallback;
}

/**
 * Returns data on success, or fallback on failure. Never throws, never logs.
 * Use when a missing value is genuinely OK (empty filters, optional lookups).
 * @param r - Result to unwrap
 * @param fallback - value returned when r is an Err
 */
export function unwrapOrDefault<T>(r: Result<T>, fallback: T): T {
  return r.ok ? r.data : fallback;
}

/**
 * Logs the error then throws the matching HTTP exception. Use when an Err
 * is unexpected (programmer error, broken invariant) and should be loud.
 * @param r - Result to assert
 * @param onError - logger callback invoked before the throw
 * @throws mapped NestJS HttpException
 */
export function assertOkLog<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
): void {
  if (r.ok) return;
  onError(r.error as AppError);
  throwFromError(r.error as AppError);
}

/**
 * Logs the error then throws a caller-supplied exception. Use when the
 * surface error should be domain-specific rather than the generic mapping.
 * @param r - Result to assert
 * @param onError - logger callback
 * @param ex - exception to throw on Err
 */
export function assertOkOrThrow<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
  ex: Error,
): void {
  if (r.ok) return;
  onError(r.error as AppError);
  throw ex;
}

/**
 * Tolerant unwrap that accepts either a Result-shaped object or a raw value.
 * On Err, maps the code to an HTTP exception just like {@link unwrapOrThrow}
 * but defaults to InternalServerErrorException for unknown codes.
 *
 * WHY: legacy callers sometimes return Result<T>, sometimes return T directly;
 * this helper lets controllers stay tidy without trampoline conditionals.
 *
 * @param r - either a Result<T> or a plain T
 * @returns success payload
 * @throws mapped NestJS HttpException
 */
export function unwrapOrInternal<T>(r: Result<T> | T): T {
  if (_isResultShape(r)) {
    const result = r as Result<T>;
    if (result.ok) return result.data;
    const msg =
      typeof result.error === 'string'
        ? result.error
        : (result.error as AppError)?.message ?? 'Internal error';
    switch ((result.error as AppError)?.code) {
      case 'NOT_FOUND':
        throw new NotFoundException(msg);
      case 'CONFLICT':
        throw new ConflictException(msg);
      case 'VALIDATION':
      case 'BAD_REQUEST':
        throw new BadRequestException(msg);
      case 'UNAUTHORIZED':
        throw new UnauthorizedException(msg);
      case 'FORBIDDEN':
        throw new ForbiddenException(msg);
      default:
        throw new InternalServerErrorException(msg);
    }
  }
  return r as T;
}
