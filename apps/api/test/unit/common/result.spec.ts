/**
 * test/unit/common/result.spec.ts
 *
 * Unit tests for the Result<T, E> pattern primitives used across every
 * service / repository: Ok, Err, isOk, isErr, AppErr, safeCall, safeJsonParse.
 * Pure module — no Nest container required.
 */

import {
  Ok,
  Err,
  isOk,
  isErr,
  AppErr,
  safeCall,
  safeJsonParse,
  Result,
  AppError,
} from '../../../src/common/result';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Result pattern primitives', () => {
  it('returns success branch when Ok wraps a value', () => {
    const r: Result<number> = Ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(42);
  });

  it('preserves falsy data verbatim when Ok wraps 0 / empty string / false', () => {
    const r0: Result<number> = Ok(0);
    const rEmpty: Result<string> = Ok('');
    const rFalse: Result<boolean> = Ok(false);
    expect(r0.ok && r0.data === 0).toBe(true);
    expect(rEmpty.ok && rEmpty.data === '').toBe(true);
    expect(rFalse.ok && rFalse.data === false).toBe(true);
  });

  it('wraps a bare string as INTERNAL AppError when Err receives a string', () => {
    const r = Err('boom');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('INTERNAL');
      expect(r.error.message).toBe('boom');
    }
  });

  it('passes through an AppError object verbatim when Err receives one', () => {
    const ae: AppError = { code: 'NOT_FOUND', message: 'missing', details: { id: 7 } };
    const r = Err(ae);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toEqual(ae);
    }
  });

  it('narrows to success branch when isOk returns true', () => {
    const r: Result<string> = Ok('hello');
    if (isOk(r)) {
      // TS narrows r.data to string; compile-only check via value access
      expect(r.data.length).toBe(5);
    } else {
      throw new Error('expected isOk to be true');
    }
  });

  it('narrows to failure branch when isErr returns true', () => {
    const r: Result<string> = Err('nope');
    expect(isErr(r)).toBe(true);
    expect(isOk(r)).toBe(false);
  });

  it('produces a fully populated AppError when AppErr factory is called', () => {
    const ae = AppErr('CONFLICT', 'duplicate', { key: 'sku' });
    expect(ae.code).toBe('CONFLICT');
    expect(ae.message).toBe('duplicate');
    expect(ae.details).toEqual({ key: 'sku' });
  });

  it('returns Ok(value) when safeCall happy path completes', async () => {
    const r = await safeCall(async () => 99);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(99);
  });

  it('returns Err with fallback code when safeCall throws a plain Error', async () => {
    const r = await safeCall(async () => {
      throw new Error('disk full');
    }, 'DB_ERROR');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('DB_ERROR');
      expect(r.error.message).toBe('disk full');
    }
  });

  it('maps NestJS BadRequestException to BAD_REQUEST when safeCall catches one', async () => {
    const r = await safeCall(async () => {
      throw new BadRequestException('bad input');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('maps NestJS NotFoundException to NOT_FOUND when safeCall catches one', async () => {
    const r = await safeCall(async () => {
      throw new NotFoundException('no such row');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns parsed object when safeJsonParse receives valid JSON', () => {
    const v = safeJsonParse<{ a: number }>('{"a":1}');
    expect(v).toEqual({ a: 1 });
  });

  it('returns null when safeJsonParse receives malformed JSON', () => {
    const v = safeJsonParse<{ a: number }>('{not-json');
    expect(v).toBeNull();
  });
});
