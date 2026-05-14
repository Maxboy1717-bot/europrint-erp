/**
 * test/shared/result-class.spec.ts
 *
 * Tests for the class-based Result<T> in modules/shared/domain/result.ts.
 * This variant exposes Result.ok(), Result.fail(), .getValue(), .value, etc.
 * Both result patterns coexist in the codebase; this verifies the class one.
 */

import { InternalServerErrorException } from '@nestjs/common';
import { Result } from '../../src/modules/shared/domain/result';

describe('Result (class-based)', () => {
  it('ok() creates success result', () => {
    const r = Result.ok<number>(42);
    expect(r.isSuccess).toBe(true);
    expect(r.isFailure).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.value).toBe(42);
    expect(r.data).toBe(42);
    expect(r.getValue()).toBe(42);
    expect(r.getError()).toBe('');
  });

  it('fail() creates failure result', () => {
    const r = Result.fail<number>('oh no');
    expect(r.isSuccess).toBe(false);
    expect(r.isFailure).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('oh no');
    expect(r.getError()).toBe('oh no');
    expect(r.getErrorValue()).toBe('oh no');
  });

  it('getValue() throws on failure', () => {
    const r = Result.fail<number>('boom');
    expect(() => r.getValue()).toThrow(InternalServerErrorException);
  });

  it('ok() without value succeeds (void)', () => {
    const r = Result.ok<void>();
    expect(r.isSuccess).toBe(true);
    expect(r.value).toBeUndefined();
  });

  it('toJSON() serializes ok shape', () => {
    expect(Result.ok({ a: 1 }).toJSON()).toEqual({ ok: true, data: { a: 1 } });
  });

  it('toJSON() serializes failure shape', () => {
    expect(Result.fail<number>('x').toJSON()).toEqual({ ok: false, error: 'x' });
  });

  it('preserves falsy values (0, null, "", false)', () => {
    expect(Result.ok(0).value).toBe(0);
    expect(Result.ok('').value).toBe('');
    expect(Result.ok(null).value).toBeNull();
    expect(Result.ok(false).value).toBe(false);
  });

  it('preserves empty array', () => {
    const r = Result.ok<unknown[]>([]);
    expect(Array.isArray(r.value)).toBe(true);
    expect(r.value.length).toBe(0);
  });
});
