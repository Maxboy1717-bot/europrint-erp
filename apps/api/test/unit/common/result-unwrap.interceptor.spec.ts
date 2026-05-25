/**
 * test/unit/common/result-unwrap.interceptor.spec.ts
 *
 * Unit tests for ResultUnwrapInterceptor. Verifies that Tip A (isSuccess) and
 * Tip B (isOk/isErr) Result objects are unwrapped, that failures raise
 * InternalServerErrorException, and that plain values pass through untouched.
 */

import { CallHandler, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResultUnwrapInterceptor } from '../../../src/common/interceptors/result-unwrap.interceptor';

interface TipASuccess {
  isSuccess: true;
  isFailure: false;
  value: unknown;
}
interface TipAFailure {
  isSuccess: false;
  isFailure: true;
  error: string;
}
interface TipBSuccess {
  isOk: () => true;
  isErr: () => false;
  value: unknown;
}
interface TipBFailure {
  isOk: () => false;
  isErr: () => true;
  error: string;
}

const ctx = {
  switchToHttp: () => ({ getRequest: () => ({}) }),
} as unknown as ExecutionContext;

function handler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('ResultUnwrapInterceptor', () => {
  const interceptor = new ResultUnwrapInterceptor();

  it('unwraps the value when Tip A Result.isSuccess is true', async () => {
    const payload: TipASuccess = { isSuccess: true, isFailure: false, value: { id: 1, name: 'A' } };
    const out = await firstValueFrom(interceptor.intercept(ctx, handler(payload)));
    expect(out).toEqual({ id: 1, name: 'A' });
  });

  it('throws InternalServerErrorException when Tip A Result.isFailure is true', async () => {
    const payload: TipAFailure = {
      isSuccess: false,
      isFailure: true,
      error: 'Tip A xato',
    };
    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler(payload))),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('unwraps the value when Tip B Result.isOk() returns true', async () => {
    const payload: TipBSuccess = {
      isOk: () => true,
      isErr: () => false,
      value: [1, 2, 3],
    };
    const out = await firstValueFrom(interceptor.intercept(ctx, handler(payload)));
    expect(out).toEqual([1, 2, 3]);
  });

  it('throws InternalServerErrorException when Tip B Result.isOk() returns false', async () => {
    const payload: TipBFailure = {
      isOk: () => false,
      isErr: () => true,
      error: 'Tip B xato',
    };
    await expect(
      firstValueFrom(interceptor.intercept(ctx, handler(payload))),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('returns the raw value when payload is not a Result type', async () => {
    const payload = { id: 99, plain: true };
    const out = await firstValueFrom(interceptor.intercept(ctx, handler(payload)));
    expect(out).toEqual({ id: 99, plain: true });
  });

  it('returns null when Tip A Result.isSuccess is true but value is undefined', async () => {
    const payload = { isSuccess: true, isFailure: false } as TipASuccess;
    const out = await firstValueFrom(interceptor.intercept(ctx, handler(payload)));
    expect(out).toBeNull();
  });

  it('passes through primitive values unchanged', async () => {
    const out = await firstValueFrom(interceptor.intercept(ctx, handler(42)));
    expect(out).toBe(42);
  });
});
