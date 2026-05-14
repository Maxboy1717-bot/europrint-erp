/**
 * @module result
 * @description Class-based Result<T> used by legacy domain modules. New code
 * should prefer the discriminated-union from `@common/result`. Both shapes
 * serialize identically through `toJSON()` so consumers can mix-and-match.
 */

import { InternalServerErrorException } from '@nestjs/common';

/**
 * Class-based Result. Use the static factories `Result.ok(...)` / `Result.fail(...)`;
 * the constructor is private.
 * @template T - success payload type
 */
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string,
  ) {}

  /** Construct a success result. @param value - payload (omit for void) */
  static ok<T>(value?: T): Result<T> { return new Result<T>(true, value); }

  /** Construct a failure result. @param error - human-readable message */
  static fail<T>(error: string): Result<T> { return new Result<T>(false, undefined, error); }

  /**
   * @returns the wrapped value
   * @throws InternalServerErrorException on failure
   */
  getValue(): T {
    if (!this.isSuccess) throw new InternalServerErrorException(this._error);
    return this._value as T;
  }

  /** @returns failure message, or '' on success */
  getError(): string { return this._error || ''; }
  /** Alias for {@link getError}. */
  getErrorValue(): string { return this._error || ''; }

  /** Direct field accessor; returns undefined on failure (no throw). */
  get value(): T { return this._value as T; }
  /** Failure message accessor; '' on success. */
  get error(): string { return this._error || ''; }
  /** Inverse of isSuccess. */
  get isFailure(): boolean { return !this.isSuccess; }

  /** Bridge to discriminated-union shape (ok property). */
  get ok(): boolean { return this.isSuccess; }
  /** Bridge to discriminated-union shape (data property). */
  get data(): T { return this._value as T; }

  /**
   * Serializes to the same JSON shape as `@common/result` Ok/Err, so the
   * frontend cannot tell which Result variant the backend used.
   */
  toJSON(): object {
    return this.isSuccess
      ? { ok: true, data: this._value }
      : { ok: false, error: this._error };
  }
}

export type ResultType<T> = Result<T>;
