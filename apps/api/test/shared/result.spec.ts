/**
 * test/shared/result.spec.ts
 *
 * Result pattern unit tests for @common/result — the discriminated-union
 * variant with Ok/Err/isOk/isErr/AppErr/safeCall used across the codebase.
 */

import {
  Ok,
  Err,
  isOk,
  isErr,
  AppErr,
  safeCall,
  Result,
  AppError,
} from '../../src/common/result';

import {
  assertOk,
  unwrapOrThrow,
  unwrapOrBadRequest,
  unwrapOrNotFound,
  unwrapOrDefault,
  unwrapOrNotFoundDefined,
} from '../../src/common/http-result';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('Result pattern — Ok/Err constructors', () => {
  it('Ok() wraps a value and reports ok=true', () => {
    const r = Ok(42);
    expect(r.ok).toBe(true);
    expect(r.data).toBe(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
  });

  it('Ok() preserves null/undefined/0/empty-string literals exactly', () => {
    expect(Ok(0).data).toBe(0);
    expect(Ok('').data).toBe('');
    expect(Ok(null).data).toBe(null);
    expect(Ok(undefined).data).toBeUndefined();
    expect(Ok(false).data).toBe(false);
  });

  it('Ok([]) preserves empty array', () => {
    const r = Ok<unknown[]>([]);
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.data)).toBe(true);
    expect((r.data as unknown[]).length).toBe(0);
  });

  it('Ok() with object preserves identity', () => {
    const obj = { a: 1, b: { c: 2 } };
    expect(Ok(obj).data).toBe(obj);
  });

  it('Err(string) wraps message into AppError with default INTERNAL code', () => {
    const r = Err('something broke');
    expect(r.ok).toBe(false);
    expect(isErr(r)).toBe(true);
    expect((r.error as AppError).message).toBe('something broke');
    expect((r.error as AppError).code).toBe('INTERNAL');
  });

  it('Err(AppError) preserves code and message verbatim', () => {
    const r = Err(AppErr('NOT_FOUND', 'user 42 not found', { id: 42 }));
    expect(r.ok).toBe(false);
    expect((r.error as AppError).code).toBe('NOT_FOUND');
    expect((r.error as AppError).message).toBe('user 42 not found');
    expect((r.error as AppError).details).toEqual({ id: 42 });
  });

  it('AppErr() constructs a typed AppError', () => {
    const e = AppErr('VALIDATION', 'bad field');
    expect(e.code).toBe('VALIDATION');
    expect(e.message).toBe('bad field');
    expect(e.details).toBeUndefined();
  });
});

describe('Result type narrowing', () => {
  it('isOk narrows TS type to success branch', () => {
    const r: Result<number> = Ok(5);
    if (isOk(r)) {
      // type-level: r.data must be number, not undefined
      const n: number = r.data;
      expect(n).toBe(5);
    } else {
      throw new Error('unreachable');
    }
  });

  it('isErr narrows TS type to failure branch', () => {
    const r: Result<number> = Err('boom');
    if (isErr(r)) {
      const err: AppError = r.error as AppError;
      expect(err.message).toBe('boom');
    } else {
      throw new Error('unreachable');
    }
  });
});

describe('safeCall()', () => {
  it('returns Ok when the inner promise resolves', async () => {
    const r = await safeCall(async () => 'hello');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('hello');
  });

  it('returns Err with default EXTERNAL_SERVICE code when inner promise throws', async () => {
    const r = await safeCall(async () => {
      throw new Error('network down');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect((r.error as AppError).code).toBe('EXTERNAL_SERVICE');
      expect((r.error as AppError).message).toContain('network down');
    }
  });

  it('honors caller-supplied error code', async () => {
    const r = await safeCall(async () => {
      throw new Error('bad arg');
    }, 'VALIDATION');
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r.error as AppError).code).toBe('VALIDATION');
  });

  it('maps NestJS BadRequestException → BAD_REQUEST', async () => {
    const r = await safeCall(async () => {
      throw new BadRequestException('bad input');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r.error as AppError).code).toBe('BAD_REQUEST');
  });

  it('maps NestJS NotFoundException → NOT_FOUND', async () => {
    const r = await safeCall(async () => {
      throw new NotFoundException('missing');
    });
    if (!r.ok) expect((r.error as AppError).code).toBe('NOT_FOUND');
  });

  it('maps NestJS ConflictException → CONFLICT', async () => {
    const r = await safeCall(async () => {
      throw new ConflictException('dup');
    });
    if (!r.ok) expect((r.error as AppError).code).toBe('CONFLICT');
  });

  it('maps NestJS UnauthorizedException → UNAUTHORIZED', async () => {
    const r = await safeCall(async () => {
      throw new UnauthorizedException('no auth');
    });
    if (!r.ok) expect((r.error as AppError).code).toBe('UNAUTHORIZED');
  });

  it('maps NestJS ForbiddenException → FORBIDDEN', async () => {
    const r = await safeCall(async () => {
      throw new ForbiddenException('no perms');
    });
    if (!r.ok) expect((r.error as AppError).code).toBe('FORBIDDEN');
  });

  it('maps UnprocessableEntityException → BUSINESS_RULE_VIOLATION', async () => {
    const r = await safeCall(async () => {
      throw new UnprocessableEntityException('rule');
    });
    if (!r.ok) expect((r.error as AppError).code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('handles non-Error throws (string, number)', async () => {
    const r1 = await safeCall(async () => {
      throw 'plain string';
    });
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect((r1.error as AppError).message).toBe('plain string');

    const r2 = await safeCall(async () => {
      throw 42;
    });
    expect(r2.ok).toBe(false);
  });
});

describe('http-result: throw-from-error mapping', () => {
  it('unwrapOrThrow returns data on Ok', () => {
    expect(unwrapOrThrow(Ok('hello'))).toBe('hello');
  });

  it('unwrapOrThrow throws NotFoundException for NOT_FOUND', () => {
    expect(() => unwrapOrThrow(Err(AppErr('NOT_FOUND', 'gone')))).toThrow(NotFoundException);
  });

  it('unwrapOrThrow throws ConflictException for CONFLICT', () => {
    expect(() => unwrapOrThrow(Err(AppErr('CONFLICT', 'dup')))).toThrow(ConflictException);
  });

  it('unwrapOrThrow throws BadRequestException for VALIDATION', () => {
    expect(() => unwrapOrThrow(Err(AppErr('VALIDATION', 'bad')))).toThrow(BadRequestException);
  });

  it('unwrapOrThrow throws BadRequestException for BAD_REQUEST', () => {
    expect(() => unwrapOrThrow(Err(AppErr('BAD_REQUEST', 'bad')))).toThrow(BadRequestException);
  });

  it('unwrapOrThrow throws UnauthorizedException for UNAUTHORIZED', () => {
    expect(() => unwrapOrThrow(Err(AppErr('UNAUTHORIZED', '')))).toThrow(UnauthorizedException);
  });

  it('unwrapOrThrow throws ForbiddenException for FORBIDDEN', () => {
    expect(() => unwrapOrThrow(Err(AppErr('FORBIDDEN', '')))).toThrow(ForbiddenException);
  });

  it('unwrapOrThrow throws ConflictException for INVALID_TRANSITION', () => {
    expect(() => unwrapOrThrow(Err(AppErr('INVALID_TRANSITION', 'cant')))).toThrow(ConflictException);
  });

  it('unwrapOrThrow throws UnprocessableEntityException for BUSINESS_RULE_VIOLATION', () => {
    expect(() => unwrapOrThrow(Err(AppErr('BUSINESS_RULE_VIOLATION', 'rule')))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('unwrapOrThrow falls back to InternalServerErrorException for unknown codes', () => {
    expect(() => unwrapOrThrow(Err(AppErr('DB_ERROR', 'broken')))).toThrow(
      InternalServerErrorException,
    );
  });

  it('assertOk is a no-op on Ok', () => {
    expect(() => assertOk(Ok(undefined))).not.toThrow();
  });

  it('assertOk throws appropriately on Err', () => {
    expect(() => assertOk(Err(AppErr('NOT_FOUND', 'x')))).toThrow(NotFoundException);
  });

  it('unwrapOrBadRequest converts any Err into 400', () => {
    expect(() => unwrapOrBadRequest(Err(AppErr('NOT_FOUND', 'gone')))).toThrow(BadRequestException);
  });

  it('unwrapOrNotFound converts any Err into 404', () => {
    expect(() => unwrapOrNotFound(Err(AppErr('VALIDATION', 'bad')))).toThrow(NotFoundException);
  });

  it('unwrapOrDefault returns fallback on Err without throwing', () => {
    expect(unwrapOrDefault(Err('boom'), 'fallback')).toBe('fallback');
    expect(unwrapOrDefault(Ok('value'), 'fallback')).toBe('value');
  });

  it('unwrapOrNotFoundDefined throws when data is null even if ok=true', () => {
    expect(() => unwrapOrNotFoundDefined(Ok<string | null>(null))).toThrow(NotFoundException);
  });

  it('unwrapOrNotFoundDefined returns data when defined', () => {
    expect(unwrapOrNotFoundDefined(Ok<string | null>('hi'))).toBe('hi');
  });
});

describe('safeCall edge cases', () => {
  it('synchronous throw inside async fn is still caught', async () => {
    const r = await safeCall(async () => {
      JSON.parse('{not-json'); // throws SyntaxError synchronously
      return 'never';
    });
    expect(r.ok).toBe(false);
  });

  it('empty resolved value (undefined) still returns Ok', async () => {
    const r = await safeCall<void>(async () => {
      /* returns undefined */
    });
    expect(r.ok).toBe(true);
  });
});
