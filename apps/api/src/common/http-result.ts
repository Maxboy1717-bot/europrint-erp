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
    default:
      throw new InternalServerErrorException(msg);
  }
}

export function assertOk<T>(r: Result<T>): void {
  if (!r.ok) throwFromError(r.error);
}

export function unwrapOrThrow<T>(r: Result<T>): T {
  if (isOk(r)) return r.data;
  throwFromError(r.error);
}

export function unwrapOrBadRequest<T>(r: Result<T>): T {
  if (isOk(r)) return r.data;
  const msg = typeof r.error === 'string' ? r.error : r.error?.message ?? 'Request failed';
  throw new BadRequestException(msg);
}

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

/** Returns data if ok and data != null; throws NotFoundException otherwise. */
export function unwrapOrNotFoundDefined<T>(r: Result<T | null | undefined>, msg?: string): T {
  if (r.ok && r.data != null) return r.data as T;
  const errMsg = msg ?? (r.ok ? 'Not found' : (typeof r.error === 'string' ? r.error : (r.error as AppError)?.message ?? 'Not found'));
  throw new NotFoundException(errMsg);
}

/** Returns data on success, or logs and returns fallback on failure. Never throws. */
export function unwrapOrWarn<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
  fallback: T,
): T {
  if (r.ok) return r.data;
  onError(r.error as AppError);
  return fallback;
}

/** Returns data on success, or fallback on failure. Never throws. */
export function unwrapOrDefault<T>(r: Result<T>, fallback: T): T {
  return r.ok ? r.data : fallback;
}

/** Logs and throws appropriate HTTP exception (error-code-aware). */
export function assertOkLog<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
): void {
  if (r.ok) return;
  onError(r.error as AppError);
  throwFromError(r.error as AppError);
}

/** Logs and throws a specific exception. */
export function assertOkOrThrow<T>(
  r: Result<T>,
  onError: (error: AppError) => void,
  ex: Error,
): void {
  if (r.ok) return;
  onError(r.error as AppError);
  throw ex;
}

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
